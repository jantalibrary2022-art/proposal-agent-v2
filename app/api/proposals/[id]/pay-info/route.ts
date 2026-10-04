import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { paywallEnabled } from "../../../../../lib/coupons";
import { isEntitled } from "../../../../../lib/entitlement";
import { razorpayConfigured } from "../../../../../lib/razorpay";
import { priceFor } from "../../../../../lib/pricing";
import { draftDates, isPastExpiry, isTracked } from "../../../../../lib/drafts";

export const runtime = "nodejs";

// Tells the review page whether this proposal needs payment before finalising.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const { data: row } = await supabase.from("proposals").select("id,status,created_at").eq("id", id).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  const entitled = await isEntitled(admin, id);
  const price = await priceFor(admin, id);
  const locked = paywallEnabled() && !entitled;
  const tracked = locked && (await isTracked(admin, id));
  const dates = tracked && row.created_at ? draftDates(row.created_at) : null;
  const expired = tracked && row.status === "draft" && !!row.created_at && isPastExpiry(row.created_at);
  return NextResponse.json({
    expired,
    expiresAt: locked && dates ? dates.expiresAt : null,
    deleteAt: locked && dates ? dates.deleteAt : null,
    ok: true,
    paywall: paywallEnabled(),
    entitled,
    locked,
    amountPaise: price.amountPaise,
    fullPaise: price.fullPaise,
    discountKind: price.discountKind || null,
    discountValue: price.discountValue ?? null,
    discountCode: price.code || null,
    offerCode: price.offerCode || null,
    offerName: price.offerName || null,
    currency: "INR",
    razorpayReady: razorpayConfigured(),
  });
}
