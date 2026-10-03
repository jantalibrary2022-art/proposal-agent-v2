import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { verifyPaymentSignature, pricePaise, newInvoiceNo } from "../../../../lib/razorpay";

export const runtime = "nodejs";

// Called by the checkout success handler. Verifies the signature and records a
// paid purchase (idempotent) which unlocks finalise + download for the proposal.
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

  const admin = createAdminClient();

  // Idempotent: don't double-record the same payment or re-charge a paid proposal.
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .or(`payment_ref.eq.${paymentId},and(proposal_id.eq.${proposalId},status.eq.paid)`)
    .limit(1)
    .maybeSingle();
  if (!existing) {
    await admin.from("purchases").insert({
      user_id: user.id,
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
