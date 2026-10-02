"use client";

import { useState } from "react";
import Link from "next/link";
import { useDict } from "./LocaleProvider";

// Optional access-code field on the final step of each entry flow. The typed
// code travels in the generate payload as `coupon_code`; the server re-validates
// and redeems it authoritatively. This live check is only a UX hint.
export default function AccessCodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useDict();
  const fl = t.flows;
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [msg, setMsg] = useState("");

  const check = async () => {
    const code = value.trim();
    if (!code) { setStatus("idle"); setMsg(""); return; }
    setStatus("checking"); setMsg("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("valid");
        setMsg(data.kind === "free" ? fl.accessCodeFree : data.kind === "percent" ? `${data.value}% off` : `₹${data.value} off`);
      } else {
        setStatus("invalid");
        setMsg(fl.accessCodeInvalid);
      }
    } catch { setStatus("invalid"); setMsg(fl.accessCodeInvalid); }
  };

  return (
    <div className="mt-6">
      <label className="text-[12px] tracking-wide text-muted font-semibold mb-1 block">{fl.accessCodeLabel}</label>
      <div className="flex gap-2 items-stretch max-w-[420px]">
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value.toUpperCase()); setStatus("idle"); setMsg(""); }}
          onBlur={check}
          placeholder={fl.accessCodePlaceholder}
          className="flex-1 border border-line rounded-[4px] px-3 py-2 text-[14px] bg-paper font-mono tracking-wide"
        />
        <button type="button" onClick={check} className="border border-line text-ink text-[14px] font-semibold px-4 rounded-[4px]">{fl.accessCodeCheck}</button>
      </div>
      {status === "checking" && <p className="text-[13px] text-muted mt-2">{fl.accessCodeChecking}</p>}
      {status === "valid" && <p className="text-[13px] mt-2 font-semibold text-ink">✓ {msg}</p>}
      {status === "invalid" && <p className="text-[13px] mt-2 text-muted">{msg}</p>}
      {value.trim() !== "" && (
        <p className="text-[12.5px] text-muted leading-relaxed mt-3 max-w-[480px]">
          {fl.accessCodeConsent}{" "}
          <Link href="/privacy" target="_blank" className="underline font-semibold text-ink">{fl.privacyPolicyLink}</Link>
        </p>
      )}
    </div>
  );
}
