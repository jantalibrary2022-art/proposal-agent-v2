import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isEntitled } from "../../../../lib/entitlement";
import { createOrder, razorpayConfigured, razorpayKeyId } from "../../../../lib/razorpay";
import { priceFor } from "../../../../lib/pricing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  if (!razorpayConfigured()) return NextResponse.json({ ok: false, error: "razorpay_not_configured" }, { status: 400 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const proposalId = String(body.proposalId || "");
  if (!proposalId) return NextResponse.json({ ok: false, error: "missing_proposal" }, { status: 400 });

  // Ownership (user-scoped select, RLS limits to their rows).
  const { data: row } = await supabase.from("proposals").select("id,status").eq("id", proposalId).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  if (await isEntitled(admin, proposalId)) return NextResponse.json({ ok: true, already: true });

  const price = await priceFor(admin, proposalId);
  if (price.free) return NextResponse.json({ ok: true, already: true });
  const amount = price.amountPaise;
  try {
    const order = await createOrder(amount, proposalId, { proposalId, userId: user.id });
    return NextResponse.json({ ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: razorpayKeyId() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "order_failed" }, { status: 500 });
  }
}
