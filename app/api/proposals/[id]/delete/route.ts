import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export const runtime = "nodejs";

// A user deletes their own proposal: its row and all generated files. The
// coupon_redemptions row (if any) is intentionally kept — deleting a proposal
// must not erase the record that a free/discount code was used.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  // Ownership check via the user-scoped client (RLS limits this to their rows).
  const { data: row } = await supabase.from("proposals").select("id").eq("id", id).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const admin = createAdminClient();

  // Remove any generated files under this proposal's folder.
  const base = user.id + "/" + id;
  try {
    const { data: listed } = await admin.storage.from("proposals").list(base);
    if (listed && listed.length) {
      await admin.storage.from("proposals").remove(listed.map((f) => base + "/" + f.name));
    }
  } catch { /* best-effort; the row delete below is what matters */ }

  const { error: delErr } = await admin.from("proposals").delete().eq("id", id).eq("user_id", user.id);
  if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
