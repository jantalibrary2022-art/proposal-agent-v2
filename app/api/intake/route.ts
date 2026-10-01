import { NextRequest, NextResponse } from "next/server";
import { openIntake } from "../../../lib/open-intake";
import { orgProfile } from "../../../sample-org-profile";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers = body.answers ?? body;
    const r = await openIntake({ orgProfile, answers }, { mode: "direct" });
    if (!r._parsed) {
      return NextResponse.json(
        { ok: false, error: "parse_failed", stop: r._stop },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, brief: r.data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
