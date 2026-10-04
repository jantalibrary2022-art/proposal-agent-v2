import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

// Admin: switch an offer on/off, or change its number of places.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  let b: any = {};
  try { b = await req.json(); } catch {}
  const code = String(b.code || "");
  if (!code) return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
  const patch: any = {};
  if (typeof b.active === "boolean") patch.active = b.active;
  if (b.max_total !== undefined) {
    const n = Number(b.max_total);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return NextResponse.json({ ok: false, error: "bad_places" }, { status: 400 });
    patch.max_total = n;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "nothing_to_change" }, { status: 400 });
  const { error } = await createAdminClient().from("offers").update(patch).eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
