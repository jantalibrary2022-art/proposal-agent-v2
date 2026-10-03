// Unpaid-draft rules (only while the paywall is on).
//  - A draft stays open, unpaid, for DRAFT_OPEN_DAYS. After that it is EXPIRED:
//    locked, still restorable by paying for RESTORE_DAYS, then deleted.
//  - At most MAX_UNPAID_DRAFTS open unpaid drafts. Counted from the ledger, so
//    deleting a draft does not free a slot; paying for one does.
//  - Once a draft expires unpaid, new proposals need payment upfront until the
//    user pays for any proposal after that expiry.
//  - Drafts that failed to generate never count. Drafts made with a discount
//    code bypass the gate at creation; free-code drafts never count.
//  - A draft the user deleted before it expired counts toward the limit for its
//    7 days, but does not trigger pay-first. Deleting an already-expired draft
//    does not lift pay-first.
//  - Payment upfront creates a "prepaid" purchase with no proposal (a credit)
//    that attaches to the next generated proposal; released again if that fails.
import { paywallEnabled } from "./coupons";
import { pricePaise } from "./razorpay";

export const DRAFT_OPEN_DAYS = 7;
export const RESTORE_DAYS = 30;
export const MAX_UNPAID_DRAFTS = 2;
const DAY = 24 * 3600 * 1000;

export type DraftGate = {
  enforced: boolean;
  mode: "free" | "blocked" | "prepay";
  unpaidOpen: number;
  max: number;
  creditId: string | null;
  pricePaise: number;
  nextSlotAt: string | null; // when the oldest open unpaid draft expires (blocked mode)
};

export function draftDates(createdAt: string) {
  const t = Date.parse(createdAt);
  return { expiresAt: new Date(t + DRAFT_OPEN_DAYS * DAY).toISOString(), deleteAt: new Date(t + (DRAFT_OPEN_DAYS + RESTORE_DAYS) * DAY).toISOString() };
}

export function isPastExpiry(createdAt: string, now = Date.now()): boolean {
  return now - Date.parse(createdAt) >= DRAFT_OPEN_DAYS * DAY;
}

// Pure decision, separated for testing.
export function decideGate(input: {
  ledger: { proposal_id: string; created_at: string; failed: boolean; deleted?: boolean; free?: boolean }[];
  paid: { id: string; proposal_id: string | null; created_at: string; prepaid?: boolean }[];
  freeIds: string[];
  statusById: Record<string, string>;
  now?: number;
}): Omit<DraftGate, "enforced" | "pricePaise" | "max"> {
  const now = input.now ?? Date.now();
  const paidIds = new Set(input.paid.filter((p) => p.proposal_id).map((p) => p.proposal_id as string));
  // Only upfront payments are credits; legacy purchases without a proposal are not.
  const credit = input.paid.find((p) => !p.proposal_id && p.prepaid === true) || null;
  const freeIds = new Set(input.freeIds);
  const lastPaidAt = input.paid.reduce((m, p) => Math.max(m, Date.parse(p.created_at) || 0), 0);

  let unpaidOpen = 0;
  let prepay = false;
  let oldestOpen = Infinity;
  for (const l of input.ledger) {
    if (l.failed || l.free) continue;
    if (input.statusById[l.proposal_id] === "error") continue;
    if (paidIds.has(l.proposal_id) || freeIds.has(l.proposal_id)) continue;
    const t = Date.parse(l.created_at);
    if (now - t < DRAFT_OPEN_DAYS * DAY) {
      unpaidOpen++;
      oldestOpen = Math.min(oldestOpen, t);
    } else {
      if (l.deleted) continue; // deleted before it could expire: no pay-first
      const expiredAt = t + DRAFT_OPEN_DAYS * DAY;
      if (lastPaidAt < expiredAt) prepay = true;
    }
  }
  const mode = prepay ? "prepay" : unpaidOpen >= MAX_UNPAID_DRAFTS ? "blocked" : "free";
  return {
    mode,
    unpaidOpen,
    creditId: credit ? credit.id : null,
    nextSlotAt: mode === "blocked" && isFinite(oldestOpen) ? new Date(oldestOpen + DRAFT_OPEN_DAYS * DAY).toISOString() : null,
  };
}

