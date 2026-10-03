import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { createClient } from "../../../../lib/supabase/server";
import { sendTestEmail, emailSettingsSummary } from "../../../../lib/email";

export const runtime = "nodejs";

// Sends a test email to the signed-in admin and returns the exact SMTP error, if any.
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const to = user?.email || "";
  const settings = emailSettingsSummary();
  const r = await sendTestEmail(to);
  return NextResponse.json({ ...r, to, settings });
}
