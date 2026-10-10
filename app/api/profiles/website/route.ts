import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { fetchWebsiteSummary } from "../../../../lib/website-summary";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let url = "";
  try { url = String((await req.json()).url || "").trim(); } catch { url = ""; }
  if (!url) return NextResponse.json({ ok: false, error: "missing_url" }, { status: 400 });

  try {
    const r: any = await fetchWebsiteSummary(url);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error || "fetch_failed", pages: r.pages || [] });
    return NextResponse.json({ ok: true, summary: r.summary, pages: r.pages || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
