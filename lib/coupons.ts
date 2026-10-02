// Coupon / access-token logic, server-side only (uses the Supabase service role).
// Two uses on one mechanism: discount codes (percent/fixed) and free access
// tokens (kind "free", typically single-use) for live testing.

import { createAdminClient } from "./supabase/admin";

export type CouponKind = "free" | "percent" | "fixed";

export type CouponCheck = {
  ok: boolean;
  reason?: string;
  kind?: CouponKind;
  value?: number;
  currency?: string;
};

// Codes are stored and compared uppercase, trimmed.
export function normalizeCode(s: unknown): string {
  return String(s || "").trim().toUpperCase();
}

// The paywall (requiring a payment or a code before a generation runs) stays
// OFF until explicitly enabled, exactly like the admin PIN gate. This lets
// tokens be issued and consumed now without locking anyone out during testing.
// It flips on when PRASTAV_PAYWALL=on, or once a Razorpay key is present.
export function paywallEnabled(): boolean {
  if ((process.env.PRASTAV_PAYWALL || "").toLowerCase() === "on") return true;
  if (process.env.RAZORPAY_KEY_ID) return true;
  return false;
}

// Read-only check, used to give the user a hint before they generate.
// Per-user limits are enforced authoritatively at redeem time, not here.
export async function validateCoupon(code: string, email?: string | null): Promise<CouponCheck> {
  const c = normalizeCode(code);
  if (!c) return { ok: false, reason: "empty" };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("code,kind,value,currency,max_uses,used_count,email_allowlist,active,expires_at")
    .ilike("code", c)
    .maybeSingle();
  if (error) return { ok: false, reason: "lookup_failed" };
  if (!data) return { ok: false, reason: "not_found" };
  if (!data.active) return { ok: false, reason: "inactive" };
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (data.max_uses != null && (data.used_count || 0) >= data.max_uses) return { ok: false, reason: "exhausted" };
  const allow: string[] | null = data.email_allowlist || null;
  if (allow && allow.length) {
    const e = (email || "").trim().toLowerCase();
    if (!e || !allow.map((x) => String(x).toLowerCase()).includes(e)) return { ok: false, reason: "not_allowed" };
  }
  return { ok: true, kind: data.kind, value: Number(data.value) || 0, currency: data.currency || "INR" };
}

// Authoritative, atomic redemption via the SQL function. Links the redemption
// to the proposal it produced.
export async function redeemCoupon(
  code: string,
  userId: string,
  email: string | null,
  proposalId: string | null
): Promise<CouponCheck> {
  const c = normalizeCode(code);
  if (!c) return { ok: false, reason: "empty" };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("redeem_coupon", {
    p_code: c,
    p_user: userId,
    p_email: email,
    p_proposal: proposalId,
  });
  if (error) return { ok: false, reason: "redeem_failed" };
  const r = (data || {}) as CouponCheck;
  return r && typeof r.ok === "boolean" ? r : { ok: false, reason: "redeem_failed" };
}
