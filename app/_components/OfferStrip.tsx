"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict } from "./LocaleProvider";

// Quiet, static announcement strip for the founding-member offer. Dismissible
// (remembered on this browser); not rendered at all when the offer is off or full.
export default function OfferStrip({ code, kind = "percent", value, remaining, total }: { code: string; kind?: "percent" | "fixed"; value: number; remaining: number | null; total: number | null }) {
  const { t } = useDict();
  const o = t.offer;
  const key = "prastav_offer_strip_" + code;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(key) === "1") setHidden(true); } catch {} }, [key]);
  if (hidden) return null;
  const close = () => { setHidden(true); try { localStorage.setItem(key, "1"); } catch {} };
  if (kind !== "percent") return null; // the strip wording covers percentage offers only
  const what = value === 50 ? o.stripHalf : o.stripPercent.replace("{p}", String(value));
  return (
    <div className="bg-panel text-paper">
      <div className="relative max-w-[1200px] mx-auto px-10 sm:px-12 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[13px] sm:text-[13.5px]">
        <span className="text-[10.5px] tracking-[0.16em] font-semibold text-white/55">{o.kicker}</span>
        <span>{what.replace("{total}", String(total ?? ""))}</span>
        {remaining !== null && <><span className="text-white/30" aria-hidden>·</span><span>{o.placesLeft.replace("{n}", String(remaining))}</span></>}
        <Link href="/pricing" className="font-semibold underline underline-offset-[3px]">{o.seePricing}</Link>
        <button type="button" onClick={close} aria-label={o.close} className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-[18px] leading-none">×</button>
      </div>
    </div>
  );
}
