import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { renderProposalFiles } from "../../../../../lib/run-open";
import { applyEdits } from "../../../../../lib/apply-edits";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const { data: row } = await supabase.from("proposals").select("id,status,substance,composed,meta").eq("id", id).single();
  if (!row || !row.substance) return NextResponse.json({ ok: false, error: "not_ready" }, { status: 404 });

  let edits: any = {};
  try { edits = await req.json(); } catch { edits = {}; }

  const admin = createAdminClient();
  await admin.from("proposals").update({ status: "rendering", updated_at: new Date().toISOString() }).eq("id", id);

  try {
    const applied = applyEdits({ substance: row.substance, composed: row.composed, meta: row.meta }, edits);
    const files = await renderProposalFiles(applied.substance, applied.composed);
    const base = user.id + "/" + id;
    // buf is an opaque binary blob (PDF/DOCX/XLSX) from the CommonJS renderer,
    // passed straight to Supabase storage; typed any to avoid cross-library
    // Buffer/Uint8Array generic conflicts at build time.
    const up = async (name: string, buf: any, type: string) => {
      const path = base + "/" + name;
      const { error } = await admin.storage.from("proposals").upload(path, buf, { contentType: type, upsert: true });
      if (error) throw new Error("upload " + name + ": " + error.message);
      return path;
    };
    const pdf_path = await up("proposal.pdf", files.pdf, "application/pdf");
    const docx_path = await up("proposal.docx", files.docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const xlsx_path = await up("budget.xlsx", files.xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await admin.from("proposals").update({ status: "ready", title: applied.meta.title, meta: applied.meta, substance: applied.substance, composed: applied.composed, pdf_path, docx_path, xlsx_path, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await admin.from("proposals").update({ status: "error", error: (e && e.message) || "render_failed", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: false, error: (e && e.message) || "render_failed" }, { status: 500 });
  }
}
