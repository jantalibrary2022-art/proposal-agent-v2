import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runConceptDraft } from "../../../../lib/run-concept";
import { genErrorMessage } from "../../../../lib/gen-errors";
import { progressReporter } from "../../../../lib/drafts";
import { sendProposalReady, sendProposalFailed } from "../../../../lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

function outputLanguage(v: unknown): "English" | "Hindi" {
  return v === "Hindi" ? "Hindi" : "English";
}

// The applicant's concept-note inputs, shaped for the concept intake.
function toConceptAnswers(f: any) {
  const funder = String(f.funder || "").trim();
  const undecided = /not decided|not sure|undecided|agnostic|^no$|^n\/a$/i.test(funder);
  return {
    idea: f.idea,
    geography: f.location,
    target_group: f.beneficiaries,
    duration: f.duration,
    budget: f.budget ? f.budget : null,
    donor: funder && !undecided ? funder : null,
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

  // Concept notes are free-tier by default. The free-tier quota (1/month within the
  // 2-month window, else the ₹1,999 paid path) is layered on in a later increment;
  // there is no per-proposal paywall gate here.
  const admin = createAdminClient();
  const engineAnswers = toConceptAnswers(form);

  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "concept", status: "generating", title: String(form.idea).slice(0, 120), answers: form, org_profile_id: orgProfileId })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  (async () => {
    try {
      const draft = await runConceptDraft(engineAnswers, engineOrg, {
        onProgress: progressReporter(admin, proposalId),
        formatDoc: form.format_doc_text ? String(form.format_doc_text) : null,
        applicantEvidence: form.applicant_evidence ? String(form.applicant_evidence) : null,
        language: outputLanguage(form.output_language),
      });
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta: draft.meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
      if (user.email) { try { await sendProposalReady(user.email, { id: proposalId }); } catch {} }
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: genErrorMessage(e), updated_at: new Date().toISOString() }).eq("id", proposalId);
      if (user.email) { try { await sendProposalFailed(user.email, { id: proposalId, busy: genErrorMessage(e).startsWith("busy:") }); } catch {} }
      try { await admin.from("error_alerts").insert({ user_id: user.id, proposal_id: proposalId, mode: "concept", message: genErrorMessage(e) }); } catch {}
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
