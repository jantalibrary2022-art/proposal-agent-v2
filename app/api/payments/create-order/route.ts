import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isEntitled } from "../../../../lib/entitlement";
import { createOrder, razorpayConfigured, razorpayKeyId } from "../../../../lib/razorpay";
import { priceFor } from "../../../../lib/pricing";
import { draftGate, draftDates, isTracked } from "../../../../lib/drafts";
import { offerForUser, applyOffer } from "../../../../lib/offers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  if (!razorpayConfigured()) return NextResponse.json({ ok: false, error: "razorpay_not_configured" }, { status: 400 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  // Pay upfront for the next proposal (unpaid-draft rules). Full price; a user
  // with a discount code enters it on the form instead and skips this.
  if (body.prepay) {
    const admin = createAdminClient();
    const g = await draftGate(admin, user.id);
    if (!g.enforced || g.creditId) return NextResponse.json({ ok: true, already: true });
    try {
      const st = await offerForUser(admin, user.id);
      const amount = st ? applyOffer(g.pricePaise, st.offer) : g.pricePaise;
      const notes: Record<string, string> = { prepay: "1", userId: user.id };
      if (st) notes.offerCode = st.offer.code;
      const order = await createOrder(amount, "pre-" + user.id.slice(0, 30), notes);
      return NextResponse.json({ ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: razorpayKeyId() });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: (e && e.message) || "order_failed" }, { status: 500 });
    }
  }

  const proposalId = String(body.proposalId || "");
  if (!proposalId) return NextResponse.json({ ok: false, error: "missing_proposal" }, { status: 400 });

  // Ownership (user-scoped select, RLS limits to their rows).
  const { data: row } = await supabase.from("proposals").select("id,status,created_at").eq("id", proposalId).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  if (await isEntitled(admin, proposalId)) return NextResponse.json({ ok: true, already: true });
  // An expired draft past its restore window is about to be deleted: don't take payment.
  if (row.status === "draft" && row.created_at && Date.now() >= Date.parse(draftDates(row.created_at).deleteAt) && (await isTracked(admin, proposalId))) {
    return NextResponse.json({ ok: false, error: "restore_window_closed" }, { status: 410 });
  }

  const price = await priceFor(admin, proposalId);
  if (price.free) return NextResponse.json({ ok: true, already: true });
  const amount = price.amountPaise;
  try {
    const notes: Record<string, string> = { proposalId, userId: user.id };
    if (price.offerCode) notes.offerCode = price.offerCode;
    const order = await createOrder(amount, proposalId, notes);
    return NextResponse.json({ ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId: razorpayKeyId() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "order_failed" }, { status: 500 });
  }
}
