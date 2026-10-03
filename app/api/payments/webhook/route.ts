import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyWebhookSignature, pricePaise, newInvoiceNo } from "../../../../lib/razorpay";

export const runtime = "nodejs";

// Backup source of truth. Razorpay posts payment.captured / order.paid here.
// We verify the signature against the RAW body, then ensure a paid purchases row
// exists for the proposal. Primary unlock is the verify route; this covers cases
// where the browser callback is lost.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  let event: any = {};
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  const type = event?.event || "";
  if (type !== "payment.captured" && type !== "order.paid") return NextResponse.json({ ok: true });

  const payment = event?.payload?.payment?.entity || null;
  const order = event?.payload?.order?.entity || null;
  const notes = (payment && payment.notes) || (order && order.notes) || {};
  const proposalId = String(notes.proposalId || "");
  const userId = String(notes.userId || "");
  const paymentId = String((payment && payment.id) || (order && order.id) || "");
  if (!proposalId || !userId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .or(`payment_ref.eq.${paymentId},and(proposal_id.eq.${proposalId},status.eq.paid)`)
    .limit(1)
    .maybeSingle();
  if (!existing) {
    await admin.from("purchases").insert({
      user_id: userId,
      proposal_id: proposalId,
      description: "Prastav — Project proposal",
      amount: pricePaise() / 100,
      currency: "INR",
      status: "paid",
      invoice_no: newInvoiceNo(),
      payment_ref: paymentId,
      gateway: "razorpay",
    });
  }

  return NextResponse.json({ ok: true });
}
