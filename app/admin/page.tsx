import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import PinGate from "./PinGate";
import TestEmailButton from "./TestEmailButton";
import { sweepStuckProposals } from "../../lib/sweep";

export const runtime = "nodejs";

function isAdmin(email: string | undefined | null) {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  if (m < 1440) return Math.floor(m / 60) + "h ago";
  return Math.floor(m / 1440) + "d ago";
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/dashboard");

  // Second gate: an admin PIN, when ADMIN_PIN is configured.
  const pin = process.env.ADMIN_PIN || "";
  if (pin) {
    const store = await cookies();
    const token = store.get("prastav_admin")?.value || "";
    const expected = crypto.createHash("sha256").update(pin + "|" + user.id).digest("hex");
    if (token !== expected) return <PinGate />;
  }

  const admin = createAdminClient();
  try { await sweepStuckProposals(admin); } catch {}
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [viewsTotal, views7, fb, errs] = await Promise.all([
    admin.from("page_views").select("id", { count: "exact", head: true }),
    admin.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("feedback").select("*").order("created_at", { ascending: false }).limit(50),
    admin.from("error_alerts").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  const totalVisits = viewsTotal.count || 0;
  const weekVisits = views7.count || 0;
  const feedback: any[] = fb.data || [];
  const errors: any[] = errs.data || [];
  const openErrors = errors.filter((e) => !e.resolved).length;
  const avg = (k: string) => {
    const vals = feedback.map((f) => f[k]).filter((v) => typeof v === "number");
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  const tile = "bg-card border border-line rounded-lg p-5";

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="h-16 border-b border-line">
        <div className="h-full max-w-[1100px] mx-auto px-6 sm:px-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[19px] tracking-[-0.02em]">Prastav</span>
            <span className="text-[11px] tracking-[0.1em] text-muted border border-line rounded px-2 py-0.5 ml-1">ADMIN</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/admin/users" className="text-[13px] tracking-wide text-muted">Users</Link>
            <Link href="/admin/coupons" className="text-[13px] tracking-wide text-muted">Access codes</Link>
            <Link href="/dashboard" className="text-[13px] tracking-wide text-muted">← Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 sm:px-11 py-10">
        <h1 className="font-extrabold text-[30px] tracking-[-0.03em] mb-6">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className={tile}><div className="text-[12px] tracking-[0.08em] text-muted mb-2">VISITS · ALL TIME</div><div className="text-[32px] font-extrabold tracking-[-0.02em] tabular-nums">{totalVisits.toLocaleString()}</div></div>
          <div className={tile}><div className="text-[12px] tracking-[0.08em] text-muted mb-2">VISITS · 7 DAYS</div><div className="text-[32px] font-extrabold tracking-[-0.02em] tabular-nums">{weekVisits.toLocaleString()}</div></div>
          <div className={tile}><div className="text-[12px] tracking-[0.08em] text-muted mb-2">FEEDBACK</div><div className="text-[32px] font-extrabold tracking-[-0.02em] tabular-nums">{feedback.length}</div></div>
          <div className={tile}><div className="text-[12px] tracking-[0.08em] text-muted mb-2">OPEN ALERTS</div><div className="text-[32px] font-extrabold tracking-[-0.02em] tabular-nums">{openErrors}</div></div>
        </div>

        <TestEmailButton />

        <div className="text-[18px] font-bold tracking-[-0.02em] mb-4">Feedback</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[["Process", "process"], ["Ease of use", "ease"], ["Proposal quality", "quality"], ["Website", "website"]].map(([label, k]) => (
            <div key={k} className={tile}><div className="text-[12px] tracking-[0.08em] text-muted mb-2">{label.toUpperCase()}</div><div className="text-[26px] font-extrabold tracking-[-0.02em] tabular-nums">{avg(k)}<span className="text-[14px] text-muted font-semibold"> / 5</span></div></div>
          ))}
        </div>
        {feedback.length === 0 ? (
          <div className="text-[14px] text-muted mb-12">No feedback yet.</div>
        ) : (
          <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7] mb-12">
            {feedback.filter((f) => (f.comment || "").trim()).slice(0, 20).map((f) => (
              <div key={f.id} className="px-5 py-4">
                <div className="text-[12px] text-muted mb-1 tabular-nums">P {f.process} · E {f.ease} · Q {f.quality} · W {f.website} · {relTime(f.created_at)}</div>
                <div className="text-[14.5px] leading-relaxed">{f.comment}</div>
              </div>
            ))}
            {feedback.filter((f) => (f.comment || "").trim()).length === 0 && <div className="px-5 py-4 text-[14px] text-muted">Ratings received, no written comments yet.</div>}
          </div>
        )}

        <div className="text-[18px] font-bold tracking-[-0.02em] mb-4">Build alerts</div>
        {errors.length === 0 ? (
          <div className="text-[14px] text-muted">No build failures logged. Good.</div>
        ) : (
          <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
            {errors.map((e) => (
              <div key={e.id} className="px-5 py-4 flex items-start gap-3">
                <span className={"mt-1 shrink-0 text-[10px] tracking-wide font-semibold px-2 py-0.5 rounded " + (e.resolved ? "text-muted border border-[#C4C2BB]" : "bg-ink text-paper")}>{e.resolved ? "RESOLVED" : "OPEN"}</span>
                <div className="min-w-0">
                  <div className="text-[12px] text-muted mb-0.5 tabular-nums">{(e.mode || "—").toUpperCase()} · {relTime(e.created_at)} · user {String(e.user_id || "").slice(0, 8)} · proposal {String(e.proposal_id || "").slice(0, 8)}</div>
                  <div className="text-[14px] leading-snug break-words">{e.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
