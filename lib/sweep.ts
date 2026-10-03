// Marks proposals stuck mid-generation as failed, so users see a clear status
// and can retry instead of a "Building…" that never ends. A generation can be
// orphaned when the server restarts (e.g. during a deploy) mid-run.
// There is no cron: this runs lazily when a dashboard, proposal page or the
// admin page is opened.
import { sendProposalFailed } from "./email";

export const GENERATING_TIMEOUT_MIN = 45; // counted from created_at
export const RENDERING_TIMEOUT_MIN = 20;  // counted from updated_at

export async function sweepStuckProposals(admin: any, userId?: string): Promise<number> {
  const now = Date.now();
  const genCut = new Date(now - GENERATING_TIMEOUT_MIN * 60000).toISOString();
  const renCut = new Date(now - RENDERING_TIMEOUT_MIN * 60000).toISOString();

  let q1 = admin.from("proposals").select("id,user_id,created_at").eq("status", "generating").lt("created_at", genCut).limit(200);
  let q2 = admin.from("proposals").select("id,user_id,updated_at").eq("status", "rendering").lt("updated_at", renCut).limit(200);
  if (userId) { q1 = q1.eq("user_id", userId); q2 = q2.eq("user_id", userId); }
  const [gen, ren] = await Promise.all([q1, q2]);
  const stuck: { id: string; user_id: string; at: string; rendering: boolean }[] = [
    ...((gen.data || []).map((r: any) => ({ id: r.id, user_id: r.user_id, at: r.created_at, rendering: false }))),
    ...((ren.data || []).map((r: any) => ({ id: r.id, user_id: r.user_id, at: r.updated_at, rendering: true }))),
  ];
  if (!stuck.length) return 0;

  let changed = 0;
  for (const s of stuck) {
    // A stalled finalise keeps the reviewed draft: put it back to draft so the
    // user (who may have paid) can finalise again. A stalled generation fails.
    const patch = s.rendering
      ? { status: "draft", error: "timeout:rendering", updated_at: new Date().toISOString() }
      : { status: "error", error: "timeout:generating", updated_at: new Date().toISOString() };
    const { data, error } = await admin
      .from("proposals")
      .update(patch)
      .eq("id", s.id)
      .eq("status", s.rendering ? "rendering" : "generating") // only if still stuck
      .select("id");
    if (error || !data || !data.length) continue;
    changed++;
    // Tell the user, but only for recent failures (not ancient rows found on a first sweep).
    if (!s.rendering && now - new Date(s.at).getTime() < 6 * 3600 * 1000) {
      try {
        const { data: u } = await admin.auth.admin.getUserById(s.user_id);
        const email = u?.user?.email;
        if (email) await sendProposalFailed(email, { id: s.id });
      } catch {}
    }
  }
  return changed;
}
