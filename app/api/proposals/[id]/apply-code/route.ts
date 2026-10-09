import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { paywallEnabled, validateCoupon, redeemCoupon } from "../../../../../lib/coupons";
import { isEntitled } from "../../../../../lib/entitlement";

export const runtime = "nodejs";

// Apply a discount / access code to an existing draft at the payment step.
// Redeems the code against this proposal; priceFor then reflects the lower price,
// and a free (100%) code makes the proposal entitled, unlocking it with no payment.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let code = "";
  try { code = String((await req.json()).code || ""); } catch {}
  if (!code.trim()) return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });

  // Ownership (RLS-scoped select).
  const { data: row } = await supabase.from("proposals").select("id,status").eq("id", id).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (row.status !== "draft") return NextResponse.json({ ok: false, reason: "not_draft" }, { status: 409 });

  const admin = createAdminClient();
  if (!paywallEnabled()) return NextResponse.json({ ok: true, already: true });
  if (await isEntitled(admin, id)) return NextResponse.json({ ok: true, already: true });

  // Friendly pre-check, then the authoritative, atomic redemption.
  const chk = await validateCoupon(code, user.email);
  if (!chk.ok) return NextResponse.json({ ok: false, reason: chk.reason || "invalid" }, { status: 400 });

  const red = await redeemCoupon(code, user.id, user.email ?? null, id);
  if (!red.ok) return NextResponse.json({ ok: false, reason: red.reason || "invalid" }, { status: 400 });

  return NextResponse.json({ ok: true, kind: red.kind, free: red.kind === "free" });
}
