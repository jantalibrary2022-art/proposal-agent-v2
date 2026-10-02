import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 160) : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 160) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";

  if (!message) return NextResponse.json({ ok: false, error: "A message is required." }, { status: 400 });
  if (!email) return NextResponse.json({ ok: false, error: "An email is required so we can reply." }, { status: 400 });

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id || null;
  } catch {}

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("contact_messages").insert({
      name: name || null,
      email,
      subject: subject || null,
      message,
      user_id: userId,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: (e && e.message) || "Could not send." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
