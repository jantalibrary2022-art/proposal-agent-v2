import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { draftGate } from "../../../../lib/drafts";
import { razorpayConfigured } from "../../../../lib/razorpay";

export const runtime = "nodejs";

// Whether the signed-in user may start a new proposal for free, must pay
// upfront, or is at the unpaid-draft limit. Used by the new-proposal pages.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  const g = await draftGate(createAdminClient(), user.id);
  return NextResponse.json({
    ok: true,
    enforced: g.enforced,
    mode: g.mode,
    unpaidOpen: g.unpaidOpen,
    max: g.max,
    hasCredit: !!g.creditId,
    pricePaise: g.pricePaise,
    nextSlotAt: g.nextSlotAt,
    razorpayReady: razorpayConfigured(),
  });
}
