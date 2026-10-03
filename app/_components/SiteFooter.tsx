"use client";

import Link from "next/link";
import { useDict } from "./LocaleProvider";

// Global footer, rendered from the root layout so it appears on every page,
// including the signed-in dashboard and proposal pages. Houses all policies.
export default function SiteFooter() {
  const { t } = useDict();
  const f = t.footer;
  const col = "text-[11.5px] tracking-[0.1em] text-muted mb-3";
  const link = "text-[14px] text-[#3A3A31] hover:text-ink";
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-[3px] bg-ink text-paper font-extrabold text-[14px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[16px] tracking-[-0.02em]">Prastav</span>
          </div>
          <div className="text-[13px] text-muted leading-relaxed max-w-[240px]">{f.tagline}</div>
          <a href="mailto:hello@prastav.app" className="inline-block mt-3 text-[13px] text-[#3A3A31] underline">hello@prastav.app</a>
        </div>
        <div>
          <div className={col}>{f.colProduct}</div>
          <div className="flex flex-col gap-2">
            <Link href="/method" className={link}>{f.method}</Link>
            <Link href="/pricing" className={link}>{f.pricing}</Link>
            <Link href="/samples" className={link}>{f.samples}</Link>
          </div>
        </div>
        <div>
          <div className={col}>{f.colSupport}</div>
          <div className="flex flex-col gap-2">
            <Link href="/help" className={link}>{f.help}</Link>
            <Link href="/contact" className={link}>{f.contact}</Link>
            <Link href="/dashboard" className={link}>{f.signIn}</Link>
          </div>
        </div>
        <div>
          <div className={col}>{f.colPolicies}</div>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className={link}>{f.privacy}</Link>
            <Link href="/terms" className={link}>{f.terms}</Link>
            <Link href="/refunds" className={link}>{f.refunds}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="px-5 sm:px-8 w-full max-w-[1200px] mx-auto py-5 text-[12.5px] text-muted">{f.copyright}</div>
      </div>
    </footer>
  );
}
