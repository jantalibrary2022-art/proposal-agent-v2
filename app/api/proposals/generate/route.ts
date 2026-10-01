import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runOpenDraft } from "../../../../lib/run-open";
import { orgProfile } from "../../../../sample-org-profile";

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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let form: any = null;
  try { form = (await req.json()).answers; } catch { form = null; }
  if (!form || !form.idea) return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });

  const admin = createAdminClient();
  const engineAnswers = toEngineAnswers(form);

  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "open", status: "generating", title: String(form.idea).slice(0, 120), answers: form })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  (async () => {
    try {
      const draft = await runOpenDraft(engineAnswers, orgProfile);
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta: draft.meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: (e && e.message) || "generation_failed", updated_at: new Date().toISOString() }).eq("id", proposalId);
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
