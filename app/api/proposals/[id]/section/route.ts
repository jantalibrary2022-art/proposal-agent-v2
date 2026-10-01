import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED = ["title","subtitle","problem","objective","strategy","results_narrative","activities","sustainability"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const section = String(body.section || "");
  const text = String(body.text == null ? "" : body.text);
  if (!ALLOWED.includes(section)) return NextResponse.json({ ok: false, error: "bad_section" }, { status: 400 });

  const { data: row } = await supabase.from("proposals").select("id,status,composed,meta").eq("id", id).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (row.status !== "draft") return NextResponse.json({ ok: false, error: "not_draft" }, { status: 409 });

  const composed: any = Object.assign({}, row.composed || {});
  composed[section] = text;
  const meta: any = Object.assign({}, row.meta || {});
  if (section === "title") meta.title = text;
  if (section === "subtitle") meta.subtitle = text;

  const admin = createAdminClient();
  const { error } = await admin.from("proposals").update({ composed, meta, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
