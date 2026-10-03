// Is a proposal entitled to be finalised and downloaded? True when the paywall
// is off, or a coupon/token was redeemed for it, or a paid purchase exists for
// it. Uses the service-role (admin) client.
import { paywallEnabled } from "./coupons";

export async function isEntitled(admin: any, proposalId: string): Promise<boolean> {
  if (!paywallEnabled()) return true;
  if (!proposalId) return false;

  const { data: red } = await admin
    .from("coupon_redemptions")
    .select("id")
    .eq("proposal_id", proposalId)
    .limit(1)
    .maybeSingle();
  if (red) return true;

  const { data: pur } = await admin
    .from("purchases")
    .select("id")
    .eq("proposal_id", proposalId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  if (pur) return true;

  return false;
}
