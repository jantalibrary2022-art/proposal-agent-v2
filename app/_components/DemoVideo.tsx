"use client";

import { useEffect, useRef, useState } from "react";
import { useDict } from "./LocaleProvider";

const SRC = "/demo/prastav-demo.mp4";
const POSTER = "/demo/prastav-demo-poster.jpg";

const PlayIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
);

// "Watch the 30-second demo" button that opens the video in a pop-up player.
export function DemoButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { t } = useDict();
  const d = t.demo;
  const [open, setOpen] = useState(false);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const cls = tone === "dark"
    ? "text-paper border-white/30 hover:border-white/60"
    : "text-ink border-ink/25 hover:border-ink bg-card";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-2 border rounded-full pl-2 pr-4 py-1.5 text-[13.5px] font-semibold ${cls}`}>
        <span className="w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center pl-[2px]"><PlayIcon size={11} /></span>
        {d.watch}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={d.title} onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-[1000px]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)} aria-label={d.close} className="absolute -top-11 right-0 text-white/85 text-[14px] font-semibold flex items-center gap-1.5">
              {d.close}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
            <video ref={vid} src={SRC} poster={POSTER} controls autoPlay playsInline className="w-full rounded-lg shadow-2xl bg-black aspect-video" />
          </div>
        </div>
      )}
    </>
  );
}

// Inline player with poster, for content pages.
export function DemoInline({ className = "" }: { className?: string }) {
  const { t } = useDict();
  return (
    <figure className={className}>
      <video src={SRC} poster={POSTER} controls playsInline preload="none" className="w-full rounded-lg border border-line bg-black aspect-video" aria-label={t.demo.title} />
      <figcaption className="mt-2 text-[13px] text-muted">{t.demo.caption}</figcaption>
    </figure>
  );
}
