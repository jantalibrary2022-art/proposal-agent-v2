import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runImproveDraft } from "../../../../lib/run-improve";

export const runtime = "nodejs";

function outputLanguage(v: unknown): "English" | "Hindi" {
  return v === "Hindi" ? "Hindi" : "English";
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let form: any = null;
  try { form = (await req.json()).answers; } catch { form = null; }
  if (!form || !form.draft_text || String(form.draft_text).trim().length < 200) {
    return NextResponse.json({ ok: false, error: "missing_draft" }, { status: 400 });
  }

  const draftText = String(form.draft_text);
  const diagnosis = form.diagnosis && typeof form.diagnosis === "object" ? form.diagnosis : null;
  const qa = Array.isArray(form.qa) ? form.qa : [];
  const dmeta = (diagnosis && diagnosis.meta) || {};
  const title = String(dmeta.title || "Improved proposal").slice(0, 120);

  const admin = createAdminClient();
  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "improve", status: "generating", title, answers: { qa, meta: dmeta } })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  (async () => {
    try {
      const draft = await runImproveDraft(draftText, qa, { diagnosis, language: outputLanguage(form.output_language) });
      const meta = {
        ...draft.meta,
        improve: {
          strengths: (diagnosis && diagnosis.strengths) || [],
          weaknesses: (diagnosis && diagnosis.weaknesses) || [],
          source_authority_flags: (diagnosis && diagnosis.source_authority_flags) || [],
          improvements: draft.meta.improvements || [],
        },
      };
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: (e && e.message) || "generation_failed", updated_at: new Date().toISOString() }).eq("id", proposalId);
      try { await admin.from("error_alerts").insert({ user_id: user.id, proposal_id: proposalId, mode: "improve", message: (e && e.message) || "generation_failed" }); } catch {}
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
