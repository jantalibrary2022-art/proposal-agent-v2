"use client";

import { useState } from "react";
import { useDict } from "./LocaleProvider";

// Discount / access code entry on the payment step. Shown as a distinct box so
// it is easy to find. Applies the code to this proposal (server redeems it),
// then asks the page to refresh so the new price shows, or the proposal unlocks
// if the code was free.
export default function CheckoutCode({
  proposalId,
  onApplied,
}: {
  proposalId: string;
  onApplied: () => void | Promise<void>;
}) {
  const { t } = useDict();
  const p = t.proposal;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const apply = async () => {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true); setErr(""); setOk("");
    try {
      const res = await fetch("/api/proposals/" + proposalId + "/apply-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (!data.ok) { setErr(p.checkoutCodeInvalid); setBusy(false); return; }
      setOk(data.free ? p.checkoutAppliedFree : p.checkoutApplied);
      await onApplied();
    } catch { setErr(p.checkoutCodeInvalid); }
    setBusy(false);
  };

  return (
    <div className="mb-6 max-w-[480px] border-[1.5px] border-line rounded-[10px] bg-faint px-4 py-4">
      <div className="flex items-center gap-2 mb-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink">
          <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        <span className="text-[14px] font-bold text-ink tracking-[-0.01em]">{p.checkoutHaveCode}</span>
      </div>
      <div className="flex gap-2 items-stretch">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); setOk(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
          placeholder={p.checkoutCodePh}
          className="flex-1 min-w-0 border border-[#C9C7BF] rounded-[5px] px-3 py-2.5 text-[14.5px] bg-card font-mono tracking-wide outline-none focus:border-ink"
        />
        <button type="button" onClick={apply} disabled={busy || !code.trim()} className="shrink-0 bg-ink text-paper text-[14.5px] font-semibold px-5 rounded-[5px] disabled:opacity-40">
          {busy ? p.checkoutApplying : p.checkoutApply}
        </button>
      </div>
      {err && <p className="text-[13px] text-[#8A3B12] mt-2.5 leading-snug" role="status">{err}</p>}
      {ok && <p className="text-[13px] text-[#2E7D4F] font-semibold mt-2.5 leading-snug" role="status">{ok}</p>}
    </div>
  );
}
