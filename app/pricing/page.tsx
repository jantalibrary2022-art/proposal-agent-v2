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

        {/* Free tier */}
        <h2 className={h2}>{p.freeSectionTitle}</h2>
        <div className="bg-card border border-line rounded-lg p-7 sm:p-9">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-[21px] font-extrabold tracking-[-0.02em]">{p.freePanelTitle}</h3>
            <span className="text-[10.5px] font-bold tracking-[0.04em] uppercase bg-ink text-paper px-2.5 py-1 rounded-full">{p.freeBadge}</span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-[#3A3A31] max-w-[64ch]">{p.freePanelSub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-7 mt-7 pt-7 border-t border-[#ECEAE1]">
            {p.freeItems.map(([q, u, n, d], i) => (
              <div key={n} className="flex flex-col gap-1.5 min-w-0">
                <div className="text-[28px] font-extrabold tracking-[-0.03em] leading-none tabular-nums">{q}<span className="text-[13px] font-semibold text-muted"> {u}</span></div>
                <div className="text-[14.5px] font-bold">{n}</div>
                <div className="text-[12.5px] text-muted leading-relaxed">{d}{i === 2 ? <span className="text-[#2F5E3A] font-semibold"> {p.liveNow}</span> : null}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-[#ECEAE1] flex items-center justify-between gap-5 flex-wrap">
            <p className="text-[13.5px] text-[#4A4A42] leading-relaxed max-w-[58ch]">{p.freeFoot}</p>
            <Link href="/signup" className="inline-block bg-ink text-paper text-[14.5px] font-semibold px-6 py-3 rounded-[4px]">{p.freeCta}</Link>
          </div>
        </div>

        {/* Pay per product */}
        <h2 className={h2}>{p.paidSectionTitle}</h2>
        <p className="text-[15px] leading-relaxed text-[#3A3A31] max-w-[66ch] -mt-2 mb-5">{p.paidIntro}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-line rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between gap-2.5"><h4 className="text-[16px] font-extrabold tracking-[-0.01em]">{p.proposalName}</h4><span className="text-[10.5px] font-bold tracking-[0.04em] uppercase bg-[#E2EDE3] text-[#2F5E3A] px-2 py-0.5 rounded-full">{p.liveTag}</span></div>
            <div className="flex items-baseline gap-2 mt-3.5">{offer ? (<><span className="text-[30px] font-extrabold tracking-[-0.03em] leading-none">{inr(offer.offerPaise)}</span><span className="text-[15px] text-muted line-through">{inr(offer.fullPaise)}</span></>) : (<span className="text-[30px] font-extrabold tracking-[-0.03em] leading-none">{p.proposalPrice}</span>)}<span className="text-[13px] text-muted">{p.proposalUnit}</span></div>
            {offer ? <div className="mt-2.5 text-[12.5px] text-[#3A3A31]"><b>{p.foundingLine}</b></div> : null}
            <div className="mt-3.5 text-[13.5px] text-[#4A4A42] leading-relaxed">{p.proposalDesc}</div>
          </div>
          <div className="bg-card border border-line rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between gap-2.5"><h4 className="text-[16px] font-extrabold tracking-[-0.01em]">{p.conceptName}</h4><span className="text-[10.5px] font-bold tracking-[0.04em] uppercase border border-line text-muted px-2 py-0.5 rounded-full">{p.soonTag}</span></div>
            <div className="flex items-baseline gap-2 mt-3.5"><span className="text-[30px] font-extrabold tracking-[-0.03em] leading-none">{p.conceptPrice}</span><span className="text-[13px] text-muted">{p.conceptUnit}</span></div>
            <div className="mt-3.5 text-[13.5px] text-[#4A4A42] leading-relaxed">{p.conceptDesc}</div>
          </div>
          <div className="bg-card border border-line rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between gap-2.5"><h4 className="text-[16px] font-extrabold tracking-[-0.01em]">{p.caseName}</h4><span className="text-[10.5px] font-bold tracking-[0.04em] uppercase border border-line text-muted px-2 py-0.5 rounded-full">{p.soonTag}</span></div>
            <div className="flex items-baseline gap-2 mt-3.5"><span className="text-[30px] font-extrabold tracking-[-0.03em] leading-none">{p.casePrice}</span><span className="text-[13px] text-muted">{p.caseUnit}</span></div>
            <div className="mt-3.5 text-[13.5px] text-[#4A4A42] leading-relaxed">{p.caseDesc}</div>
          </div>
        </div>
        <div className="mt-4 bg-panel text-paper rounded-lg p-7 flex flex-col">
          <div className="flex items-center justify-between gap-2.5"><h4 className="text-[16px] font-extrabold tracking-[-0.01em]">{p.consultName}</h4><span className="text-[10.5px] font-bold tracking-[0.04em] uppercase border border-white/25 text-white/60 px-2 py-0.5 rounded-full">{p.soonTag}</span></div>
          <div className="flex items-baseline gap-2 mt-3.5"><span className="text-[22px] font-extrabold tracking-[-0.02em]">{p.consultPrice}</span><span className="text-[13px] text-white/55">{p.consultUnit}</span></div>
          <div className="mt-3 text-[14px] text-white/70 leading-relaxed max-w-[70ch]">{p.consultDesc}</div>
          <Link href="/contact" className="inline-block self-start mt-5 bg-paper text-panel text-[14px] font-semibold px-5 py-2.5 rounded-[4px]">{p.consultCta}</Link>
        </div>

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
