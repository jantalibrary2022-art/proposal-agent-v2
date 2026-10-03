import Link from "next/link";
import ProposalRow from "./ProposalRow";
import LanguageSwitcher from "../_components/LanguageSwitcher";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import { sweepStuckProposals } from "../../lib/sweep";
import { draftGate, draftDates, isPastExpiry } from "../../lib/drafts";
import { paywallEnabled } from "../../lib/coupons";
import { DraftGateNotice } from "../_components/DraftGate";
import DraftRulesModal, { DRAFT_RULES_VERSION } from "./DraftRulesModal";
import { getDict, type Locale, type Dict } from "../../lib/i18n";
import LogoutButton from "../_components/LogoutButton";

function relativeTime(iso: string, td: Dict["dashboard"], locale: Locale) {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const m = Math.floor((Date.now() - then) / 60000);
  if (m < 1) return td.justNow;
  if (m < 60) return m + " " + td.minAgo;
  const h = Math.floor(m / 60);
  if (h < 24) return h + " " + td.hrAgo;
  const d = Math.floor(h / 24);
  if (d < 7) return d + " " + td.daysAgo;
  return new Date(iso).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
}

function StatusPill({ status, td }: { status: string; td: Dict["dashboard"] }) {
  const map: Record<string, { label: string; filled?: boolean; danger?: boolean }> = {
    generating: { label: td.stBuilding },
    rendering: { label: td.stFinalising },
    draft: { label: td.stReview, filled: true },
    ready: { label: td.stReady, filled: true },
    error: { label: td.stError, danger: true },
  };
  const m = map[status] || { label: (status || "").toUpperCase() };
  const cls = m.danger
    ? "text-[#B4442F] border border-[#E4B9B0]"
    : m.filled
    ? "bg-ink text-paper"
    : "text-muted border border-[#C4C2BB]";
  return <span className={`shrink-0 text-[10.5px] tracking-wide font-semibold px-2.5 py-1 rounded-full ${cls}`}>{m.label}</span>;
}

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { locale, t } = await getDict();
  const td = t.dashboard;
  const MODE: Record<string, string> = { open: td.modeOpen, rfp: td.modeRfp, improve: td.modeImprove };

  const adminList = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = !!user.email && adminList.includes(user.email.toLowerCase());

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = fullName.split(" ")[0] || (user.email ? user.email.split("@")[0] : "");
  const initials = (fullName || user.email || "U").slice(0, 2).toUpperCase();

  try { await sweepStuckProposals(createAdminClient(), user.id); } catch {}

  const { data: proposalsData } = await supabase
    .from("proposals")
    .select("id,title,status,mode,updated_at,created_at,meta")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(25);
  const proposals = proposalsData || [];

  // Unpaid-draft rules: which drafts are unpaid, open until when, or expired.
  const adminDb = createAdminClient();
  const paywall = paywallEnabled();
  const unpaidInfo: Record<string, { expired: boolean; date: string }> = {};
  let gateInfo: any = null;
  if (paywall) {
    try {
      const [pur, red, g, led] = await Promise.all([
        adminDb.from("purchases").select("proposal_id").eq("user_id", user.id).eq("status", "paid"),
        adminDb.from("coupon_redemptions").select("proposal_id,kind").eq("user_id", user.id),
        draftGate(adminDb, user.id),
        adminDb.from("draft_ledger").select("proposal_id").eq("user_id", user.id).eq("failed", false).eq("free", false),
      ]);
      const tracked = new Set((led.data || []).map((r: any) => r.proposal_id));
      const paid = new Set((pur.data || []).map((r: any) => r.proposal_id).filter(Boolean));
      const free = new Set((red.data || []).filter((r: any) => r.kind === "free").map((r: any) => r.proposal_id));
      for (const p of proposals as any[]) {
        if (p.status !== "draft" || paid.has(p.id) || free.has(p.id) || !p.created_at || !tracked.has(p.id)) continue;
        const dd = draftDates(p.created_at);
        const expired = isPastExpiry(p.created_at);
        unpaidInfo[p.id] = { expired, date: new Date(expired ? dd.deleteAt : dd.expiresAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }) };
      }
      gateInfo = { enforced: g.enforced, mode: g.mode, unpaidOpen: g.unpaidOpen, max: g.max, hasCredit: !!g.creditId, pricePaise: g.pricePaise, razorpayReady: true };
    } catch {}
  }
  const tdr = t.drafts;
  const showRules = paywall && Number((user.user_metadata as any)?.draft_rules_ack || 0) < DRAFT_RULES_VERSION;

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <DraftRulesModal show={showRules} />
      <header className="sticky top-0 z-40 h-16 border-b border-line bg-canvas">
        <div className="h-full max-w-[1600px] mx-auto px-6 sm:px-11 flex items-center justify-between">
        <div className="flex items-center gap-9">
          <div className="flex items-center gap-2">
            <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[19px] tracking-[-0.02em]">Prastav</span>
          </div>
          <nav className="hidden sm:flex gap-6">
            <span className="text-[12px] tracking-wide font-semibold">{td.navProposals}</span>
            <Link href="/profiles" className="text-[12px] tracking-wide text-muted">{td.navOrgProfile}</Link>
            <Link href="/account" className="text-[12px] tracking-wide text-muted">{td.navAccount}</Link>
            <Link href="/purchases" className="text-[12px] tracking-wide text-muted">{td.navPurchases}</Link>
            <Link href="/feedback" className="text-[12px] tracking-wide text-muted">{td.navFeedback}</Link>
            <Link href="/help" className="text-[12px] tracking-wide text-muted">{td.navHelp}</Link>
            <Link href="/contact" className="text-[12px] tracking-wide text-muted">{td.navContact}</Link>
            <Link href="/policies" className="text-[12px] tracking-wide text-muted">{td.navPolicies}</Link>
            {isAdmin && <Link href="/admin" className="text-[12px] tracking-wide text-muted">{td.navAdmin}</Link>}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher current={locale} />
          <span className="hidden sm:inline text-[14px] text-muted">{user.email}</span>
          <Link href="/account" className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-bold text-[13px]">{initials}</Link>
          <LogoutButton className="text-[12px] tracking-wide text-muted" />
        </div>
        </div>
      </header>

      <div className="flex-1 px-6 sm:px-11 py-10 w-full max-w-[1600px] mx-auto">
        <h1 className="font-extrabold text-[34px] tracking-[-0.04em] mb-1.5">{td.welcome}{firstName}</h1>
        <p className="text-[16px] text-muted mb-9">{td.intro}</p>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-grow min-w-0">
            <h2 className="font-extrabold text-[28px] tracking-[-0.03em] mb-1.5">{td.proposals}</h2>
            <p className="text-[15px] text-muted mb-6">{td.proposalsSub}</p>

            {gateInfo && !gateInfo.hasCredit && gateInfo.mode !== "free" && <DraftGateNotice gate={gateInfo} compact />}
            <div className="flex flex-col sm:flex-row gap-5 mb-12">
              <Link href="/new/idea" className="flex-1 bg-panel text-paper rounded-lg p-6">
                <div className="text-[18px] font-bold mb-1.5">{td.ideaTitle}</div>
                <div className="text-[14.5px] text-white/60">{td.ideaSub}</div>
                <div className="mt-4 text-[12px] tracking-wide text-white/70">{td.start}</div>
              </Link>
              <Link href="/new/rfp" className="flex-1 bg-card border border-line rounded-lg p-6">
                <div className="text-[18px] font-bold mb-1.5">{td.rfpTitle}</div>
                <div className="text-[14.5px] text-muted">{td.rfpSub}</div>
                <div className="mt-4 text-[12px] tracking-wide">{td.start}</div>
              </Link>
              <Link href="/new/improve" className="flex-1 bg-card border border-line rounded-lg p-6">
                <div className="text-[18px] font-bold mb-1.5">{td.improveTitle}</div>
                <div className="text-[14.5px] text-muted">{td.improveSub}</div>
                <div className="mt-4 text-[12px] tracking-wide">{td.start}</div>
              </Link>
            </div>

            <div className="text-[18px] font-bold tracking-[-0.02em] mb-4">{td.recent}</div>
            {proposals.length === 0 ? (
              <div className="bg-card border border-line rounded-lg p-10 text-center">
                <p className="text-[15px] text-muted">{td.empty}</p>
              </div>
            ) : (
              <div className="bg-card border border-line rounded-lg overflow-hidden">
                {proposals.map((p: any, i: number) => (
                  <ProposalRow
                    key={p.id}
                    p={p}
                    last={i === proposals.length - 1}
                    modeLabel={MODE[p.mode] || td.modeOpen}
                    statusPill={unpaidInfo[p.id]?.expired
                      ? <span className="shrink-0 text-[10.5px] tracking-wide font-semibold px-2.5 py-1 rounded-full text-[#B4442F] border border-[#E4B9B0]">{tdr.expiredPill}</span>
                      : <StatusPill status={p.status} td={td} />}
                    note={unpaidInfo[p.id] ? (unpaidInfo[p.id].expired ? tdr.restoreBy : tdr.openUntil).replace("{date}", unpaidInfo[p.id].date) : ""}
                    unpaid={!!unpaidInfo[p.id]}
                    relUpdated={relativeTime(p.updated_at, td, locale)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="lg:w-[264px] shrink-0">
            <div className="text-[12px] tracking-wide text-muted font-semibold mb-3">{td.moreComing}</div>
            <div className="flex flex-col gap-3">
              {[
                [td.svcCaseTitle, td.svcCaseDesc],
                [td.svcDataTitle, td.svcDataDesc],
                [td.svcScoreTitle, td.svcScoreDesc],
              ].map(([title, d]) => (
                <div key={title} className="bg-card border border-line rounded-lg p-4 opacity-80">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[14.5px] font-bold">{title}</div>
                    <span className="text-[9.5px] tracking-wide font-semibold text-muted border border-[#C4C2BB] px-1.5 py-0.5 rounded">{td.soon}</span>
                  </div>
                  <div className="text-[13px] text-muted leading-snug">{d}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