export async function draftGate(admin: any, userId: string): Promise<DraftGate> {
  const base: DraftGate = { enforced: false, mode: "free", unpaidOpen: 0, max: MAX_UNPAID_DRAFTS, creditId: null, pricePaise: pricePaise(), nextSlotAt: null };
  if (!paywallEnabled()) return base;
  const [led, pur, red, props] = await Promise.all([
    admin.from("draft_ledger").select("proposal_id,created_at,failed,deleted,free").eq("user_id", userId),
    admin.from("purchases").select("id,proposal_id,created_at,prepaid").eq("user_id", userId).eq("status", "paid"),
    admin.from("coupon_redemptions").select("proposal_id,kind").eq("user_id", userId),
    admin.from("proposals").select("id,status").eq("user_id", userId),
  ]);
  if (led.error || pur.error) return base; // rules SQL not run yet: never block
  const statusById: Record<string, string> = {};
  for (const p of props.data || []) statusById[p.id] = p.status;
  const d = decideGate({
    ledger: led.data || [],
    paid: pur.data || [],
    freeIds: (red.data || []).filter((r: any) => r.kind === "free" && r.proposal_id).map((r: any) => r.proposal_id),
    statusById,
  });
  return { ...base, enforced: true, ...d };
}

// Attach an unused prepaid credit to a proposal. Returns false if it was taken meanwhile.
export async function claimCredit(admin: any, creditId: string, proposalId: string): Promise<boolean> {
  const { data, error } = await admin.from("purchases").update({ proposal_id: proposalId }).eq("id", creditId).is("proposal_id", null).select("id");
  return !error && !!data && data.length > 0;
}

export async function recordDraft(admin: any, userId: string, proposalId: string, free = false): Promise<void> {
  if (!paywallEnabled()) return;
  try {
    const r = await admin.from("draft_ledger").insert({ user_id: userId, proposal_id: proposalId, free });
    if (r.error && /free/i.test(r.error.message || "")) await admin.from("draft_ledger").insert({ user_id: userId, proposal_id: proposalId });
  } catch {}
}

// A generation failed: it must not count against the user, and a prepaid
// credit attached to it goes back to being an unused credit.
export async function releaseOnFailure(admin: any, proposalId: string): Promise<void> {
  try { await admin.from("draft_ledger").update({ failed: true }).eq("proposal_id", proposalId); } catch {}
  try { await admin.from("purchases").update({ proposal_id: null }).eq("proposal_id", proposalId).eq("prepaid", true); } catch {}
}

// Server-side check used by the three generate routes. Returns null when the
// user may generate, else an error code for a 402 response.
export async function gateForGeneration(admin: any, userId: string, hasCode: boolean): Promise<{ error: string | null; creditId: string | null }> {
  if (!paywallEnabled()) return { error: null, creditId: null };
  const g = await draftGate(admin, userId);
  if (hasCode) return { error: null, creditId: null };
  if (g.mode !== "free" && !g.creditId) return { error: g.mode === "blocked" ? "draft_limit" : "prepay_required", creditId: null };
  return { error: null, creditId: g.creditId };
}

// Is this proposal under the draft rules (created while they applied)? Drafts
// without a ledger row never expire, never get purged and are not refused payment.
export async function isTracked(admin: any, proposalId: string): Promise<boolean> {
  if (!paywallEnabled()) return false;
  const { data, error } = await admin.from("draft_ledger").select("proposal_id").eq("proposal_id", proposalId).eq("failed", false).eq("free", false).limit(1).maybeSingle();
  return !error && !!data;
}
