// Marks proposals stuck mid-generation as failed, so users see a clear status
// and can retry instead of a "Building…" that never ends. A generation can be
// orphaned when the server restarts (e.g. during a deploy) mid-run.
// There is no cron: this runs lazily when a dashboard, proposal page or the
// admin page is opened.
import { sendProposalFailed } from "./email";
import { releaseOnFailure, DRAFT_OPEN_DAYS, RESTORE_DAYS } from "./drafts";
import { paywallEnabled } from "./coupons";

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
  await purgeExpiredDrafts(admin, userId);
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
    if (!s.rendering) await releaseOnFailure(admin, s.id);
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

// Unpaid drafts past the open period AND the restore window (plus a 2-day grace,
// so a payment started at the last moment is never lost) are deleted for good.
// Only drafts recorded in the ledger (created under these rules) are touched;
// any paid or free-code draft is skipped, and on any read error nothing is deleted.
const PURGE_GRACE_DAYS = 2;
export async function purgeExpiredDrafts(admin: any, userId?: string): Promise<number> {
  if (!paywallEnabled()) return 0;
  const cut = new Date(Date.now() - (DRAFT_OPEN_DAYS + RESTORE_DAYS + PURGE_GRACE_DAYS) * 24 * 3600 * 1000).toISOString();
  let lq = admin.from("draft_ledger").select("proposal_id").eq("failed", false).eq("free", false).eq("purged", false).lt("created_at", cut).order("created_at", { ascending: true }).limit(50);
  if (userId) lq = lq.eq("user_id", userId);
  const led = await lq;
  if (led.error || !led.data || !led.data.length) return 0;
  const ids = led.data.map((r: any) => r.proposal_id);
  const [props, pur, red] = await Promise.all([
    admin.from("proposals").select("id,user_id").in("id", ids).eq("status", "draft"),
    admin.from("purchases").select("proposal_id").in("proposal_id", ids).eq("status", "paid"),
    admin.from("coupon_redemptions").select("proposal_id,kind").in("proposal_id", ids),
  ]);
  if (props.error || pur.error || red.error) return 0;
  const keep = new Set<string>([
    ...(pur.data || []).map((r: any) => r.proposal_id),
    ...(red.data || []).filter((r: any) => r.kind === "free").map((r: any) => r.proposal_id),
  ]);
  // Ledger rows needing no further checks (paid, free, no longer a draft, or gone)
  // are marked so the purge never re-reads them.
  const live = new Set((props.data || []).map((r: any) => r.id));
  const settled = ids.filter((id: string) => keep.has(id) || !live.has(id));
  if (settled.length) { try { await admin.from("draft_ledger").update({ purged: true }).in("proposal_id", settled); } catch {} }
  let n = 0;
  for (const r of props.data || []) {
    if (keep.has(r.id)) continue;
    try {
      const base = r.user_id + "/" + r.id;
      try {
        const { data: files } = await admin.storage.from("proposals").list(base);
        if (files && files.length) await admin.storage.from("proposals").remove(files.map((f: any) => base + "/" + f.name));
      } catch {}
      const { error } = await admin.from("proposals").delete().eq("id", r.id).eq("status", "draft");
      if (!error) {
        n++;
        try { await admin.from("draft_ledger").update({ purged: true }).eq("proposal_id", r.id); } catch {}
      }
    } catch {}
  }
  return n;
}
