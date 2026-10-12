// Is a proposal entitled to be finalised and downloaded? True when the paywall
// is off, or a FREE (100%) code was redeemed for it (or a discount reduced it to
// zero), or a paid purchase exists for it. Percent / fixed codes only lower the
// price; they do not unlock by themselves. Uses the service-role (admin) client.
import { paywallEnabled } from "./coupons";
import { priceFor } from "./pricing";

export async function isEntitled(admin: any, proposalId: string): Promise<boolean> {
  if (!paywallEnabled()) return true;
  if (!proposalId) return false;

  // Concept notes are free-tier by default: they are not gated by the per-proposal
  // proposal paywall. The free-tier quota (1/month within the 2-month window, else
  // the ₹1,999 paid path) is enforced separately at generation time. Until that
  // quota lands, a concept note is always viewable and finalisable.
  const { data: modeRow } = await admin.from("proposals").select("mode").eq("id", proposalId).maybeSingle();
  if (modeRow?.mode === "concept") return true;

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
