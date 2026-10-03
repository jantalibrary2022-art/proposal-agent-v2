"use client";

import { useState } from "react";

export default function TestEmailButton() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    setBusy(true); setOut(null);
    try {
      const r = await fetch("/api/admin/test-email", { method: "POST" });
      const j = await r.json();
      const s = j.settings || {};
      const cfg = s.configured ? `via ${s.host}:${s.port} as ${s.from || s.user}` : "SMTP not configured";
      setOut(j.ok
        ? { ok: true, text: `Sent to ${j.to} (${cfg}). Check that inbox, including spam.` }
        : { ok: false, text: `Failed (${cfg}): ${j.error || "unknown error"}` });
    } catch {
      setOut({ ok: false, text: "Could not reach the server." });
    }
    setBusy(false);
  };

  return (
    <div className="bg-card border border-line rounded-lg p-5 mb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[15px] font-bold">Transactional email</div>
          <div className="text-[13px] text-muted">Sends a test email to your admin address and shows the result.</div>
        </div>
        <button type="button" onClick={send} disabled={busy} className="h-10 px-4 bg-ink text-paper rounded text-[13px] font-semibold disabled:opacity-50">
          {busy ? "Sending…" : "Send test email"}
        </button>
      </div>
      {out && <div className={"mt-3 text-[13.5px] leading-snug break-words " + (out.ok ? "text-[#1E6B3A]" : "text-[#8A3B12]")}>{out.text}</div>}
    </div>
  );
}
