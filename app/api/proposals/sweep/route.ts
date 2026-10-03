import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { sweepStuckProposals } from "../../../../lib/sweep";

export const runtime = "nodejs";

// Called by the proposal page when a run has been "building" past the timeout.
// Only touches the signed-in user's own proposals.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  const changed = await sweepStuckProposals(createAdminClient(), user.id);
  return NextResponse.json({ ok: true, changed });
}
