import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";
import { isEntitled } from "../../../../../../lib/entitlement";

export const runtime = "nodejs";

const COLS: Record<string, string> = { pdf: "pdf_path", docx: "docx_path", xlsx: "xlsx_path" };
// Download filenames so the browser saves each file (incl. the PDF) instead of
// opening it inline over the site.
const DOWNLOAD: Record<string, string> = { pdf: "proposal.pdf", docx: "proposal.docx", xlsx: "budget.xlsx" };

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
  // Payment gate (defense in depth; approve already gated producing the files).
  if (!(await isEntitled(admin, id))) return NextResponse.json({ error: "payment_required" }, { status: 402 });
  const { data: signed, error } = await admin.storage.from("proposals").createSignedUrl(path, 120, { download: DOWNLOAD[kind] });
  if (error || !signed) return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  return NextResponse.redirect(signed.signedUrl);
}
