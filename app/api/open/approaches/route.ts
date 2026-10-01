import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { suggestApproaches } from "../../../../lib/suggest-approaches";

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
  if (!body || !body.brief || typeof body.brief !== "object") {
    return NextResponse.json({ ok: false, error: "missing_brief" }, { status: 400 });
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

  const userDocs = body.evidence ? String(body.evidence) : "";

  try {
    const r = await suggestApproaches({ orgProfile: engineOrg, brief: body.brief, userDocs });
    if (!r._parsed) return NextResponse.json({ ok: false, error: "could_not_suggest" }, { status: 502 });
    return NextResponse.json({ ok: true, data: r.data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "approaches_failed" }, { status: 500 });
  }
}
