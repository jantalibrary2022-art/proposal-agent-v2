import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "../../../lib/supabase/admin";
import { sweepStuckProposals } from "../../../lib/sweep";
import { sendDraftReminders } from "../../../lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scheduled maintenance, called hourly by an external scheduler with
// "Authorization: Bearer <CRON_SECRET>". Runs for all users:
// stuck-proposal cleanup, expired-draft purge, and 2-day lock reminders.
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (secret.length < 16) return false;
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got), b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function run(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = createAdminClient();
  let swept = 0, reminders = { sent: 0, checked: 0 };
  try { swept = await sweepStuckProposals(admin); } catch {}
  try { reminders = await sendDraftReminders(admin); } catch {}
  return NextResponse.json({ ok: true, swept, reminders, at: new Date().toISOString() });
}

export const GET = run;
export const POST = run;
