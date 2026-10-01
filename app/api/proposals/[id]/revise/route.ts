import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { reviseSection } from "../../../../../lib/revise-section";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = ["title","subtitle","problem","objective","strategy","results_narrative","activities","sustainability"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const section = String(body.section || "");
  const comment = String(body.comment || "");
  const currentText = String(body.currentText || "");
  if (!ALLOWED.includes(section)) return NextResponse.json({ ok: false, error: "bad_section" }, { status: 400 });
  if (!comment.trim()) return NextResponse.json({ ok: false, error: "empty_comment" }, { status: 400 });

  const { data: row } = await supabase.from("proposals").select("id,status,substance,composed").eq("id", id).single();
  if (!row || !row.substance) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (row.status !== "draft") return NextResponse.json({ ok: false, error: "not_draft" }, { status: 409 });

  const s: any = row.substance || {};
  const c: any = row.composed || {};
  const grounding = {
    title: c.title, subtitle: c.subtitle,
    theme: s.theme, geography: s.geography, target: s.target, duration: s.duration,
    objective: s.objective, problem_facts: s.problem_facts, results: s.results,
    strategy_facts: s.strategy_facts, activities_facts: s.activities_facts, sources: s.sources,
  };
  const base = currentText.trim() ? currentText : (c[section] || "");

  try {
    const r = await reviseSection({ section, currentText: base, comment, grounding });
    if (!r._parsed) return NextResponse.json({ ok: false, error: "parse_failed", stop: r._stop }, { status: 502 });
    return NextResponse.json({ ok: true, note: r.data.note || "", revised: r.data.revised || base, changed: !!r.data.changed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "revise_failed" }, { status: 500 });
  }
}
