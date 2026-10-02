import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { requireAdmin } from "../../../../lib/admin-auth";
import { normalizeCode } from "../../../../lib/coupons";

export const runtime = "nodejs";

// Unambiguous alphabet (no 0/O/1/I) for codes people may type by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(len = 8): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// GET: list recent coupons (with redemption counts) and recent redemptions.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const admin = createAdminClient();
  const [coupons, redemptions] = await Promise.all([
    admin.from("coupons").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("coupon_redemptions").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  return NextResponse.json({
    ok: true,
    coupons: coupons.data || [],
    redemptions: redemptions.data || [],
  });
}

// POST: mint one or a batch of codes.
// body: { kind, value, currency, count, prefix, max_uses, per_user_limit,
//         email_allowlist (string[] or comma string), batch, note, expires_at }
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let b: any = {};
  try { b = await req.json(); } catch { b = {}; }

  const kind = ["free", "percent", "fixed"].includes(b.kind) ? b.kind : "free";
  const value = kind === "free" ? 0 : Math.max(0, Number(b.value) || 0);
  if (kind === "percent" && value > 100) return NextResponse.json({ ok: false, error: "percent_over_100" }, { status: 400 });
  const currency = typeof b.currency === "string" && b.currency ? b.currency : "INR";
  const count = Math.min(500, Math.max(1, parseInt(b.count, 10) || 1));
  const prefix = normalizeCode(b.prefix).replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const maxUses = b.max_uses === null || b.max_uses === undefined || b.max_uses === "" ? null : Math.max(1, parseInt(b.max_uses, 10) || 1);
  const perUser = b.per_user_limit === "" || b.per_user_limit === undefined ? 1 : Math.max(0, parseInt(b.per_user_limit, 10) || 0);
  const batch = typeof b.batch === "string" ? b.batch.slice(0, 80) : null;
  const note = typeof b.note === "string" ? b.note.slice(0, 300) : null;
  const expires = b.expires_at ? new Date(b.expires_at) : null;
  const expires_at = expires && !isNaN(expires.getTime()) ? expires.toISOString() : null;

  let allow: string[] | null = null;
  if (Array.isArray(b.email_allowlist)) allow = b.email_allowlist;
  else if (typeof b.email_allowlist === "string" && b.email_allowlist.trim()) allow = b.email_allowlist.split(/[,\s]+/);
  allow = allow ? allow.map((s) => String(s).trim().toLowerCase()).filter(Boolean) : null;
  if (allow && allow.length === 0) allow = null;

  const admin = createAdminClient();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const code = (prefix ? prefix + "-" : "") + randomCode(8);
    rows.push({ code, kind, value, currency, max_uses: maxUses, per_user_limit: perUser, email_allowlist: allow, batch, note, expires_at });
  }

  const { data, error } = await admin.from("coupons").insert(rows).select("code,kind,value,currency,max_uses,per_user_limit,expires_at,batch");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: data || [], codes: (data || []).map((r: any) => r.code) });
}
