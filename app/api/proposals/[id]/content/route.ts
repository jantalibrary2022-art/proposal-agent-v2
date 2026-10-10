import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { paywallEnabled } from "../../../../../lib/coupons";
import { isEntitled } from "../../../../../lib/entitlement";

export const runtime = "nodejs";

// How much of each section an UNPAID draft is allowed to receive. The review page
// shows the first 700 characters of a locked section (LOCK_CHARS) behind a fade;
// this keeps a little headroom above that so the on-screen preview is unchanged,
// while the full clean draft never leaves the server for an unpaid viewer.
const PREVIEW_CHARS = 900;

function truncate(s: any): string {
  const t = String(s == null ? "" : s);
  if (t.length <= PREVIEW_CHARS) return t;
  return t.slice(0, PREVIEW_CHARS).replace(/\s+\S*$/, "") + "…";
}

// Return a composed object of the SAME shape with every section body truncated.
// Title and subtitle are left whole (short, and shown in the preview anyway).
function truncateComposed(composed: any): any {
  const c = composed || {};
  const out: any = { title: c.title || "", subtitle: c.subtitle || "" };
  if (Array.isArray(c.sections) && c.sections.length) {
    out.sections = c.sections.map((s: any) => ({ ...s, body: truncate(s && s.body) }));
    return out;
  }
  ["problem", "objective", "strategy", "results_narrative", "activities", "sustainability"].forEach((k) => {
    out[k] = truncate(c[k]);
  });
  return out;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin.from("proposals").select("id,user_id,status,composed,substance").eq("id", id).single();
  if (!row || row.user_id !== user.id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // A finalised proposal, or any proposal the viewer is entitled to (paid, or a
  // redeemed code, or the paywall is off), gets the full content. An unpaid draft
  // gets only the truncated preview, and a minimal substance: just the budget
  // table, which the locked review intentionally shows for pre-payment rate edits.
  const full = row.status !== "draft" || !paywallEnabled() || (await isEntitled(admin, id));
  if (full) {
    return NextResponse.json({ ok: true, full: true, composed: row.composed || null, substance: row.substance || null });
  }
  const substance = row.substance || {};
  return NextResponse.json({
    ok: true,
    full: false,
    composed: truncateComposed(row.composed),
    substance: { budget_table: substance.budget_table || null },
  });
}
