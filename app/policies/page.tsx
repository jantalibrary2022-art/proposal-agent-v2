import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = { title: "Policies · Prastav" };

export default async function PoliciesPage() {
  const { t } = await getDict();
  const p = t.policiesPage;
  const cards: [string, string, string][] = [
    ["/privacy", p.privacyTitle, p.privacyBody],
    ["/terms", p.termsTitle, p.termsBody],
    ["/refunds", p.refundsTitle, p.refundsBody],
  ];
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-grow px-5 sm:px-8 py-14 sm:py-20 w-full max-w-[1000px] mx-auto">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">{p.kicker}</div>
        <h1 className="font-extrabold text-[clamp(28px,5vw,44px)] tracking-[-0.03em] leading-[1.06]">{p.title}</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#3A3A31] max-w-[720px]">{p.intro}</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map(([href, title, body]) => (
            <Link key={href} href={href} className="bg-card border border-line rounded-lg p-6 flex flex-col hover:border-ink">
              <div className="text-[17px] font-bold mb-2">{title}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42] flex-grow">{body}</div>
              <div className="mt-5 text-[13px] tracking-wide font-semibold">{p.read}</div>
            </Link>
          ))}
        </div>
        {p.languageNote && <p className="mt-6 text-[13.5px] text-muted">{p.languageNote}</p>}
      </main>
    </div>
  );
}
