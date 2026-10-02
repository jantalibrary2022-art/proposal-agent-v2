import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
  const visitor = typeof body.visitor === "string" ? body.visitor.slice(0, 64) : null;
  try {
    const admin = createAdminClient();
    await admin.from("page_views").insert({ path, visitor });
  } catch {}
  return NextResponse.json({ ok: true });
}
