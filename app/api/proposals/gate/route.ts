import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { draftGate } from "../../../../lib/drafts";
import { razorpayConfigured } from "../../../../lib/razorpay";
import { offerForUser, applyOffer } from "../../../../lib/offers";

export const runtime = "nodejs";

// Whether the signed-in user may start a new proposal for free, must pay
// upfront, or is at the unpaid-draft limit. Used by the new-proposal pages.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  const admin = createAdminClient();
  const g = await draftGate(admin, user.id);
  const st = g.enforced && g.mode !== "free" ? await offerForUser(admin, user.id) : null;
  return NextResponse.json({
    ok: true,
    enforced: g.enforced,
    mode: g.mode,
    unpaidOpen: g.unpaidOpen,
    max: g.max,
    hasCredit: !!g.creditId,
    pricePaise: st ? applyOffer(g.pricePaise, st.offer) : g.pricePaise,
    nextSlotAt: g.nextSlotAt,
    razorpayReady: razorpayConfigured(),
  });
}
