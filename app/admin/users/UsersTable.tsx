"use client";

import { useMemo, useState } from "react";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  accountType: "Organisation" | "Individual";
  orgName: string;
  profiles: string[];
  signedUp: string;
  confirmed: boolean;
  lastSignIn: string | null;
  total: number;
  draft: number;
  final: number;
  inProgress: number;
  failed: number;
  paidCount: number;
  paidAmount: number;
  codesUsed: number;
  discount: number;
  lastProposal: string | null;
};

type SortKey = "signedUp" | "name" | "total" | "draft" | "final" | "paidAmount" | "discount" | "lastProposal";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const inr = (n: number) => (n ? "₹" + n.toLocaleString("en-IN") : "—");

export default function UsersTable({ rows }: { rows: UserRow[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "Organisation" | "Individual">("all");
  const [sort, setSort] = useState<SortKey>("signedUp");
  const [desc, setDesc] = useState(true);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (type !== "all" && r.accountType !== type) return false;
      if (!needle) return true;
      return [r.name, r.email, r.orgName, ...r.profiles].join(" ").toLowerCase().includes(needle);
    });
    const val = (r: UserRow): string | number => {
      if (sort === "name") return (r.orgName || r.name || r.email).toLowerCase();
      if (sort === "signedUp" || sort === "lastProposal") return r[sort] || "";
      return r[sort];
    };
    return list.sort((a, b) => {
      const x = val(a), y = val(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return desc ? -c : c;
    });
  }, [rows, q, type, sort, desc]);

  function sortBy(k: SortKey) {
    if (k === sort) setDesc(!desc);
    else { setSort(k); setDesc(k !== "name"); }
  }

  function exportCsv() {
    const head = ["Name", "Email", "Account type", "Organisation (signup)", "Profiles", "Signed up", "Email confirmed", "Last sign-in", "Proposals total", "Draft", "Final", "In progress", "Failed", "Paid proposals", "Amount paid (INR)", "Discount received (INR)", "Codes redeemed", "Last proposal"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = view.map((r) => [r.name, r.email, r.accountType, r.orgName, r.profiles.join("; "), fmtDate(r.signedUp), r.confirmed ? "Yes" : "No", fmtDate(r.lastSignIn), r.total, r.draft, r.final, r.inProgress, r.failed, r.paidCount, r.paidAmount, r.discount, r.codesUsed, fmtDate(r.lastProposal)].map(esc).join(","));
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prastav-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const th = "px-3 py-2.5 text-left text-[11px] tracking-[0.08em] text-muted font-semibold whitespace-nowrap";
  const thBtn = (k: SortKey, label: string, right = false) => (
    <th className={th + (right ? " text-right" : "")}>
      <button type="button" onClick={() => sortBy(k)} className={"uppercase " + (sort === k ? "text-ink" : "")}>
        {label}{sort === k ? (desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );
  const td = "px-3 py-3 align-top text-[13.5px]";
  const num = td + " text-right tabular-nums";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or organisation"
          className="h-10 w-full sm:w-[320px] border border-[#C9C7BF] rounded px-3 text-[14px] bg-white outline-none focus:border-ink"
        />
        <div className="flex border border-line rounded overflow-hidden text-[13px]">
          {(["all", "Organisation", "Individual"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setType(k)} className={"px-3 h-10 " + (type === k ? "bg-ink text-paper" : "bg-card text-muted")}>
              {k === "all" ? "All" : k + "s"}
            </button>
          ))}
        </div>
        <span className="text-[13px] text-muted">{view.length} shown</span>
        <button type="button" onClick={exportCsv} className="ml-auto h-10 px-4 border border-ink rounded text-[13px] font-semibold">Export CSV</button>
      </div>

      <div className="bg-card border border-line rounded-lg overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead className="border-b border-line bg-faint">
            <tr>
              {thBtn("name", "User / organisation")}
              {thBtn("signedUp", "Signed up")}
              {thBtn("total", "Total", true)}
              {thBtn("draft", "Draft", true)}
              {thBtn("final", "Final", true)}
              <th className={th + " text-right"}>IN PROG / FAILED</th>
              {thBtn("paidAmount", "Paid", true)}
              {thBtn("discount", "Discount", true)}
              <th className={th + " text-right"}>CODES</th>
              {thBtn("lastProposal", "Last proposal")}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEEE7]">
            {view.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-6 text-[14px] text-muted">No users match.</td></tr>
            )}
            {view.map((r) => {
              const extraProfiles = r.profiles.filter((p) => p && p !== r.orgName);
              return (
                <tr key={r.id}>
                  <td className={td + " max-w-[320px]"}>
                    <div className="font-semibold">{r.orgName || r.name || "—"}</div>
                    {r.orgName && r.name && <div className="text-[12.5px] text-[#3A3A31]">{r.name}</div>}
                    <div className="text-[12.5px] text-muted break-all">{r.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="text-[10.5px] tracking-wide border border-line rounded px-1.5 py-px text-muted">{r.accountType.toUpperCase()}</span>
                      {!r.confirmed && <span className="text-[10.5px] tracking-wide border border-[#C4C2BB] rounded px-1.5 py-px text-muted">UNCONFIRMED</span>}
                    </div>
                    {extraProfiles.length > 0 && (
                      <div className="text-[12px] text-muted mt-1">Profiles: {extraProfiles.join(", ")}</div>
                    )}
                  </td>
                  <td className={td + " whitespace-nowrap tabular-nums"}>
                    {fmtDate(r.signedUp)}
                    <div className="text-[12px] text-muted">last in {fmtDate(r.lastSignIn)}</div>
                  </td>
                  <td className={num + " font-semibold"}>{r.total}</td>
                  <td className={num}>{r.draft}</td>
                  <td className={num}>{r.final}</td>
                  <td className={num + " text-muted"}>{r.inProgress} / {r.failed}</td>
                  <td className={num}>{inr(r.paidAmount)}{r.paidCount > 0 && <div className="text-[12px] text-muted">{r.paidCount} paid</div>}</td>
                  <td className={num}>{inr(r.discount)}</td>
                  <td className={num}>{r.codesUsed || "—"}</td>
                  <td className={td + " whitespace-nowrap tabular-nums"}>{fmtDate(r.lastProposal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
