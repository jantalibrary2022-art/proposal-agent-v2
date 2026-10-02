"use client";

import { useState } from "react";

type Coupon = {
  id: string; code: string; kind: string; value: number; currency: string;
  max_uses: number | null; per_user_limit: number; used_count: number;
  batch: string | null; note: string | null; active: boolean; expires_at: string | null; created_at: string;
};
type Redemption = { id: string; code: string; user_id: string; proposal_id: string | null; kind: string; created_at: string };

const field = "w-full border border-line rounded-[4px] px-3 py-2 text-[14px] bg-paper";
const labelCls = "text-[12px] tracking-[0.06em] text-muted font-semibold mb-1 block";

export default function CouponConsole({
  initialCoupons,
  initialRedemptions,
}: {
  initialCoupons: Coupon[];
  initialRedemptions: Redemption[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [redemptions] = useState<Redemption[]>(initialRedemptions);
  const [kind, setKind] = useState("free");
  const [value, setValue] = useState("");
  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState("TEST");
  const [perUser, setPerUser] = useState("1");
  const [maxUses, setMaxUses] = useState("1");
  const [batch, setBatch] = useState("");
  const [allowlist, setAllowlist] = useState("");
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [minted, setMinted] = useState<string[]>([]);
  const [err, setErr] = useState("");

  const mint = async () => {
    setBusy(true); setErr(""); setMinted([]);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind, value: value ? Number(value) : 0, count: Number(count) || 1,
          prefix, per_user_limit: perUser, max_uses: maxUses === "" ? null : Number(maxUses),
          batch: batch || null, email_allowlist: allowlist || null,
          expires_at: expires || null, note: note || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setErr(data.error || "Mint failed"); setBusy(false); return; }
      setMinted(data.codes || []);
      // refresh list
      const list = await (await fetch("/api/admin/coupons")).json();
      if (list.ok) setCoupons(list.coupons || []);
    } catch { setErr("Network error"); }
    setBusy(false);
  };

  const copyAll = () => { try { navigator.clipboard.writeText(minted.join("\n")); } catch {} };

  return (
    <div className="space-y-10">
      {/* Mint */}
      <div className="bg-card border border-line rounded-lg p-6">
        <div className="text-[16px] font-bold mb-5">Mint codes</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>TYPE</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={field}>
              <option value="free">Free (100% — 1 proposal)</option>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </div>
          {kind !== "free" && (
            <div>
              <label className={labelCls}>{kind === "percent" ? "PERCENT (0–100)" : "AMOUNT (₹)"}</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} className={field} inputMode="numeric" placeholder={kind === "percent" ? "25" : "1000"} />
            </div>
          )}
          <div><label className={labelCls}>HOW MANY</label><input value={count} onChange={(e) => setCount(e.target.value)} className={field} inputMode="numeric" /></div>
          <div><label className={labelCls}>CODE PREFIX</label><input value={prefix} onChange={(e) => setPrefix(e.target.value)} className={field} placeholder="TEST" /></div>
          <div><label className={labelCls}>USES PER USER</label><input value={perUser} onChange={(e) => setPerUser(e.target.value)} className={field} inputMode="numeric" /></div>
          <div><label className={labelCls}>MAX USES / CODE</label><input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={field} inputMode="numeric" placeholder="blank = ∞" /></div>
          <div><label className={labelCls}>EXPIRES (optional)</label><input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={field} /></div>
          <div><label className={labelCls}>BATCH LABEL</label><input value={batch} onChange={(e) => setBatch(e.target.value)} className={field} placeholder="Oct testers" /></div>
          <div className="col-span-2"><label className={labelCls}>RESTRICT TO EMAILS (optional, comma-separated)</label><input value={allowlist} onChange={(e) => setAllowlist(e.target.value)} className={field} placeholder="anyone if blank" /></div>
          <div className="col-span-2 sm:col-span-3 lg:col-span-2"><label className={labelCls}>NOTE</label><input value={note} onChange={(e) => setNote(e.target.value)} className={field} /></div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button onClick={mint} disabled={busy} className="bg-ink text-paper text-[15px] font-semibold px-6 py-2.5 rounded-[4px] disabled:opacity-40">{busy ? "Minting…" : "Mint codes"}</button>
          {err && <span className="text-[13px] text-red-700">{err}</span>}
        </div>

        {minted.length > 0 && (
          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[13px] font-semibold">{minted.length} code{minted.length > 1 ? "s" : ""} minted</div>
              <button onClick={copyAll} className="text-[13px] text-muted underline">Copy all</button>
            </div>
            <pre className="bg-paper border border-line rounded-[4px] p-4 text-[13px] leading-relaxed overflow-auto max-h-[240px] font-mono">{minted.join("\n")}</pre>
          </div>
        )}
      </div>

      {/* Existing codes */}
      <div>
        <div className="text-[16px] font-bold mb-3">Codes ({coupons.length})</div>
        {coupons.length === 0 ? (
          <div className="text-[14px] text-muted">No codes yet.</div>
        ) : (
          <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
            {coupons.map((c) => {
              const spent = c.max_uses != null && c.used_count >= c.max_uses;
              const expired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
              return (
                <div key={c.id} className="px-5 py-3 flex items-center gap-4 text-[13.5px]">
                  <span className="font-mono font-semibold">{c.code}</span>
                  <span className="text-muted">{c.kind === "free" ? "free" : c.kind === "percent" ? `${c.value}% off` : `₹${c.value} off`}</span>
                  <span className="text-muted tabular-nums">used {c.used_count}{c.max_uses != null ? `/${c.max_uses}` : ""}</span>
                  {c.batch && <span className="text-muted">· {c.batch}</span>}
                  <span className="ml-auto text-[11px] tracking-wide font-semibold px-2 py-0.5 rounded border border-line text-muted">
                    {!c.active ? "OFF" : spent ? "SPENT" : expired ? "EXPIRED" : "LIVE"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemptions */}
      <div>
        <div className="text-[16px] font-bold mb-3">Recent redemptions ({redemptions.length})</div>
        {redemptions.length === 0 ? (
          <div className="text-[14px] text-muted">None yet.</div>
        ) : (
          <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
            {redemptions.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-4 text-[13px] text-muted tabular-nums">
                <span className="font-mono text-ink">{r.code}</span>
                <span>user {String(r.user_id).slice(0, 8)}</span>
                <span>proposal {r.proposal_id ? String(r.proposal_id).slice(0, 8) : "—"}</span>
                <span className="ml-auto">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
