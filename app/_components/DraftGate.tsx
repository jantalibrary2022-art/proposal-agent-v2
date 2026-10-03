"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict } from "./LocaleProvider";
import { payUpfront } from "../../lib/razorpay-client";
import { createClient } from "../../lib/supabase/client";

export type Gate = {
  enforced: boolean;
  mode: "free" | "blocked" | "prepay";
  unpaidOpen: number;
  max: number;
  hasCredit: boolean;
  pricePaise: number;
  razorpayReady: boolean;
};

const rupees = (paise: number) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");

// Unpaid-draft rules on the new-proposal pages: shows why payment is needed
// upfront and runs that payment before generation starts.
export function useDraftGate() {
  const { t } = useDict();
  const g = t.drafts;
  const [gate, setGate] = useState<Gate | null>(null);
  const [email, setEmail] = useState("");

  const refresh = async () => {
    try {
      const r = await fetch("/api/proposals/gate");
      const j = await r.json();
      if (j.ok) setGate(j);
    } catch {}
  };
  useEffect(() => {
    refresh();
    try { createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email || "")); } catch {}
  }, []);

  const needsPay = (code: string) => !!gate && gate.enforced && gate.mode !== "free" && !gate.hasCredit && !code.trim();

  // Call before starting generation. Returns true when generation may start.
  const prepare = async (code: string): Promise<boolean> => {
    if (!needsPay(code)) return true;
    const r = await payUpfront({ email, description: g.payDescription });
    if (r === "paid") { await refresh(); return true; }
    if (r === "failed") alert(g.payFailed);
    if (r === "unconfirmed") { alert(g.payUnconfirmed); await refresh(); }
    return false;
  };

  // Call with the generate API's error code. Returns true if it was a draft-rule refusal.
  const handleRefusal = (error: string): boolean => {
    if (error === "draft_limit" || error === "prepay_required" || error === "payment_required") {
      refresh();
      alert(error === "draft_limit" ? g.limitBody.replace("{max}", String(gate?.max ?? 2)) : g.prepayBody);
      return true;
    }
    return false;
  };

  const buttonLabel = (code: string, normal: string) => (needsPay(code) && gate ? g.payAndGenerate.replace("{price}", rupees(gate.pricePaise)) : normal);

  return { gate, needsPay, prepare, handleRefusal, buttonLabel };
}

export function DraftGateNotice({ gate, code = "", compact = false }: { gate: Gate | null; code?: string; compact?: boolean }) {
  const { t } = useDict();
  const g = t.drafts;
  if (!gate || !gate.enforced) return null;
  if (gate.hasCredit) {
    return <div className="mb-6 border border-line bg-card rounded-[5px] px-4 py-3 text-[14px] leading-relaxed">{g.creditNote}</div>;
  }
  if (gate.mode === "free") return null;
  const blocked = gate.mode === "blocked";
  return (
    <div className="mb-6 border border-[#E3C9A8] bg-[#FBF3E8] rounded-[5px] px-4 py-3 text-[14px] leading-relaxed text-[#5A3A12]" role="status">
      <div className="font-semibold mb-1">{blocked ? g.limitTitle.replace("{n}", String(gate.unpaidOpen)) : g.prepayTitle}</div>
      <div>{blocked ? g.limitBody.replace("{max}", String(gate.max)) : g.prepayBody}</div>
      {!compact && (
        <div className="mt-2">
          {blocked && <><Link href="/dashboard" className="font-semibold underline">{g.goDashboard}</Link><span> · </span></>}
          <span>{code.trim() ? g.codeApplies : g.codeHint}</span>
        </div>
      )}
    </div>
  );
}
