import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export const runtime = "nodejs";

const COLS: Record<string, string> = { pdf: "pdf_path", docx: "docx_path", xlsx: "xlsx_path" };

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await ctx.params;
  const col = COLS[kind];
  if (!col) return NextResponse.json({ error: "bad_kind" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: row } = await supabase.from("proposals").select("id, " + col).eq("id", id).single();
  const path = row ? (row as any)[col] : null;
  if (!path) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage.from("proposals").createSignedUrl(path, 120);
  if (error || !signed) return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  return NextResponse.redirect(signed.signedUrl);
}
