"use client";

import { useEffect, useRef, useState } from "react";

type Opt = { code: string; native: string };

const OPTIONS: Opt[] = [
  { code: "en", native: "English" },
  { code: "hi", native: "हिन्दी" },
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
  const label = OPTIONS.find((o) => o.code === current)?.native || "English";

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const trigger = tone === "dark" ? "text-white/85" : "text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[13px] ${trigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
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
