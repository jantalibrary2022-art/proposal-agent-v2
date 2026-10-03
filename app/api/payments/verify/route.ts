import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyPaymentSignature, ensureCaptured } from "../../../../lib/razorpay";
import { recordPaidPurchase } from "../../../../lib/payments";

export const runtime = "nodejs";

// Called by the checkout success handler. Verifies the signature, makes sure
// the payment is CAPTURED (captures it if only authorized), then records a paid
// purchase (idempotent) which unlocks finalise + download for the proposal.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let b: any = {};
  try { b = await req.json(); } catch {}
  const proposalId = String(b.proposalId || "");
  const orderId = String(b.razorpay_order_id || "");
  const paymentId = String(b.razorpay_payment_id || "");
  const signature = String(b.razorpay_signature || "");
  if (!proposalId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  // Ownership check.
  const { data: row } = await supabase.from("proposals").select("id").eq("id", proposalId).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  let captured;
  try { captured = await ensureCaptured(paymentId); }
  catch (e: any) { return NextResponse.json({ ok: false, error: (e && e.message) || "capture_check_failed" }, { status: 502 }); }
  if (!captured) return NextResponse.json({ ok: false, error: "payment_not_captured" }, { status: 402 });

  const admin = createAdminClient();
  await recordPaidPurchase(admin, { userId: user.id, proposalId, paymentId, amountPaise: captured.amount });

  return NextResponse.json({ ok: true });
}
