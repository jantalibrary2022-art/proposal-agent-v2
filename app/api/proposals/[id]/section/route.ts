import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { sectionKeys, writeSection } from "../../../../../lib/sections";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const section = String(body.section || "");
  const text = String(body.text == null ? "" : body.text);

  const { data: row } = await supabase.from("proposals").select("id,status,composed,meta").eq("id", id).single();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (row.status !== "draft") return NextResponse.json({ ok: false, error: "not_draft" }, { status: 409 });

  // The valid section keys depend on the proposal's own structure (house default,
  // or a donor-prescribed list). Gate against that, not a fixed array.
  if (!sectionKeys(row.composed).includes(section)) return NextResponse.json({ ok: false, error: "bad_section" }, { status: 400 });

  const composed: any = writeSection(row.composed, section, text);
  const meta: any = Object.assign({}, row.meta || {});
  if (section === "title") meta.title = text;
  if (section === "subtitle") meta.subtitle = text;

  const admin = createAdminClient();
  const { error } = await admin.from("proposals").update({ composed, meta, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
