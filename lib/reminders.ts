// Emails a reminder once per unpaid draft when it has about 2 days left before
// it locks (day 5 of 7). Run by the scheduled job (/api/cron).
import { paywallEnabled } from "./coupons";
import { DRAFT_OPEN_DAYS, draftDates } from "./drafts";
import { sendDraftReminder, emailConfigured } from "./email";

export const REMIND_DAYS_BEFORE = 2;
const DAY = 24 * 3600 * 1000;

export async function sendDraftReminders(admin: any): Promise<{ sent: number; checked: number }> {
  if (!paywallEnabled() || !emailConfigured()) return { sent: 0, checked: 0 };
  const now = Date.now();
  const from = new Date(now - DRAFT_OPEN_DAYS * DAY).toISOString();                         // not yet locked
  const to = new Date(now - (DRAFT_OPEN_DAYS - REMIND_DAYS_BEFORE) * DAY).toISOString();     // 2 days or less left
  const led = await admin
    .from("draft_ledger")
    .select("proposal_id,user_id,created_at")
    .eq("failed", false).eq("free", false).eq("deleted", false).eq("reminded", false)
    .gt("created_at", from).lte("created_at", to)
    .order("created_at", { ascending: true })
    .limit(50);
  if (led.error || !led.data || !led.data.length) return { sent: 0, checked: 0 };

  const ids = led.data.map((r: any) => r.proposal_id);
  const [props, pur, red] = await Promise.all([
    admin.from("proposals").select("id,status,title,meta").in("id", ids),
    admin.from("purchases").select("proposal_id").in("proposal_id", ids).eq("status", "paid"),
    admin.from("coupon_redemptions").select("proposal_id,kind").in("proposal_id", ids),
  ]);
  if (props.error || pur.error || red.error) return { sent: 0, checked: 0 };
  const byId = new Map((props.data || []).map((p: any) => [p.id, p]));
  const settled = new Set<string>([
    ...(pur.data || []).map((r: any) => r.proposal_id),
    ...(red.data || []).filter((r: any) => r.kind === "free").map((r: any) => r.proposal_id),
  ]);

  let sent = 0;
  for (const r of led.data) {
    const p: any = byId.get(r.proposal_id);
    const needs = p && p.status === "draft" && !settled.has(r.proposal_id);
    // Mark first so a slow or failed send never produces duplicate emails.
    const mark = await admin.from("draft_ledger").update({ reminded: true }).eq("proposal_id", r.proposal_id).eq("reminded", false).select("proposal_id");
    if (mark.error || !mark.data || !mark.data.length || !needs) continue;
    try {
      const { data: u } = await admin.auth.admin.getUserById(r.user_id);
      const email = u?.user?.email;
      if (!email) continue;
      const ok = await sendDraftReminder(email, { id: r.proposal_id, title: (p.meta && p.meta.title) || p.title || "", locksAt: draftDates(r.created_at).expiresAt });
      if (ok) sent++;
    } catch {}
  }
  return { sent, checked: led.data.length };
}
