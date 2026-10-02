import Link from "next/link";
import { getDict } from "../../lib/i18n";

export const metadata = { title: "Help · Prastav" };

export default async function HelpPage() {
  const { t } = await getDict();
  const h = t.help;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line bg-canvas">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/contact" className="text-[13px] tracking-wide text-muted">{h.contact}</Link>
          <Link href="/dashboard" className="text-[14.5px] text-muted">{t.common.dashboard}</Link>
        </div>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-3">{h.title}</h1>
          <p className="text-[17px] text-muted leading-relaxed mb-10">
            {h.intro1}<Link href="/contact" className="font-semibold text-ink underline">{h.introLink}</Link>{h.intro2}
          </p>

          <div className="flex flex-col divide-y divide-line border-y border-line">
            {h.faq.map(([q, a]) => (
              <div key={q} className="py-6">
                <h2 className="text-[18px] font-bold tracking-[-0.01em] mb-2">{q}</h2>
                <p className="text-[15.5px] leading-relaxed text-[#3A3A31]">{a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-panel text-paper rounded-lg p-7">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] mb-2">{h.stuckTitle}</h2>
            <p className="text-[15px] leading-relaxed text-white/70 mb-5">{h.stuckBody}</p>
            <Link href="/contact" className="inline-block bg-paper text-panel text-[15px] font-semibold px-6 py-3 rounded-[4px]">{h.contactUs}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
