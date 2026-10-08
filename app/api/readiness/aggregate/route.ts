import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns { respondents, tally } for one cohort session. Aggregates only —
// raw rows never leave the database (see sql/readiness.sql).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const session = (url.searchParams.get("s") || url.searchParams.get("session") || "").trim().slice(0, 120);
  if (!session) return NextResponse.json({ respondents: 0, tally: {} });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("readiness_aggregate", { p_session: session });
    if (error) {
      console.error("readiness aggregate failed:", error.message);
      return NextResponse.json({ respondents: 0, tally: {}, error: "aggregate_failed" }, { status: 500 });
    }
    const out = data || { respondents: 0, tally: {} };
    return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("readiness aggregate failed:", e && e.message);
    return NextResponse.json({ respondents: 0, tally: {}, error: "aggregate_failed" }, { status: 500 });
  }
}
