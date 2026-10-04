import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyWebhookSignature, ensureCaptured, fetchOrderNotes } from "../../../../lib/razorpay";
import { recordPaidPurchase, recordPrepaidCredit } from "../../../../lib/payments";

export const runtime = "nodejs";

// Backup source of truth. Razorpay posts payment.authorized / payment.captured /
// order.paid here. Verify the signature against the RAW body, capture if only
// authorized, then ensure a paid purchases row exists for the proposal. Covers
// the case where the browser callback is lost.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  let event: any = {};
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  const type = event?.event || "";
  if (type !== "payment.authorized" && type !== "payment.captured" && type !== "order.paid") {
    return NextResponse.json({ ok: true });
  }

  const payment = event?.payload?.payment?.entity || null;
  const order = event?.payload?.order?.entity || null;
  // Trust only the notes WE set on the order (fetched from Razorpay), never the
  // payment's notes, which the browser can set in Checkout.
  const orderId = String((payment && payment.order_id) || (order && order.id) || "");
  if (!orderId) return NextResponse.json({ ok: true });
  let notes: any = {};
  try { notes = await fetchOrderNotes(orderId); }
  catch { return NextResponse.json({ ok: false, error: "order_fetch_failed" }, { status: 500 }); } // Razorpay will retry
  const proposalId = String(notes.proposalId || "");
  const userId = String(notes.userId || "");
  const paymentId = String((payment && payment.id) || "");
  const prepay = String(notes.prepay || "") === "1";
  if ((!proposalId && !prepay) || !userId || !paymentId) return NextResponse.json({ ok: true });

  let captured;
  try { captured = await ensureCaptured(paymentId); }
  catch { return NextResponse.json({ ok: false, error: "capture_check_failed" }, { status: 500 }); } // Razorpay will retry
  if (!captured) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  if (captured.order_id && captured.order_id !== orderId) return NextResponse.json({ ok: true });
  if (prepay) await recordPrepaidCredit(admin, { userId, paymentId, amountPaise: captured.amount, offerCode: notes.offerCode || undefined });
  else await recordPaidPurchase(admin, { userId, proposalId, paymentId, amountPaise: captured.amount, offerCode: notes.offerCode || undefined });
  return NextResponse.json({ ok: true });
}
