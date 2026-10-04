// What a given proposal costs, after any discount code redeemed for it.
// - no code      -> full price
// - free code    -> 0, no payment step
// - percent code -> price reduced by that percent
// - fixed code   -> price reduced by that amount (rupees)
// Never charges below Razorpay's ₹1 minimum; a discount that brings the price
// to zero or below is treated as free.
import { pricePaise } from "./razorpay";
import { offerForUser, applyOffer } from "./offers";

export type ProposalPrice = {
  fullPaise: number;
  amountPaise: number;
  free: boolean;
  discountKind?: "free" | "percent" | "fixed" | "offer";
  offerCode?: string;
  offerName?: string;
  discountValue?: number;
  code?: string;
};

// Final price for a proposal: the better of any discount code redeemed for it and
// any automatic offer the owner qualifies for. Discounts never stack.
export async function priceFor(admin: any, proposalId: string): Promise<ProposalPrice> {
  const byCode = await codePrice(admin, proposalId);
  if (byCode.free || !proposalId) return byCode;
  try {
    const { data: row } = await admin.from("proposals").select("user_id").eq("id", proposalId).maybeSingle();
    if (!row?.user_id) return byCode;
    const st = await offerForUser(admin, row.user_id);
    if (!st) return byCode;
    const amt = applyOffer(byCode.fullPaise, st.offer);
    if (amt < byCode.amountPaise) {
      return { fullPaise: byCode.fullPaise, amountPaise: amt, free: false, discountKind: "offer", discountValue: st.offer.value, offerCode: st.offer.code, offerName: st.offer.name };
    }
  } catch {}
  return byCode;
}

async function codePrice(admin: any, proposalId: string): Promise<ProposalPrice> {
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
