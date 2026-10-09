"use client";

import { useState } from "react";
import { useDict } from "./LocaleProvider";

// Discount / access code entry on the payment step. Applies the code to this
// proposal (server redeems it), then asks the page to refresh so the new price
// shows, or the proposal unlocks if the code was free.
export default function CheckoutCode({
  proposalId,
  onApplied,
}: {
  proposalId: string;
  onApplied: () => void | Promise<void>;
}) {
  const { t } = useDict();
  const p = t.proposal;
  const [open, setOpen] = useState(false);
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

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[13.5px] font-semibold text-ink underline mb-4">
        {p.checkoutHaveCode}
      </button>
    );
  }

  return (
    <div className="mb-5 max-w-[420px]">
      <label className="text-[12px] tracking-wide text-muted font-semibold mb-1 block">{p.checkoutHaveCode}</label>
      <div className="flex gap-2 items-stretch">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); setOk(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
          placeholder={p.checkoutCodePh}
          className="flex-1 border border-line rounded-[4px] px-3 py-2 text-[14px] bg-paper font-mono tracking-wide outline-none focus:border-ink"
        />
        <button type="button" onClick={apply} disabled={busy || !code.trim()} className="bg-ink text-paper text-[14px] font-semibold px-4 rounded-[4px] disabled:opacity-40">
          {busy ? p.checkoutApplying : p.checkoutApply}
        </button>
      </div>
      {err && <p className="text-[13px] text-[#8A3B12] mt-2 leading-snug">{err}</p>}
      {ok && <p className="text-[13px] text-[#2E7D4F] font-semibold mt-2 leading-snug">{ok}</p>}
    </div>
  );
}
