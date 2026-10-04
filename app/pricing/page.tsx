import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";
import { createAdminClient } from "../../lib/supabase/admin";
import { publicOffer } from "../../lib/offers";
import { pricePaise } from "../../lib/razorpay";

export const metadata = { title: "Pricing · Prastav" };

export default async function PricingPage() {
  const { t } = await getDict();
  const p = t.pricingPage;
  const o = t.offer;
  let offer = null as Awaited<ReturnType<typeof publicOffer>>;
  try { offer = await publicOffer(createAdminClient(), pricePaise()); } catch {}
  const inr = (paise: number) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");
  const h2 = "mt-16 text-[20px] font-bold tracking-[-0.01em] mb-5";
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-grow px-5 sm:px-8 py-14 sm:py-20 w-full max-w-[1000px] mx-auto">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{p.kicker}</div>
        <h1 className="font-extrabold text-[clamp(28px,5vw,44px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">{p.title}</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#3A3A31] max-w-[720px]">{p.intro}</p>

        {/* Live services */}
        <h2 className={h2}>{p.liveTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
          <div className="bg-card border border-line rounded-lg p-7">
            <div className="text-[16px] font-bold">{p.proposalName}</div>
            {offer ? (
              <div className="mt-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-[36px] font-extrabold tracking-[-0.03em]">{inr(offer.offerPaise)}</span>
                  <span className="text-[18px] text-muted line-through">{inr(offer.fullPaise)}</span>
                  <span className="text-[14px] text-muted">{p.proposalUnit}</span>
                </div>
                <div className="text-[14px] text-[#3A3A31] mt-1">{o.priceLine}</div>
                {offer.remaining !== null && offer.total ? (
                  <div className="mt-4 pt-3 border-t border-[#ECEAE1]">
                    <div className="flex justify-between items-center text-[13.5px]"><span><b>{o.placesOf.replace("{n}", String(offer.remaining)).replace("{total}", String(offer.total))}</b></span><span className="text-muted text-[12.5px]">{o.applied}</span></div>
                    <div className="h-1 bg-[#ECEAE1] rounded mt-2 overflow-hidden"><div className="h-full bg-ink" style={{ width: `${Math.round(((offer.total - offer.remaining) / offer.total) * 100)}%` }} /></div>
                  </div>
                ) : null}
              </div>
            ) : (
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-[36px] font-extrabold tracking-[-0.03em]">{p.proposalPrice}</span>
              <span className="text-[14px] text-muted">{p.proposalUnit}</span>
            </div>
            )}
            <div className="mt-5 text-[12px] tracking-[0.08em] text-muted mb-2">{p.includedTitle.toUpperCase()}</div>
            <ul className="flex flex-col gap-2">
              {p.included.map((item) => (
                <li key={item} className="flex gap-2.5 text-[14.5px] leading-relaxed text-[#3A3A31]">
                  <span className="mt-[2px] text-ink">✓</span><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-panel text-paper rounded-lg p-7 flex flex-col">
            <div className="text-[16px] font-bold">{p.consultName}</div>
            <div className="text-[24px] font-extrabold tracking-[-0.02em] mt-2">{p.consultPrice}</div>
            <div className="text-[14.5px] leading-relaxed text-white/70 mt-3">{p.consultBody}</div>
            <Link href="/contact" className="inline-block self-start mt-auto pt-5">
              <span className="inline-block bg-paper text-panel text-[14px] font-semibold px-5 py-2.5 rounded-[4px]">{p.consultCta}</span>
            </Link>
          </div>
        </div>
        <p className="mt-4 text-[13.5px] text-muted leading-relaxed max-w-[720px]">{p.comingNote}</p>

        {/* Payment process */}
        <h2 className={h2}>{p.processTitle}</h2>
        <ol className="flex flex-col border-y border-line divide-y divide-line">
          {p.process.map(([title, d], i) => (
            <li key={title} className="py-5 flex gap-5">
              <span className="shrink-0 w-7 h-7 rounded-full bg-ink text-paper text-[13px] font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <div className="text-[16px] font-bold mb-1">{title}</div>
                <div className="text-[14.5px] leading-relaxed text-[#4A4A42] max-w-[680px]">{d}</div>
              </div>
            </li>
          ))}
        </ol>

        {/* Draft rules */}
        <h2 className={h2}>{p.draftRulesTitle}</h2>
        <div className="flex flex-col border-y border-line divide-y divide-line">
          {p.draftRules.map(([title, d]) => (
            <div key={title} className="py-4 grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-6">
              <div className="text-[15px] font-bold">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>

        {/* Discounts */}
        <h2 className={h2}>{p.discountTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {p.discountItems.map(([title, d]) => (
            <div key={title} className="bg-card border border-line rounded-lg p-6">
              <div className="text-[15.5px] font-bold mb-2">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>
        <Link href="/contact" className="inline-block mt-4 text-[14.5px] font-semibold underline">{p.askDiscount}</Link>

        {/* Good to know */}
        <h2 className={h2}>{p.termsTitle}</h2>
        <div className="flex flex-col border-y border-line divide-y divide-line">
          {p.terms.map(([title, d]) => (
            <div key={title} className="py-4 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-6">
              <div className="text-[15px] font-bold">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>
        <Link href="/refunds" className="inline-block mt-4 text-[14.5px] font-semibold underline">{p.refundLink}</Link>

        <div className="mt-16">
          <Link href="/signup" className="bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">{p.cta}</Link>
        </div>
      </main>
    </div>
  );
}
