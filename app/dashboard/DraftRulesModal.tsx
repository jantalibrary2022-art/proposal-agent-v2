"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict } from "../_components/LocaleProvider";
import { createClient } from "../../lib/supabase/client";

// One-time explanation of the unpaid-draft rules, shown on the dashboard after
// login while the rules are active. Acknowledgement is saved on the account
// (user_metadata.draft_rules_ack), so it is not shown again on any device.
export const DRAFT_RULES_VERSION = 1;

export default function DraftRulesModal({ show }: { show: boolean }) {
  const { t } = useDict();
  const m = t.draftRulesModal;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (show) setOpen(true); }, [show]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const close = async () => {
    if (saving) return;
    setSaving(true);
    try { await createClient().auth.updateUser({ data: { draft_rules_ack: DRAFT_RULES_VERSION } }); } catch {}
    setOpen(false);
    setSaving(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-labelledby="draft-rules-title">
      <div className="w-full max-w-[520px] bg-card rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <div className="text-[11.5px] tracking-[0.1em] text-muted mb-2">{m.kicker}</div>
        <h2 id="draft-rules-title" className="text-[21px] font-extrabold tracking-[-0.02em] leading-tight mb-4">{m.title}</h2>
        <ul className="flex flex-col gap-3 mb-5">
          {m.points.map(([head, body]) => (
            <li key={head} className="flex gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-ink shrink-0" aria-hidden />
              <div className="text-[14.5px] leading-relaxed text-[#3A3A31]"><span className="font-semibold text-ink">{head}</span> {body}</div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/pricing" className="text-[13.5px] font-semibold underline">{m.more}</Link>
          <button type="button" onClick={close} disabled={saving} autoFocus className="bg-ink text-paper text-[14.5px] font-semibold px-6 py-2.5 rounded-[4px] disabled:opacity-50">{m.ok}</button>
        </div>
      </div>
    </div>
  );
}
