import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { validateCoupon } from "../../../../lib/coupons";

export const runtime = "nodejs";

// Live hint for the user before they generate. Authoritative check + redemption
// still happen server-side at generate time.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let code = "";
  try { code = String((await req.json()).code || ""); } catch { code = ""; }
  if (!code.trim()) return NextResponse.json({ ok: false, reason: "empty" });

  const chk = await validateCoupon(code, user.email);
  return NextResponse.json(chk);
}
