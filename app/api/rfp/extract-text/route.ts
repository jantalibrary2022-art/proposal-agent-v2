import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let file: any = null;
  try { const form = await req.formData(); file = form.get("file"); } catch { file = null; }
  if (!file || typeof file === "string") return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });

  const name = String(file.name || "").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  let text = "";
  try {
    if (name.endsWith(".docx")) {
      const mm: any = require("mammoth");
      const mammoth = mm && typeof mm.extractRawText === "function" ? mm : (mm.default || mm);
      const r = await mammoth.extractRawText({ buffer: buf });
      text = r.value || "";
    } else if (name.endsWith(".pdf")) {
      const pp: any = require("pdf-parse/lib/pdf-parse.js");
      const pdfParse = typeof pp === "function" ? pp : (pp.default || pp);
      const r = await pdfParse(buf);
      text = r.text || "";
    } else if (name.endsWith(".txt")) {
      text = buf.toString("utf8");
    } else {
      return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "could_not_read_file: " + ((e && e.message) || "") }, { status: 400 });
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return NextResponse.json({ ok: false, error: "empty_document" }, { status: 400 });

  return NextResponse.json({ ok: true, text, chars: text.length });
}
