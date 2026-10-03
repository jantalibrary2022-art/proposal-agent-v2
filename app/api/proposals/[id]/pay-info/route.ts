import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { paywallEnabled } from "../../../../../lib/coupons";
import { isEntitled } from "../../../../../lib/entitlement";
import { pricePaise, razorpayConfigured } from "../../../../../lib/razorpay";

export const runtime = "nodejs";

// Tells the review page whether this proposal needs payment before finalising.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const { data: row } = await supabase.from("proposals").select("id").eq("id", id).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  const entitled = await isEntitled(admin, id);
  return NextResponse.json({
    ok: true,
    paywall: paywallEnabled(),
    entitled,
    locked: paywallEnabled() && !entitled,
    amountPaise: pricePaise(),
    currency: "INR",
    razorpayReady: razorpayConfigured(),
  });
}
