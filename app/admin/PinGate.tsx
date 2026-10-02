"use client";

import { useState } from "react";
import Link from "next/link";

export default function PinGate() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!pin.trim()) { setErr("Enter the admin PIN."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const j = await res.json();
      if (!j.ok) { setBusy(false); setErr(j.error === "wrong_pin" ? "That PIN is not correct." : "Could not verify. Try again."); return; }
      window.location.reload();
    } catch {
      setBusy(false);
      setErr("Could not verify. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
          <span className="text-[11px] tracking-[0.1em] text-muted border border-line rounded px-2 py-0.5 ml-1">ADMIN</span>
        </Link>
        <Link href="/dashboard" className="text-[13px] tracking-wide text-muted">← Dashboard</Link>
      </header>
      <main className="flex-grow flex items-start justify-center px-6 py-20">
        <div className="w-full max-w-[380px]">
          <h1 className="font-extrabold text-[26px] tracking-tight mb-2">Admin PIN</h1>
          <p className="text-[15px] text-muted leading-relaxed mb-6">Enter the admin PIN to open the admin area. You will stay signed in to admin on this device for a while.</p>
          <form onSubmit={submit}>
            <label className="block text-[14px] font-semibold text-[#3A3A32] mb-2">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => { setPin(e.target.value); setErr(""); }}
              className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[18px] tracking-[0.2em] bg-card outline-none focus:border-ink"
            />
            {err && <div className="mt-3 text-[14px] text-[#B42318]">{err}</div>}
            <button type="submit" disabled={busy} className="mt-5 w-full bg-ink text-paper text-[16px] font-semibold h-[52px] rounded-[4px] disabled:opacity-40">{busy ? "Checking…" : "Unlock admin"}</button>
          </form>
        </div>
      </main>
    </div>
  );
}
