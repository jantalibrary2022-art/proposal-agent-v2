// Shared admin-access check for admin API routes and pages.
// Mirrors the gate on /admin: authenticated + email in ADMIN_EMAILS + (when
// ADMIN_PIN is set) a valid prastav_admin PIN cookie.

import crypto from "crypto";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

export function isAdminEmail(email: string | undefined | null): boolean {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export function adminToken(pin: string, userId: string): string {
  return crypto.createHash("sha256").update(pin + "|" + userId).digest("hex");
}

export type AdminAuth = { ok: boolean; status: number; error?: string; userId?: string };

// Returns { ok: true } only when the caller is a signed-in admin and, if a PIN
// is configured, presents the matching PIN cookie.
export async function requireAdmin(): Promise<AdminAuth> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "not_authenticated" };
  if (!isAdminEmail(user.email)) return { ok: false, status: 403, error: "not_admin" };

  const pin = process.env.ADMIN_PIN || "";
  if (pin) {
    const store = await cookies();
    const token = store.get("prastav_admin")?.value || "";
    if (token !== adminToken(pin, user.id)) return { ok: false, status: 403, error: "pin_required" };
  }
  return { ok: true, status: 200, userId: user.id };
}
