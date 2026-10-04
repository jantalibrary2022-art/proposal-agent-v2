import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isAdminEmail, adminToken } from "../../../lib/admin-auth";
import { getOfferState, isLive, applyOffer } from "../../../lib/offers";
import { pricePaise } from "../../../lib/razorpay";
import PinGate from "../PinGate";
import OfferControls from "./OfferControls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  const pin = process.env.ADMIN_PIN || "";
  if (pin) {
    const store = await cookies();
    if ((store.get("prastav_admin")?.value || "") !== adminToken(pin, user.id)) return <PinGate />;
  }

  const admin = createAdminClient();
  const st = await getOfferState(admin);
  const full = pricePaise();
  let uses: { date: string; email: string; amount: number }[] = [];
  if (st) {
    const { data } = await admin.from("purchases").select("user_id,amount,created_at,buyer_email").eq("offer_code", st.offer.code).eq("status", "paid").order("created_at", { ascending: true }).limit(200);
    for (const r of data || []) {
      let email = r.buyer_email || "";
      if (!email && r.user_id) { try { const { data: u } = await admin.auth.admin.getUserById(r.user_id); email = u?.user?.email || ""; } catch {} }
      uses.push({ date: r.created_at, email, amount: Number(r.amount || 0) });
    }
  }
  const live = isLive(st);
  const inr = (rs: number) => "₹" + Math.round(rs).toLocaleString("en-IN");

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="h-16 border-b border-line">
        <div className="h-full max-w-[1100px] mx-auto px-6 sm:px-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[19px] tracking-[-0.02em]">Prastav</span>
            <span className="text-[11px] tracking-[0.1em] text-muted border border-line rounded px-2 py-0.5 ml-1">ADMIN</span>
          </div>
          <Link href="/admin" className="text-[13px] tracking-wide text-muted">← Admin</Link>
        </div>
      </header>
      <div className="max-w-[1100px] mx-auto px-6 sm:px-11 py-10">
        <h1 className="font-extrabold text-[30px] tracking-[-0.03em] mb-2">Offers</h1>
        <p className="text-[14px] text-muted mb-8 max-w-[680px] leading-relaxed">Automatic offers are applied by the site without a code. Switching an offer off removes it from the homepage strip, the pricing page, the dashboard and the pay step at once, and restores the normal price. Places are counted when a payment succeeds, so if several people are at checkout at the moment the last place goes, one or two extra may get the offer. Orders opened just before you switch an offer off are still honoured. If an offer beats a discount code already redeemed on a draft, the offer price is charged and the code counts as used.</p>
        {!st ? (
          <div className="bg-card border border-line rounded-lg p-6 text-[14.5px]">The offers table is not set up yet. Run <code>sql/offers.sql</code> in Supabase → SQL Editor.</div>
        ) : (
          <div className="bg-card border border-line rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="text-[18px] font-bold">{st.offer.name} <span className="text-[13px] text-muted font-normal">({st.offer.code})</span></div>
                <div className="text-[14px] text-[#3A3A31] mt-1">{st.offer.kind === "percent" ? `${st.offer.value}% off` : `₹${st.offer.value} off`} a user's first paid proposal · {inr(full / 100)} → {inr(applyOffer(full, st.offer) / 100)}</div>
              </div>
              <span className={"text-[11px] tracking-wide font-semibold px-2.5 py-1 rounded-full " + (live ? "bg-ink text-paper" : "border border-[#C4C2BB] text-muted")}>{live ? "LIVE" : st.offer.active ? "ON · FULL OR OUT OF DATES" : "OFF"}</span>
            </div>
            <div className="text-[14px] mb-5"><b>{st.used}</b> used{st.offer.max_total != null ? <> of <b>{st.offer.max_total}</b> places · <b>{st.remaining}</b> left</> : " · unlimited places"}</div>
            <OfferControls code={st.offer.code} active={st.offer.active} maxTotal={st.offer.max_total} />
            <div className="mt-7 text-[12px] tracking-[0.08em] text-muted mb-2">USED BY</div>
            {uses.length === 0 ? <div className="text-[14px] text-muted">No payments with this offer yet.</div> : (
              <table className="w-full text-[13.5px]">
                <tbody className="divide-y divide-[#EFEEE7]">
                  {uses.map((u, i) => (<tr key={i}><td className="py-2 pr-3 tabular-nums text-muted">{i + 1}</td><td className="py-2 pr-3">{u.email || "—"}</td><td className="py-2 pr-3 tabular-nums">{new Date(u.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td><td className="py-2 text-right tabular-nums">{inr(u.amount)}</td></tr>))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
