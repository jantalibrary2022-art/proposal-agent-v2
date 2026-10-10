import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runOpenDraft } from "../../../../lib/run-open";
import { normalizeCode, validateCoupon, redeemCoupon } from "../../../../lib/coupons";
import { genErrorMessage } from "../../../../lib/gen-errors";
import { gateForGeneration, claimCredit, recordDraft, releaseOnFailure, progressReporter } from "../../../../lib/drafts";
import { priceFor } from "../../../../lib/pricing";
import { sendProposalReady, sendProposalFailed } from "../../../../lib/email";

export const runtime = "nodejs";

function outputLanguage(v: unknown): "English" | "Hindi" {
  return v === "Hindi" ? "Hindi" : "English";
}

export const maxDuration = 60;

function toEngineAnswers(f: any) {
  const funder = String(f.funder || "").trim();
  const undecided = /not decided|not sure|undecided|agnostic|^no$|^n\/a$/i.test(funder);
  return {
    has_idea: true,
    project_about: f.idea,
    geography: f.location,
    target_group: { group: f.beneficiaries, scale: "" },
    duration: f.duration,
    budget: f.budget ? f.budget : null,
    donor: funder && !undecided ? funder : null,
    must_include: "",
  };
}

function toOrgProfile(p: any) {
  const d = p.data || {};
  return {
    name: p.name,
    legal_status: d.legal_status,
    registration_year: d.registration_year,
    states_present: d.states_present || [],
    thematic_experience: d.thematic_experience || [],
    annual_revenue: d.annual_revenue,
    board_members: d.board_members,
    permanent_staff: d.permanent_staff,
    donor_concentration: d.donor_concentration,
    affiliations: d.affiliations,
    past_projects: d.past_projects || [],
    values: d.values,
    experience_summary: d.experience_summary,
    contact: d.contact || {},
    website: d.website || "",
    website_summary: d.website_summary || "",
  };
}

function minimalOrgProfile(q: any) {
  return {
    name: String(q.name || "").trim() || "The applicant organisation",
    experience_summary: String(q.about || "").trim(),
    states_present: [],
    thematic_experience: [],
    past_projects: [],
    values: "",
    contact: {},
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let form: any = null;
  try { form = (await req.json()).answers; } catch { form = null; }
  if (!form || !form.idea) return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });

  let engineOrg: any;
  let orgProfileId: string | null = null;

  if (form.quick_profile && String(form.quick_profile.name || "").trim()) {
    engineOrg = minimalOrgProfile(form.quick_profile);
  } else {
    let profile: any = null;
    if (form.org_profile_id) {
      const r = await supabase.from("org_profiles").select("*").eq("id", form.org_profile_id).single();
      profile = r.data || null;
    }
    if (!profile) {
      const r = await supabase.from("org_profiles").select("*").eq("user_id", user.id).eq("is_default", true).single();
      profile = r.data || null;
    }
    if (!profile) return NextResponse.json({ ok: false, error: "no_profile" }, { status: 400 });
    engineOrg = toOrgProfile(profile);
    orgProfileId = profile.id;
  }

  const couponCode = normalizeCode(form.coupon_code);
  if (couponCode) {
    const chk = await validateCoupon(couponCode, user.email);
    if (!chk.ok) return NextResponse.json({ ok: false, error: "invalid_coupon", reason: chk.reason }, { status: 400 });
  }

  const admin = createAdminClient();
  // Unpaid-draft rules: limit of open unpaid drafts, pay-first after an expiry.
  const gate = await gateForGeneration(admin, user.id, !!couponCode);
  if (gate.error) return NextResponse.json({ ok: false, error: gate.error }, { status: 402 });
  const engineAnswers = toEngineAnswers(form);

  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "open", status: "generating", title: String(form.idea).slice(0, 120), answers: form, org_profile_id: orgProfileId })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  if (gate.creditId && !(await claimCredit(admin, gate.creditId, proposalId))) {
    // The credit was taken by another request meanwhile: allow only if the user
    // may still generate without it.
    const again = await gateForGeneration(admin, user.id, !!couponCode);
    if (again.error || (again.creditId && !(await claimCredit(admin, again.creditId, proposalId)))) {
      await admin.from("proposals").delete().eq("id", proposalId);
      return NextResponse.json({ ok: false, error: again.error || "prepay_required" }, { status: 402 });
    }
  }

  if (couponCode) {
    const red = await redeemCoupon(couponCode, user.id, user.email ?? null, proposalId);
    if (!red.ok) {
      await admin.from("proposals").update({ status: "error", error: "coupon_redeem_failed:" + (red.reason || ""), updated_at: new Date().toISOString() }).eq("id", proposalId);
      await releaseOnFailure(admin, proposalId);
      return NextResponse.json({ ok: false, error: "coupon_redeem_failed", reason: red.reason }, { status: 400 });
    }
  }

  // Every draft goes in the ledger; one that is free (code brings price to 0) never counts.
  await recordDraft(admin, user.id, proposalId, couponCode ? (await priceFor(admin, proposalId)).free : false);

  (async () => {
    try {
      const draft = await runOpenDraft(engineAnswers, engineOrg, {
        onProgress: progressReporter(admin, proposalId),
        brief: form.brief && typeof form.brief === "object" ? form.brief : null,
        applicantEvidence: form.applicant_evidence ? String(form.applicant_evidence) : null,
        chosenApproach: form.chosen_approach && typeof form.chosen_approach === "object" ? form.chosen_approach : null,
        language: outputLanguage(form.output_language),
      });
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta: draft.meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
      if (user.email) { try { await sendProposalReady(user.email, { id: proposalId }); } catch {} }
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: genErrorMessage(e), updated_at: new Date().toISOString() }).eq("id", proposalId);
      await releaseOnFailure(admin, proposalId);
      if (user.email) { try { await sendProposalFailed(user.email, { id: proposalId, busy: genErrorMessage(e).startsWith("busy:") }); } catch {} }
      try { await admin.from("error_alerts").insert({ user_id: user.id, proposal_id: proposalId, mode: "open", message: genErrorMessage(e) }); } catch {}
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
