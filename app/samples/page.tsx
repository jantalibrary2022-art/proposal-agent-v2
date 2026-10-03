import Link from "next/link";
import { SAMPLES } from "./_data";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = {
  title: "Sample proposals — Prastav",
  description: "Real proposals built with Prastav, view-only.",
};

export default async function SamplesPage() {
  const { t } = await getDict();
  const sm = t.samples;
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="px-5 sm:px-8 w-full max-w-[1000px] mx-auto py-16 sm:py-20">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{sm.kicker}</div>
        <h1 className="font-extrabold text-[clamp(28px,5vw,44px)] tracking-[-0.03em] leading-[1.05] max-w-[720px]">{sm.title}</h1>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[680px]">{sm.intro}</p>

        <div className="mt-11 flex flex-col gap-4">
          {SAMPLES.map((s) => (
            <Link key={s.slug} href={"/samples/" + s.slug} className="group bg-card border border-line rounded-lg p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10.5px] tracking-[0.08em] font-semibold text-muted border border-[#C4C2BB] px-2 py-0.5 rounded-full">{s.mode.toUpperCase()}</span>
                  <span className="text-[12.5px] text-muted">{s.geo}</span>
                </div>
                <div className="text-[19px] font-bold tracking-[-0.02em] mb-1">{s.title}</div>
                <div className="text-[14.5px] leading-relaxed text-[#4A4A42] max-w-[620px]">{s.subtitle}</div>
              </div>
              <span className="shrink-0 text-[13px] tracking-wide font-semibold">{sm.view}</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-[13px] text-muted">{sm.note}</div>
      </div>
    </main>
  );
}
