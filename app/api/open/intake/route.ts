import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { openIntake } from "../../../../lib/open-intake";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  let body: any = null;
  try { body = await req.json(); } catch { body = null; }
  if (!body) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const mode = body.mode === "ideate" ? "ideate" : "direct";
  if (mode === "direct" && (!body.idea || !String(body.idea).trim())) {
    return NextResponse.json({ ok: false, error: "missing_idea" }, { status: 400 });
  }

  let engineOrg: any;
  if (body.quick_profile && String(body.quick_profile.name || "").trim()) {
    engineOrg = minimalOrgProfile(body.quick_profile);
  } else {
    let profile: any = null;
    if (body.org_profile_id) {
      const r = await supabase.from("org_profiles").select("*").eq("id", body.org_profile_id).single();
      profile = r.data || null;
    }
    if (!profile) {
      const r = await supabase.from("org_profiles").select("*").eq("user_id", user.id).eq("is_default", true).single();
      profile = r.data || null;
    }
    if (!profile) return NextResponse.json({ ok: false, error: "no_profile" }, { status: 400 });
    engineOrg = toOrgProfile(profile);
  }

  try {
    if (mode === "ideate") {
      const hints = { note: String(body.hints || "").trim() };
      const r = await openIntake({ orgProfile: engineOrg, hints }, { mode: "ideate" });
      if (!r._parsed) return NextResponse.json({ ok: false, error: "could_not_ideate" }, { status: 502 });
      return NextResponse.json({ ok: true, data: r.data });
    }
    const answers = {
      has_idea: true,
      project_about: String(body.idea),
      geography: body.location ? String(body.location) : "",
      target_group: body.beneficiaries ? { group: String(body.beneficiaries), scale: "" } : null,
      duration: body.duration ? String(body.duration) : "",
      budget: body.budget ? String(body.budget) : null,
      donor: body.funder ? String(body.funder) : null,
    };
    const r = await openIntake({ orgProfile: engineOrg, answers }, { mode: "direct" });
    if (!r._parsed) return NextResponse.json({ ok: false, error: "could_not_read_idea" }, { status: 502 });
    return NextResponse.json({ ok: true, data: r.data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "intake_failed" }, { status: 500 });
  }
}
