import Link from "next/link";
import { redirect } from "next/navigation";
import Track from "./_components/Track";
import SiteHeader from "./_components/SiteHeader";
import { DemoButton } from "./_components/DemoVideo";
import OfferStrip from "./_components/OfferStrip";
import { createAdminClient } from "../lib/supabase/admin";
import { publicOffer } from "../lib/offers";
import { pricePaise } from "../lib/razorpay";
import { getChosenLocale, dictFor, DEFAULT_LOCALE } from "../lib/i18n";

export default async function Home() {
  const chosen = await getChosenLocale();
  if (!chosen) redirect("/language");
  const locale = chosen || DEFAULT_LOCALE;
  const t = dictFor(locale);
  let offer = null as Awaited<ReturnType<typeof publicOffer>>;
  try { offer = await publicOffer(createAdminClient(), pricePaise()); } catch {}

  return (
    <main className="min-h-screen flex flex-col">
      <Track path="/" />
      {offer && <OfferStrip code={offer.code} kind={offer.kind} value={offer.value} remaining={offer.remaining} total={offer.total} />}
      <SiteHeader />

      {/* Meta line */}
      <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 text-center">
        <span className="text-[11px] sm:text-[12px] tracking-[0.08em] text-muted">{t.meta.workbench}</span>
        <span className="text-[10px] sm:text-[11px] tracking-[0.08em] border border-line rounded px-2 py-0.5">{t.meta.proposals}</span>
        <span className="text-[11px] sm:text-[12px] tracking-[0.08em] text-muted">{t.meta.moreSoon}</span>
      </div>

      {/* Wordmark */}
      <h1 className="text-center font-extrabold leading-[0.9] tracking-[-0.04em] mt-3 text-[clamp(64px,14vw,150px)]">Prastav</h1>

      {/* Byline */}
      <div className="mt-4 flex items-center justify-center gap-2.5 px-5 text-center">
        <span className="w-5 h-5 rounded bg-ink flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#2A2A24]">{t.byline}</span>
      </div>
      <div className="mt-5 flex justify-center px-5"><DemoButton /></div>

      {/* Framed panel */}
      <section className="relative mx-4 sm:mx-8 my-7 min-h-[540px] lg:min-h-[600px] rounded-[18px] bg-panel overflow-hidden">
        <div aria-hidden className="pointer-events-none select-none absolute -bottom-10 left-0 w-full text-center font-extrabold tracking-[-0.04em] text-white/[0.04] leading-none text-[clamp(120px,22vw,210px)]">EVIDENCE</div>

        {/* Proposal specimen */}
        <div className="absolute left-1/2 -translate-x-1/2 top-12 sm:top-14 w-[300px] sm:w-[328px] bg-card rounded-md shadow-[0_30px_70px_rgba(0,0,0,0.42)] overflow-hidden text-left">
          <div className="bg-ink px-5 py-5">
            <div className="text-[9.5px] tracking-[0.15em] text-white/50">{t.specimen.kicker}</div>
            <div className="mt-2 text-white font-bold text-[16px] leading-tight tracking-[-0.02em]">{t.specimen.title}</div>
          </div>
          <div className="px-5 py-5">
            <div className="text-[9px] tracking-[0.1em] text-muted mb-3">{t.specimen.problem}</div>
            <div className="h-[7px] w-[95%] bg-[#ECEAE1] rounded mb-2" />
            <div className="h-[7px] w-full bg-[#ECEAE1] rounded mb-2" />
            <div className="h-[7px] w-[74%] bg-[#ECEAE1] rounded mb-5" />
            <div className="text-[9px] tracking-[0.1em] text-muted mb-2.5">{t.specimen.results}</div>
            <div className="border border-[#E9E7DD] rounded overflow-hidden">
              <div className="flex bg-[#F5F4EF] text-[8.5px] text-muted"><div className="basis-[60px] shrink-0 px-2 py-1.5">{t.specimen.level}</div><div className="grow px-2 py-1.5">{t.specimen.target}</div></div>
              <div className="flex border-t border-[#EEECE3] text-[11px]"><div className="basis-[60px] shrink-0 px-2 py-1.5 font-bold">Out.2</div><div className="grow px-2 py-1.5 text-[#3A3A31]">{t.specimen.out2}</div></div>
              <div className="flex border-t border-[#EEECE3] text-[11px]"><div className="basis-[60px] shrink-0 px-2 py-1.5 font-bold">Out.1</div><div className="grow px-2 py-1.5 text-[#3A3A31]">{t.specimen.out1}</div></div>
            </div>
          </div>
        </div>

        {/* Budget chip */}
        <div className="hidden lg:block absolute top-[300px] left-[9%] w-[256px] bg-card rounded-md shadow-[0_24px_54px_rgba(0,0,0,0.4)] p-4">
          <div className="text-[9px] tracking-[0.1em] text-muted mb-3">{t.specimen.budget}</div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] text-[#3A3A31]">{t.specimen.coordinator}</span>
            <span className="text-[8px] tracking-wide text-paper bg-ink px-1.5 py-0.5 rounded">{t.specimen.sourced}</span>
          </div>
          <div className="h-px bg-[#EEECE3] mb-2.5" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#3A3A31]">{t.specimen.crp}</span>
            <span className="text-[8px] tracking-wide text-muted border border-line px-1.5 py-0.5 rounded">{t.specimen.estFlag}</span>
          </div>
        </div>

        {/* Format tags */}
        <div className="hidden lg:flex absolute top-[150px] right-[9%] flex-col gap-2.5">
          <div className="text-[10px] tracking-[0.1em] text-panel bg-card rounded px-3.5 py-2 text-center shadow-lg">PDF</div>
          <div className="text-[10px] tracking-[0.1em] text-white/85 bg-white/[0.08] border border-white/15 rounded px-3.5 py-2 text-center">WORD</div>
          <div className="text-[10px] tracking-[0.1em] text-white/85 bg-white/[0.08] border border-white/15 rounded px-3.5 py-2 text-center">EXCEL</div>
        </div>

        {/* Pill */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 border border-white/15 rounded-full py-2 pl-3 sm:pl-4 pr-2 backdrop-blur">
          <span className="w-[22px] h-[22px] rounded-full bg-paper text-panel font-extrabold text-[12px] flex items-center justify-center mr-1">प्र</span>
          <Link href="/method" className="text-[13px] sm:text-[13.5px] font-medium text-white/85 px-3 sm:px-3.5 py-2">{t.pill.how}</Link>
          <Link href="/samples" className="text-[13px] sm:text-[13.5px] font-medium text-white/85 px-3 sm:px-3.5 py-2">{t.pill.sample}</Link>
          <Link href="/signup" className="text-[13px] sm:text-[13.5px] font-semibold text-panel bg-paper px-4 sm:px-[18px] py-2 rounded-full">{t.pill.startFree}</Link>
        </div>
      </section>

      {/* Why not a chatbot */}
      <section className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-20 sm:py-28">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{t.chatbot.kicker}</div>
        <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">{t.chatbot.heading}</h2>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[720px]">{t.chatbot.body}</p>
        <div className="mt-11 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {t.chatbot.cards.map(([title, d]) => (
            <div key={title} className="bg-card border border-line rounded-lg p-6">
              <div className="text-[16px] font-bold mb-2">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The practitioner */}
      <section className="bg-panel text-paper">
        <div className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-20 sm:py-28">
          <div className="text-[12px] tracking-[0.1em] text-white/45 mb-8">{t.practitioner.kicker}</div>
          <div className="flex flex-col md:flex-row gap-10 md:gap-14 md:items-start">
            <div className="shrink-0 md:w-[260px]">
              <img src="/prakash-kumar.jpg" alt="Prakash Kumar" className="w-[190px] md:w-full aspect-[4/5] object-cover object-top rounded-xl grayscale" />
              <div className="mt-4">
                <div className="text-[17px] font-bold tracking-[-0.02em]">{t.practitioner.name}</div>
                <div className="text-[13.5px] text-white/55 mt-0.5 leading-snug">{t.practitioner.role}</div>
              </div>
            </div>
            <div className="min-w-0 flex-grow">
              <h2 className="font-extrabold text-[clamp(26px,4.3vw,40px)] tracking-[-0.03em] leading-[1.06] max-w-[620px]">{t.practitioner.heading}</h2>
              <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-white/75 max-w-[620px]">{t.practitioner.body1}</p>
              <p className="mt-4 text-[16px] leading-relaxed text-white/60 max-w-[620px]">{t.practitioner.body2}</p>
            </div>
          </div>

          <div className="mt-14 pt-9 border-t border-white/12">
            <div className="text-[12px] tracking-[0.1em] text-white/45 mb-6">{t.practitioner.orgsKicker}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <div className="text-[11px] tracking-[0.08em] text-white/35 mb-3">{t.practitioner.colMultilateral}</div>
                <div className="flex flex-col gap-1.5 text-[15px] font-semibold text-white/85">
                  <span>World Bank</span><span>UNICEF</span><span>Save the Children</span><span>HelpAge India</span><span>Research Triangle Institute</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.08em] text-white/35 mb-3">{t.practitioner.colGovernment}</div>
                <div className="flex flex-col gap-1.5 text-[15px] font-semibold text-white/85">
                  <span>NRLM</span><span>BRLPS</span><span>JSLPS</span><span>SHSRC Chhattisgarh</span><span>Nalanda Medical College &amp; Hospital</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.08em] text-white/35 mb-3">{t.practitioner.colCsr}</div>
                <div className="flex flex-col gap-1.5 text-[15px] font-semibold text-white/85">
                  <span>Protiviti</span><span>Medica Synergie</span><span>OakNorth</span>
                </div>
              </div>
            </div>
            <div className="mt-7 text-[13px] leading-relaxed text-white/45 max-w-[840px]">{t.practitioner.orgsNote}</div>
          </div>
        </div>
      </section>

      {/* Three ways in */}
      <section id="how" className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-20 sm:py-28 scroll-mt-16">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{t.how.kicker}</div>
        <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">{t.how.heading}</h2>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[720px]">{t.how.body}</p>
        <div className="mt-11 grid grid-cols-1 md:grid-cols-3 gap-5">
          {t.how.modes.map(([title, d], i) => (
            <div key={title} className="bg-card border border-line rounded-lg p-6">
              <div className="text-[12px] tracking-[0.1em] text-muted mb-3">0{i + 1}</div>
              <div className="text-[17px] font-bold mb-2">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The standard */}
      <section className="bg-faint border-y border-line">
        <div className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-20 sm:py-28">
          <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{t.standard.kicker}</div>
          <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">{t.standard.heading}</h2>
          <div className="mt-11 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7 max-w-[900px]">
            {t.standard.items.map(([title, d]) => (
              <div key={title} className="flex gap-3.5">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-ink shrink-0" />
                <div>
                  <div className="text-[16px] font-bold mb-1">{title}</div>
                  <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-20 sm:py-28 scroll-mt-16">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{t.pricing.kicker}</div>
        <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">{t.pricing.heading}</h2>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[720px]">{t.pricing.body}</p>
        <div className="mt-11 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[820px]">
          <div className="bg-card border border-line rounded-lg p-7">
            <div className="text-[12px] tracking-[0.1em] text-muted mb-3">{t.pricing.perProposalKicker}</div>
            <div className="flex items-baseline gap-1.5 mb-1"><span className="text-[34px] font-extrabold tracking-[-0.03em]">{t.pricing.price}</span><span className="text-[14px] text-muted">{t.pricing.priceUnit}</span></div>
            <div className="text-[14.5px] leading-relaxed text-[#4A4A42] mt-3">{t.pricing.perProposalBody}</div>
          </div>
          <div className="bg-panel text-paper rounded-lg p-7 flex flex-col">
            <div className="text-[12px] tracking-[0.1em] text-white/45 mb-3">{t.pricing.personalKicker}</div>
            <div className="text-[22px] font-extrabold tracking-[-0.02em] leading-tight mb-2">{t.pricing.personalHeading}</div>
            <div className="text-[14.5px] leading-relaxed text-white/70">{t.pricing.personalBody}</div>
            <Link href="/contact" className="inline-block self-start mt-5 bg-paper text-panel text-[14px] font-semibold px-5 py-2.5 rounded-[4px]">{t.pricing.getInTouch}</Link>
            <div className="mt-4 text-[12.5px] text-white/40">{t.pricing.terms}</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-panel text-paper">
        <div className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-20 sm:py-28 text-center">
          <h2 className="font-extrabold text-[clamp(30px,5vw,48px)] tracking-[-0.03em] leading-[1.03] max-w-[720px] mx-auto">{t.cta.heading}</h2>
          <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/signup" className="bg-paper text-panel text-[15px] font-semibold px-7 py-3.5 rounded-[4px]">{t.cta.startFree}</Link>
            <Link href="/method" className="border border-white/25 text-paper text-[15px] font-semibold px-7 py-3.5 rounded-[4px]">{t.cta.seeHow}</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
