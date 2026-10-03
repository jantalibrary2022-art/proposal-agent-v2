import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

// A user permanently deletes their own account and data.
// Deleted: proposals + their generated files, organisation profiles, the sign-in account.
// Kept (financial record): invoices in `purchases`, detached from the account and
// stamped with the buyer's name and email. Requires sql/account-delete.sql; without
// it we refuse rather than let the database cascade-delete invoices.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const typed = String(body.confirm || "").trim().toLowerCase();
  if (!user.email || typed !== user.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "confirm_mismatch" }, { status: 400 });
  }

  const admin = createAdminClient();
  const uid = user.id;

  // 1. Keep invoices: stamp buyer details, then detach from the account.
  const { data: org } = await admin.from("org_profiles").select("name").eq("user_id", uid).eq("is_default", true).maybeSingle();
  const md: any = user.user_metadata || {};
  const buyerName = org?.name || md.org_name || md.full_name || "";
  const stamp = await admin.from("purchases").update({ buyer_email: user.email, buyer_name: buyerName }).eq("user_id", uid);
  if (stamp.error) {
    return NextResponse.json({ ok: false, error: "setup_required" }, { status: 500 });
  }
  const detach = await admin.from("purchases").update({ user_id: null }).eq("user_id", uid);
  if (detach.error) {
    return NextResponse.json({ ok: false, error: "setup_required" }, { status: 500 });
  }

  // 2. Generated files: <uid>/<proposalId>/<file>
  try {
    const { data: folders } = await admin.storage.from("proposals").list(uid, { limit: 1000 });
    for (const f of folders || []) {
      const base = uid + "/" + f.name;
      const { data: files } = await admin.storage.from("proposals").list(base, { limit: 1000 });
      if (files && files.length) await admin.storage.from("proposals").remove(files.map((x: any) => base + "/" + x.name));
      else await admin.storage.from("proposals").remove([base]);
    }
  } catch { /* best-effort */ }

  // 3. Rows owned by the user.
  await admin.from("proposals").delete().eq("user_id", uid);
  await admin.from("org_profiles").delete().eq("user_id", uid);

  // 4. The sign-in account itself (cascades redemptions; feedback is set null).
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });

  try { await supabase.auth.signOut(); } catch {}
  return NextResponse.json({ ok: true });
}
