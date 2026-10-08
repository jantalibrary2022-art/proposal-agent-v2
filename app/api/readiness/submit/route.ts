import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

// One anonymous cohort response. Ratings only: we accept just the a/b/c maps
// of short string codes, and never any free text (the 90-day commitment stays
// on the participant's device and is never sent here).
const PARTS = ["a", "b", "c"] as const;

function clean(obj: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!obj || typeof obj !== "object") return out;
  let n = 0;
  for (const k of Object.keys(obj)) {
    if (n++ >= 60) break;
    const key = String(k).slice(0, 40);
    const val = obj[k];
    if (typeof val === "string" && val.length <= 8) out[key] = val;
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}

  const session = typeof body.session === "string" ? body.session.trim().slice(0, 120) : "";
  const lang = body.lang === "en" ? "en" : "hi";
  if (!session) return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });

  const answers: Record<string, Record<string, string>> = {};
  for (const p of PARTS) answers[p] = clean(body.answers && body.answers[p]);
  if (!answers.a && !answers.b && !answers.c) return NextResponse.json({ ok: false, error: "No answers." }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("readiness_responses").insert({ session, lang, answers });
    if (error) {
      console.error("readiness insert failed:", error.message);
      return NextResponse.json({ ok: false, error: "Could not record response." }, { status: 500 });
    }
  } catch (e: any) {
    console.error("readiness insert failed:", e && e.message);
    return NextResponse.json({ ok: false, error: "Could not record response." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
