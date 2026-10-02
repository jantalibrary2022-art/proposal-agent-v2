import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

function isAdmin(email: string | undefined | null) {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export function adminToken(pin: string, userId: string) {
  return crypto.createHash("sha256").update(pin + "|" + userId).digest("hex");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ ok: false, error: "not_admin" }, { status: 403 });

  const pin = process.env.ADMIN_PIN || "";
  if (!pin) return NextResponse.json({ ok: true, no_pin: true }); // PIN gate not configured

  let body: any = {};
  try { body = await req.json(); } catch {}
  const entered = typeof body.pin === "string" ? body.pin : "";

  // Constant-time compare of the entered PIN against the configured one.
  const a = Buffer.from(entered);
  const b = Buffer.from(pin);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) return NextResponse.json({ ok: false, error: "wrong_pin" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("prastav_admin", adminToken(pin, user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
