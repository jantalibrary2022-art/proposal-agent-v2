// What a given proposal costs, after any discount code redeemed for it.
// - no code      -> full price
// - free code    -> 0, no payment step
// - percent code -> price reduced by that percent
// - fixed code   -> price reduced by that amount (rupees)
// Never charges below Razorpay's ₹1 minimum; a discount that brings the price
// to zero or below is treated as free.
import { pricePaise } from "./razorpay";

export type ProposalPrice = {
  fullPaise: number;
  amountPaise: number;
  free: boolean;
  discountKind?: "free" | "percent" | "fixed";
  discountValue?: number;
  code?: string;
};

export async function priceFor(admin: any, proposalId: string): Promise<ProposalPrice> {
  const full = pricePaise();
  if (!proposalId) return { fullPaise: full, amountPaise: full, free: false };

  const { data: red } = await admin
    .from("coupon_redemptions")
    .select("code,kind,coupon_id,created_at")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!red) return { fullPaise: full, amountPaise: full, free: false };

  if (red.kind === "free") return { fullPaise: full, amountPaise: 0, free: true, discountKind: "free", code: red.code };

  const { data: c } = await admin.from("coupons").select("kind,value").eq("id", red.coupon_id).maybeSingle();
  const v = Number(c?.value) || 0;
  let amt = full;
  if (red.kind === "percent") amt = Math.round(full * (1 - Math.min(100, Math.max(0, v)) / 100));
  else if (red.kind === "fixed") amt = full - Math.round(v * 100);

  if (amt <= 0) return { fullPaise: full, amountPaise: 0, free: true, discountKind: red.kind, discountValue: v, code: red.code };
  return { fullPaise: full, amountPaise: Math.max(100, amt), free: false, discountKind: red.kind, discountValue: v, code: red.code };
}
