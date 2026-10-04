"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OfferControls({ code, active, maxTotal }: { code: string; active: boolean; maxTotal: number | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [places, setPlaces] = useState(String(maxTotal ?? ""));
  const [msg, setMsg] = useState("");
  const save = async (patch: any) => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/admin/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, ...patch }) });
      const j = await r.json();
      if (!j.ok) setMsg("Could not save: " + (j.error || "error"));
      else { setMsg("Saved."); router.refresh(); }
    } catch { setMsg("Could not save."); }
    setBusy(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={busy} onClick={() => { if (window.confirm(active ? "Switch the offer OFF? It disappears from the homepage, pricing, dashboard and pay step at once." : "Switch the offer ON? It appears on the homepage, pricing, dashboard and pay step at once.")) save({ active: !active }); }}
        className={"h-10 px-5 rounded text-[13.5px] font-semibold disabled:opacity-50 " + (active ? "border border-[#B42318] text-[#B42318]" : "bg-ink text-paper")}>
        {active ? "Switch off" : "Switch on"}
      </button>
      <div className="flex items-center gap-2">
        <label className="text-[13px] text-muted">Places</label>
        <input value={places} onChange={(e) => setPlaces(e.target.value.replace(/[^0-9]/g, ""))} className="h-10 w-20 border border-[#C9C7BF] rounded px-2 text-[14px] bg-white" />
        <button type="button" disabled={busy || !places} onClick={() => save({ max_total: Number(places) })} className="h-10 px-4 border border-ink rounded text-[13px] font-semibold disabled:opacity-50">Update</button>
      </div>
      {msg && <span className="text-[13px] text-muted">{msg}</span>}
    </div>
  );
}
