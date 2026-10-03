"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDict } from "./LocaleProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import { createClient } from "../../lib/supabase/client";

// Shared top menu for all public pages. Every item is its own page.
export default function SiteHeader() {
  const { locale, t } = useDict();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    try {
      createClient().auth.getUser().then(({ data }) => setSignedIn(!!data.user)).catch(() => {});
    } catch {}
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const items: [string, string][] = [
    ...(signedIn ? [] : [["/", t.nav.home] as [string, string]]),
    ["/method", t.nav.method],
    ["/samples", t.nav.samples],
    ["/pricing", t.nav.pricing],
    ["/help", t.nav.help],
    ["/policies", t.nav.policies],
    ["/contact", t.nav.contact],
  ];
  const isActive = (href: string) => href === "/" ? pathname === "/" : (pathname === href || pathname.startsWith(href + "/"));
  const navCls = locale === "hi" ? "text-[13.5px]" : "text-[11.5px] tracking-wide";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="flex items-center justify-between px-5 sm:px-8 h-[60px]">
        <Link href={signedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-[3px] bg-ink text-paper font-extrabold text-[14px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[18px] tracking-[-0.02em]">Prastav</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4 lg:gap-6">
          {items.map(([href, label]) => (
            <Link key={href} href={href} className={`hidden lg:inline ${navCls} ${isActive(href) ? "text-ink font-semibold" : "text-muted"}`}>{label}</Link>
          ))}
          <span aria-hidden className="hidden lg:block w-px h-6 bg-line mx-1" />
          <LanguageSwitcher current={locale} />
          {signedIn ? (
            <Link href="/dashboard" className="bg-ink text-paper text-[12.5px] font-semibold px-4 py-2 rounded-[3px] whitespace-nowrap">{t.nav.dashboard}</Link>
          ) : (
            <>
              <Link href="/dashboard" className={`hidden sm:inline ${navCls}`}>{t.nav.signIn}</Link>
              <Link href="/signup" className="bg-ink text-paper text-[12.5px] font-semibold px-4 py-2 rounded-[3px] whitespace-nowrap"><span className="hidden sm:inline">{t.nav.startFree}</span><span className="sm:hidden">{t.nav.signUpShort}</span></Link>
            </>
          )}
          <button
            type="button"
            aria-label={t.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="lg:hidden w-9 h-9 flex items-center justify-center border border-line rounded-[3px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (<><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>) : (<><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>)}
            </svg>
          </button>
        </nav>
      </div>
      {open && (
        <div className="lg:hidden border-t border-line bg-canvas px-5 sm:px-8 py-3">
          <div className="flex flex-col">
            {items.map(([href, label]) => (
              <Link key={href} href={href} className={`py-3 border-b border-[#EFEEE7] last:border-b-0 text-[15px] ${isActive(href) ? "font-semibold text-ink" : "text-[#3A3A31]"}`}>{label}</Link>
            ))}
            {!signedIn && <Link href="/dashboard" className="py-3 text-[15px] font-semibold">{t.nav.signIn}</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
