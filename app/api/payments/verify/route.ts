import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyPaymentSignature, ensureCaptured, fetchOrderNotes } from "../../../../lib/razorpay";
import { recordPaidPurchase, recordPrepaidCredit } from "../../../../lib/payments";

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
  const prepay = !!b.prepay;
  const proposalId = String(b.proposalId || "");
  const orderId = String(b.razorpay_order_id || "");
  const paymentId = String(b.razorpay_payment_id || "");
  const signature = String(b.razorpay_signature || "");
  if ((!prepay && !proposalId) || !orderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  // The order must be the one we created for this purpose and this user, so a
  // payment for one thing cannot be claimed as another.
  let notes: Record<string, string> = {};
  try { notes = await fetchOrderNotes(orderId); }
  catch (e: any) { return NextResponse.json({ ok: false, error: "order_check_failed" }, { status: 502 }); }
  if (String(notes.userId || "") !== user.id) return NextResponse.json({ ok: false, error: "order_mismatch" }, { status: 400 });
  if (prepay ? String(notes.prepay || "") !== "1" : String(notes.proposalId || "") !== proposalId) {
    return NextResponse.json({ ok: false, error: "order_mismatch" }, { status: 400 });
  }

  if (prepay) {
    let cap;
    try { cap = await ensureCaptured(paymentId); }
    catch (e: any) { return NextResponse.json({ ok: false, error: (e && e.message) || "capture_check_failed" }, { status: 502 }); }
    if (!cap) return NextResponse.json({ ok: false, error: "payment_not_captured" }, { status: 402 });
    if (cap.order_id && cap.order_id !== orderId) {
      return NextResponse.json({ ok: false, error: "order_mismatch" }, { status: 400 });
    }
    await recordPrepaidCredit(createAdminClient(), { userId: user.id, paymentId, amountPaise: cap.amount });
    return NextResponse.json({ ok: true });
  }

  // Ownership check.
  const { data: row } = await supabase.from("proposals").select("id").eq("id", proposalId).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  let captured;
  try { captured = await ensureCaptured(paymentId); }
  catch (e: any) { return NextResponse.json({ ok: false, error: (e && e.message) || "capture_check_failed" }, { status: 502 }); }
  if (!captured) return NextResponse.json({ ok: false, error: "payment_not_captured" }, { status: 402 });
  if (captured.order_id && captured.order_id !== orderId) return NextResponse.json({ ok: false, error: "order_mismatch" }, { status: 400 });

  const admin = createAdminClient();
  await recordPaidPurchase(admin, { userId: user.id, proposalId, paymentId, amountPaise: captured.amount });

  return NextResponse.json({ ok: true });
}
