import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { reviseSection } from "../../../../../lib/revise-section";
import { paywallEnabled } from "../../../../../lib/coupons";
import { isEntitled } from "../../../../../lib/entitlement";
import { sectionKeys, readSection } from "../../../../../lib/sections";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cap on agent revisions per proposal. Counted server-side so it cannot be
// bypassed from the browser, and so the Claude API cost per proposal is bounded.
const REVISE_CAP = 25;

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
  if (!comment.trim()) return NextResponse.json({ ok: false, error: "empty_comment" }, { status: 400 });

  const { data: row } = await supabase.from("proposals").select("id,status,substance,composed,meta").eq("id", id).single();
  if (!row || !row.substance) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (row.status !== "draft") return NextResponse.json({ ok: false, error: "not_draft" }, { status: 409 });

  // Valid section keys depend on the proposal's own structure (house default, or a
  // donor-prescribed list), so gate against that rather than a fixed array.
  if (!sectionKeys(row.composed).includes(section)) return NextResponse.json({ ok: false, error: "bad_section" }, { status: 400 });

  // Revision is a paid feature: only entitled proposals may call the engine, so
  // an unpaid draft cannot consume Claude API by hitting this endpoint directly.
  const admin = createAdminClient();
  if (paywallEnabled() && !(await isEntitled(admin, id))) {
    return NextResponse.json({ ok: false, error: "not_entitled" }, { status: 403 });
  }

  const used = Number((row.meta && (row.meta as any).revise_count) || 0);
  if (used >= REVISE_CAP) return NextResponse.json({ ok: false, error: "limit_reached", remaining: 0 }, { status: 429 });

  const s: any = row.substance || {};
  const c: any = row.composed || {};
  const grounding = {
    title: c.title, subtitle: c.subtitle,
    theme: s.theme, geography: s.geography, target: s.target, duration: s.duration,
    objective: s.objective, problem_facts: s.problem_facts, results: s.results,
    strategy_facts: s.strategy_facts, activities_facts: s.activities_facts, sources: s.sources,
  };
  const base = currentText.trim() ? currentText : readSection(row.composed, section);

  try {
    const r = await reviseSection({ section, currentText: base, comment, grounding });
    // The engine was called, so this counts toward the cap whether or not the
    // output parsed. Persist the new count with the service role.
    const nextCount = used + 1;
    try {
      await admin.from("proposals").update({ meta: { ...(row.meta || {}), revise_count: nextCount } }).eq("id", id);
    } catch {}
    const remaining = Math.max(0, REVISE_CAP - nextCount);
    if (!r._parsed) return NextResponse.json({ ok: false, error: "parse_failed", stop: r._stop, remaining }, { status: 502 });
    return NextResponse.json({ ok: true, note: r.data.note || "", revised: r.data.revised || base, changed: !!r.data.changed, remaining });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "revise_failed" }, { status: 500 });
  }
}
