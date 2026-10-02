"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Sample } from "../_data";

export default function SampleViewer({ meta, html }: { meta: Sample; html: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "c", "u"].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const style = document.createElement("style");
    style.textContent = "@media print { body { display: none !important; } }";
    document.head.appendChild(style);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      style.remove();
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-canvas">
      <header className="h-14 shrink-0 px-4 sm:px-8 flex items-center justify-between gap-3 border-b border-line bg-canvas">
        <Link href="/samples" className="text-[13px] tracking-wide text-muted shrink-0">← All samples</Link>
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:inline text-[10.5px] tracking-[0.08em] font-semibold text-muted border border-[#C4C2BB] px-2 py-0.5 rounded-full shrink-0">{meta.mode.toUpperCase()}</span>
          <span className="text-[13.5px] font-semibold truncate">{meta.title}</span>
        </div>
        <span className="text-[11px] tracking-[0.08em] text-muted shrink-0">VIEW ONLY</span>
      </header>
      <iframe title={meta.title} srcDoc={html} sandbox="allow-scripts" className="flex-grow w-full border-0 bg-[#56565a]" />
    </div>
  );
}
