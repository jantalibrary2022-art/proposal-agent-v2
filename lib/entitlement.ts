// Is a proposal entitled to be finalised and downloaded? True when the paywall
// is off, or a FREE (100%) code was redeemed for it (or a discount reduced it to
// zero), or a paid purchase exists for it. Percent / fixed codes only lower the
// price; they do not unlock by themselves. Uses the service-role (admin) client.
import { paywallEnabled } from "./coupons";
import { priceFor } from "./pricing";

export async function isEntitled(admin: any, proposalId: string): Promise<boolean> {
  if (!paywallEnabled()) return true;
  if (!proposalId) return false;

  const price = await priceFor(admin, proposalId);
  if (price.free) return true;

  const { data: pur } = await admin
    .from("purchases")
    .select("id")
    .eq("proposal_id", proposalId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  return !!pur;
}
