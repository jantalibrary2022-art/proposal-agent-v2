import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runOpenDraft } from "../../../../lib/run-open";

export const runtime = "nodejs";
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

  const admin = createAdminClient();
  const engineAnswers = toEngineAnswers(form);

  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "open", status: "generating", title: String(form.idea).slice(0, 120), answers: form, org_profile_id: orgProfileId })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  (async () => {
    try {
      const draft = await runOpenDraft(engineAnswers, engineOrg);
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta: draft.meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: (e && e.message) || "generation_failed", updated_at: new Date().toISOString() }).eq("id", proposalId);
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
