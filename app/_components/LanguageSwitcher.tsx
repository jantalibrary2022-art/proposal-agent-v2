"use client";

import { useEffect, useRef, useState } from "react";

type Opt = { code: string; native: string; short: string };

const OPTIONS: Opt[] = [
  { code: "en", native: "English", short: "EN" },
  { code: "hi", native: "हिन्दी", short: "हि" },
];

function setLocale(code: string) {
  try {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  } catch {}
  window.location.reload();
}

export default function LanguageSwitcher({
  current,
  tone = "light",
}: {
  current: string;
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = OPTIONS.find((o) => o.code === current) || OPTIONS[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // A setting, not a page: outlined pill with a globe, language in its own script.
  const trigger = tone === "dark" ? "text-white/90 border-white/30" : "text-ink border-[#C9C7BF] bg-card";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-full border text-[13px] font-medium ${trigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language / भाषा"
        title="Language / भाषा"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19" /><path d="M12 2.5c2.6 2.6 4 6 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-6-4-9.5s1.4-6.9 4-9.5Z" /></svg>
        <span className="hidden sm:inline">{cur.native}</span>
        <span className="sm:hidden">{cur.short}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[140px] bg-card border border-line rounded-md shadow-[0_12px_30px_rgba(0,0,0,0.14)] overflow-hidden" role="listbox">
          {OPTIONS.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => setLocale(o.code)}
              className={`w-full text-left px-4 py-2.5 text-[14px] flex items-center justify-between gap-3 hover:bg-faint ${o.code === current ? "font-semibold" : "text-[#3A3A31]"}`}
              role="option"
              aria-selected={o.code === current}
            >
              <span>{o.native}</span>
              {o.code === current && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
