"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDict } from "../_components/LocaleProvider";

type Row = { id: string; title: string | null; status: string; mode: string; updated_at: string; meta: any };

export default function ProposalRow({
  p,
  last,
  modeLabel,
  statusPill,
  relUpdated,
}: {
  p: Row;
  last: boolean;
  modeLabel: string;
  statusPill: React.ReactNode;
  relUpdated: string;
}) {
  const { t } = useDict();
  const td = t.dashboard;
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const title = (p.meta && p.meta.title) || p.title || td.untitled;

  const del = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(td.deleteConfirm.replace("{title}", title))) return;
    setBusy(true);
    try {
      const res = await fetch("/api/proposals/" + p.id + "/delete", { method: "POST" });
      const data = await res.json();
      if (data.ok) { router.refresh(); return; }
      alert(td.deleteFailed);
      setBusy(false);
    } catch { alert(td.deleteFailed); setBusy(false); }
  };

  return (
    <div className={`flex items-center gap-3 px-5 py-4 ${last ? "" : "border-b border-[#EFEEE7]"} ${busy ? "opacity-40" : ""}`}>
      <Link href={"/proposals/" + p.id} className="flex items-center gap-3 flex-grow min-w-0">
        <div className="flex-grow min-w-0">
          <div className="text-[15.5px] font-semibold truncate">{title}</div>
          <div className="text-[13px] text-muted mt-0.5 truncate">{td.updated} {relUpdated}{p.meta && p.meta.geography ? " · " + p.meta.geography : ""}</div>
        </div>
        <span className="hidden sm:inline shrink-0 text-[10.5px] tracking-wide font-semibold text-muted border border-[#C4C2BB] px-2.5 py-1 rounded-full">{modeLabel}</span>
        {statusPill}
        <span className="shrink-0 text-[12px] tracking-wide font-semibold">{td.open}</span>
      </Link>
      <button
        type="button"
        onClick={del}
        disabled={busy}
        aria-label={td.deleteLabel}
        title={td.deleteLabel}
        className="shrink-0 text-[12px] tracking-wide font-semibold text-muted hover:text-ink border border-[#C4C2BB] px-2.5 py-1 rounded-full"
      >
        {busy ? td.deleting : td.deleteLabel}
      </button>
    </div>
  );
}
