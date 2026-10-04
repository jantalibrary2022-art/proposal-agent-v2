// Automatic offers: the site applies them by itself, no code needed.
// Phase 1 has one offer, "founding": half the fee on a user's FIRST paid
// proposal, for the first N paying users. Places are counted at payment.
// Switching the offer off (Admin → Offers) removes it everywhere at once.
// If the offers table is missing, everything behaves as if there is no offer.

export type Offer = { id: string; code: string; name: string; kind: "percent" | "fixed"; value: number; max_total: number | null; audience: string; starts_at: string | null; ends_at: string | null; active: boolean };
export type OfferState = { offer: Offer; used: number; remaining: number | null };

export const FOUNDING = "founding";

export async function getOfferState(admin: any, code = FOUNDING): Promise<OfferState | null> {
  try {
    const { data: o, error } = await admin.from("offers").select("*").eq("code", code).maybeSingle();
    if (error || !o) return null;
    const { count, error: cErr } = await admin.from("purchases").select("id", { count: "exact", head: true }).eq("offer_code", code).eq("status", "paid");
    if (cErr) return null;
    const used = count || 0;
    const remaining = o.max_total == null ? null : Math.max(0, o.max_total - used);
    return { offer: { ...o, value: Number(o.value) }, used, remaining };
  } catch { return null; }
}

// Live = switched on, inside its dates, and places left.
export function isLive(s: OfferState | null, now = Date.now()): boolean {
  if (!s || !s.offer.active) return false;
  if (s.offer.starts_at && now < Date.parse(s.offer.starts_at)) return false;
  if (s.offer.ends_at && now > Date.parse(s.offer.ends_at)) return false;
  if (s.remaining !== null && s.remaining <= 0) return false;
  return true;
}

export function applyOffer(fullPaise: number, offer: Offer): number {
  const amt = offer.kind === "percent"
    ? Math.round(fullPaise * (1 - Math.min(100, Math.max(0, offer.value)) / 100))
    : fullPaise - Math.round(offer.value * 100);
  // Whole rupees, rounded down (₹6,999 at 50% → ₹3,499, not ₹3,499.50).
  return Math.max(100, Math.floor(amt / 100) * 100);
}

// First purchase = the user has no paid purchase yet. On any read error, no offer.
export async function hasPaidBefore(admin: any, userId: string): Promise<boolean> {
  try {
    const { count, error } = await admin.from("purchases").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "paid");
    if (error) return true;
    return (count || 0) > 0;
  } catch { return true; }
}

// The offer this user gets right now, if any.
export async function offerForUser(admin: any, userId: string): Promise<OfferState | null> {
  const s = await getOfferState(admin);
  if (!s || !isLive(s)) return null;
  if (s.offer.audience === "first_purchase" && (await hasPaidBefore(admin, userId))) return null;
  return s;
}

// What public pages need to show the offer (null when not live).
export type PublicOffer = { code: string; name: string; kind: "percent" | "fixed"; value: number; remaining: number | null; total: number | null; fullPaise: number; offerPaise: number };
export async function publicOffer(admin: any, fullPaise: number): Promise<PublicOffer | null> {
  const s = await getOfferState(admin);
  if (!s || !isLive(s)) return null;
  return { code: s.offer.code, name: s.offer.name, kind: s.offer.kind, value: s.offer.value, remaining: s.remaining, total: s.offer.max_total, fullPaise, offerPaise: applyOffer(fullPaise, s.offer) };
}
