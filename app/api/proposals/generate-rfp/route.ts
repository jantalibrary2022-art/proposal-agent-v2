import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runRfpDraft } from "../../../../lib/run-rfp";
import { normalizeCode, validateCoupon, redeemCoupon, paywallEnabled } from "../../../../lib/coupons";

export const runtime = "nodejs";

function outputLanguage(v: unknown): "English" | "Hindi" {
  return v === "Hindi" ? "Hindi" : "English";
}

export const maxDuration = 60;

function toEngineAnswers(f: any) {
  return {
    project_idea: f.idea,
    geography: f.location,
    target_group: { group: f.beneficiaries, scale: "" },
    duration: f.duration,
    budget: f.budget ? f.budget : "",
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
  if (!form || !form.rfp_text || !String(form.rfp_text).trim()) {
    return NextResponse.json({ ok: false, error: "missing_rfp" }, { status: 400 });
  }
  if (!form.idea || !String(form.idea).trim()) {
    return NextResponse.json({ ok: false, error: "missing_idea" }, { status: 400 });
  }

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
  } else if (paywallEnabled()) {
    return NextResponse.json({ ok: false, error: "payment_required" }, { status: 402 });
  }

  const admin = createAdminClient();
  const engineAnswers = toEngineAnswers(form);
  const rfpText = String(form.rfp_text);

  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "rfp", status: "generating", title: String(form.idea).slice(0, 120), answers: form, org_profile_id: orgProfileId })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  if (couponCode) {
    const red = await redeemCoupon(couponCode, user.id, user.email ?? null, proposalId);
    if (!red.ok) {
      await admin.from("proposals").update({ status: "error", error: "coupon_redeem_failed:" + (red.reason || ""), updated_at: new Date().toISOString() }).eq("id", proposalId);
      return NextResponse.json({ ok: false, error: "coupon_redeem_failed", reason: red.reason }, { status: 400 });
    }
  }

  (async () => {
    try {
      const draft = await runRfpDraft(rfpText, engineAnswers, engineOrg, { analysis: form.rfp_analysis && typeof form.rfp_analysis === "object" ? form.rfp_analysis : null, language: outputLanguage(form.output_language) });
      const a = draft.analysis || {};
      const meta = {
        ...draft.meta,
        rfp: {
          donor: a.donor || draft.meta.donor || "",
          eligibility_check: a.eligibility_check || [],
          questions_for_user: a.questions_for_user || [],
          compliance_notes: a.compliance_notes || [],
          mandatory_components: a.mandatory_components || [],
          prescribed_format: a.prescribed_format || null,
          deadline: a.deadline || "",
        },
      };
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: (e && e.message) || "generation_failed", updated_at: new Date().toISOString() }).eq("id", proposalId);
      try { await admin.from("error_alerts").insert({ user_id: user.id, proposal_id: proposalId, mode: "rfp", message: (e && e.message) || "generation_failed" }); } catch {}
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
