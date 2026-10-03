import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";
import { DemoInline } from "../_components/DemoVideo";

export const metadata = { title: "Method · Prastav" };

export default async function MethodPage() {
  const { t } = await getDict();
  const m = t.methodPage;
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-grow px-5 sm:px-8 py-14 sm:py-20 w-full max-w-[1000px] mx-auto">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{m.kicker}</div>
        <h1 className="font-extrabold text-[clamp(28px,5vw,44px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">{m.title}</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#3A3A31] max-w-[720px]">{m.intro}</p>
        <DemoInline className="mt-10 max-w-[860px]" />

        <h2 className="mt-16 text-[20px] font-bold tracking-[-0.01em] mb-5">{m.waysTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.how.modes.map(([title, d], i) => (
            <div key={title} className="bg-card border border-line rounded-lg p-6">
              <div className="text-[12px] tracking-[0.1em] text-muted mb-3">0{i + 1}</div>
              <div className="text-[16.5px] font-bold mb-2">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-[20px] font-bold tracking-[-0.01em] mb-5">{m.stepsTitle}</h2>
        <ol className="flex flex-col border-y border-line divide-y divide-line">
          {m.steps.map(([title, d], i) => (
            <li key={title} className="py-5 flex gap-5">
              <span className="shrink-0 w-7 h-7 rounded-full bg-ink text-paper text-[13px] font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <div className="text-[16px] font-bold mb-1">{title}</div>
                <div className="text-[14.5px] leading-relaxed text-[#4A4A42] max-w-[680px]">{d}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[14px] text-muted leading-relaxed max-w-[680px]">{m.timeNote}</p>

        <h2 className="mt-16 text-[20px] font-bold tracking-[-0.01em] mb-6">{t.standard.heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
          {t.standard.items.map(([title, d]) => (
            <div key={title} className="flex gap-3.5">
              <span className="mt-[7px] w-2 h-2 rounded-full bg-ink shrink-0" />
              <div>
                <div className="text-[15.5px] font-bold mb-1">{title}</div>
                <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center gap-3 flex-wrap">
          <Link href="/signup" className="bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">{m.ctaStart}</Link>
          <Link href="/pricing" className="border border-ink text-ink text-[15px] font-semibold px-6 py-3 rounded-[4px]">{m.ctaPricing}</Link>
        </div>
      </main>
    </div>
  );
}
