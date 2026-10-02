import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const MODE: Record<string, string> = { open: "OPEN IDEA", rfp: "RFP", improve: "IMPROVED" };

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const m = Math.floor((Date.now() - then) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = Math.floor(h / 24);
  if (d < 7) return d + (d === 1 ? " day ago" : " days ago");
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; filled?: boolean; danger?: boolean }> = {
    generating: { label: "BUILDING" },
    rendering: { label: "FINALISING" },
    draft: { label: "NEEDS REVIEW", filled: true },
    ready: { label: "READY", filled: true },
    error: { label: "ERROR", danger: true },
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

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = fullName.split(" ")[0] || (user.email ? user.email.split("@")[0] : "there");
  const initials = (fullName || user.email || "U").slice(0, 2).toUpperCase();

  const { data: proposalsData } = await supabase
    .from("proposals")
    .select("id,title,status,mode,updated_at,meta")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(25);
  const proposals = proposalsData || [];

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <header className="h-16 border-b border-line">
        <div className="h-full max-w-[1600px] mx-auto px-6 sm:px-11 flex items-center justify-between">
        <div className="flex items-center gap-9">
          <div className="flex items-center gap-2">
            <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[19px] tracking-[-0.02em]">Prastav</span>
          </div>
          <nav className="hidden sm:flex gap-6">
            <span className="text-[12px] tracking-wide font-semibold">PROPOSALS</span>
            <Link href="/profiles" className="text-[12px] tracking-wide text-muted">ORG PROFILE</Link>
            <Link href="/account" className="text-[12px] tracking-wide text-muted">ACCOUNT</Link>
            <Link href="/purchases" className="text-[12px] tracking-wide text-muted">PURCHASES</Link>
            <Link href="/feedback" className="text-[12px] tracking-wide text-muted">FEEDBACK</Link>
            <span className="text-[12px] tracking-wide text-muted">HELP</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[14px] text-muted">{user.email}</span>
          <Link href="/account" className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-bold text-[13px]">{initials}</Link>
          <form action={signOut}>
            <button className="text-[12px] tracking-wide text-muted">LOG OUT</button>
          </form>
        </div>
        </div>
      </header>

      <div className="flex-1 px-6 sm:px-11 py-10 w-full max-w-[1600px] mx-auto">
        <h1 className="font-extrabold text-[34px] tracking-[-0.04em] mb-1.5">Welcome back, {firstName}</h1>
        <p className="text-[16px] text-muted mb-9">Your Prastav workspace. Proposals is live, more services for the development sector are on the way.</p>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-grow min-w-0">
            <h2 className="font-extrabold text-[28px] tracking-[-0.03em] mb-1.5">Proposals</h2>
            <p className="text-[15px] text-muted mb-6">Start a new proposal, or pick up where you left off.</p>

            <div className="flex flex-col sm:flex-row gap-5 mb-12">
              <Link href="/new/idea" className="flex-1 bg-panel text-paper rounded-lg p-6">
                <div className="text-[18px] font-bold mb-1.5">Start from your idea</div>
                <div className="text-[14.5px] text-white/60">Your own project, or help shaping one.</div>
                <div className="mt-4 text-[12px] tracking-wide text-white/70">START →</div>
              </Link>
              <Link href="/new/rfp" className="flex-1 bg-card border border-line rounded-lg p-6">
                <div className="text-[18px] font-bold mb-1.5">Respond to an RFP</div>
                <div className="text-[14.5px] text-muted">Paste a donor call and answer it.</div>
                <div className="mt-4 text-[12px] tracking-wide">START →</div>
              </Link>
              <Link href="/new/improve" className="flex-1 bg-card border border-line rounded-lg p-6">
                <div className="text-[18px] font-bold mb-1.5">Improve a draft</div>
                <div className="text-[14.5px] text-muted">Upload and strengthen an existing one.</div>
                <div className="mt-4 text-[12px] tracking-wide">START →</div>
              </Link>
            </div>

            <div className="text-[18px] font-bold tracking-[-0.02em] mb-4">Recent proposals</div>
            {proposals.length === 0 ? (
              <div className="bg-card border border-line rounded-lg p-10 text-center">
                <p className="text-[15px] text-muted">You have no proposals yet. Start one above, and it will appear here.</p>
              </div>
            ) : (
              <div className="bg-card border border-line rounded-lg overflow-hidden">
                {proposals.map((p: any, i: number) => (
                  <Link key={p.id} href={"/proposals/" + p.id} className={`flex items-center gap-3 px-5 py-4 ${i < proposals.length - 1 ? "border-b border-[#EFEEE7]" : ""}`}>
                    <div className="flex-grow min-w-0">
                      <div className="text-[15.5px] font-semibold truncate">{(p.meta && p.meta.title) || p.title || "Untitled proposal"}</div>
                      <div className="text-[13px] text-muted mt-0.5 truncate">Updated {relativeTime(p.updated_at)}{p.meta && p.meta.geography ? " · " + p.meta.geography : ""}</div>
                    </div>
                    <span className="hidden sm:inline shrink-0 text-[10.5px] tracking-wide font-semibold text-muted border border-[#C4C2BB] px-2.5 py-1 rounded-full">{MODE[p.mode] || "OPEN IDEA"}</span>
                    <StatusPill status={p.status} />
                    <span className="shrink-0 text-[12px] tracking-wide font-semibold">OPEN →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:w-[264px] shrink-0">
            <div className="text-[12px] tracking-wide text-muted font-semibold mb-3">MORE SERVICES COMING</div>
            <div className="flex flex-col gap-3">
              {[
                ["Case study writing", "Turn your project results into a compelling case study."],
                ["Data analysis", "Make sense of your baseline and monitoring data."],
                ["Proposal scorecards", "Assess a proposal against what donors look for."],
              ].map(([t, d]) => (
                <div key={t} className="bg-card border border-line rounded-lg p-4 opacity-80">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[14.5px] font-bold">{t}</div>
                    <span className="text-[9.5px] tracking-wide font-semibold text-muted border border-[#C4C2BB] px-1.5 py-0.5 rounded">SOON</span>
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
