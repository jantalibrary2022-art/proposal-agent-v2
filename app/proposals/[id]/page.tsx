"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { useDict } from "../../_components/LocaleProvider";

function parseAmt(s: string) { const n = Number(String(s == null ? "" : s).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }
function fmtIN(n: number) {
  let s = Math.round(n).toString(); const neg = s.startsWith("-"); if (neg) s = s.slice(1);
  const lastThree = s.length > 3 ? s.slice(-3) : s;
  let rest = s.length > 3 ? s.slice(0, s.length - 3) : "";
  if (rest !== "") { rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ","); s = rest + "," + lastThree; }
  else { s = lastThree; }
  return (neg ? "-" : "") + s;
}

function paras(text: string) {
  return (text || "").split(/\n\s*\n/).map((p, i) => (
    <p key={i} className="mb-3 last:mb-0 whitespace-pre-wrap leading-relaxed">{p}</p>
  ));
}

function Dictation({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { locale, t } = useDict();
  const p = t.proposal;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const keepRef = useRef(false);
  const baseRef = useRef("");
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);
  const run = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = locale === "hi" ? "hi-IN" : "en-IN"; rec.interimResults = true; rec.continuous = true;
    let committed = baseRef.current;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) committed += (committed ? " " : "") + tr.trim();
        else interim += tr;
      }
      onChange((committed + (interim ? " " + interim : "")).trim());
    };
    rec.onend = () => { if (keepRef.current) { try { rec.start(); } catch {} } else setListening(false); };
    rec.onerror = (e: any) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { keepRef.current = false; setListening(false); } };
    recRef.current = rec;
    try { rec.start(); } catch {}
  };
  const toggle = () => {
    if (listening) { keepRef.current = false; recRef.current?.stop(); setListening(false); }
    else { baseRef.current = value ? value.trim() : ""; keepRef.current = true; setListening(true); run(); }
  };
  if (!supported) return null;
  return (
    <button type="button" onClick={toggle} className={`shrink-0 flex items-center gap-2 px-3 h-[40px] rounded-[4px] text-[13.5px] font-semibold border-[1.5px] ${listening ? "bg-ink text-paper border-ink" : "bg-card text-ink border-ink"}`}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
      {listening ? p.stop : p.speak}
    </button>
  );
}

function Section({ id, label, single, text, proposalId, onCommit }: { id: string; label: string; single: boolean; text: string; proposalId: string; onCommit: (section: string, newText: string) => Promise<boolean>; }) {
  const { t } = useDict();
  const p = t.proposal;
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [proposed, setProposed] = useState<string | null>(null);

  const shown = proposed != null ? proposed : text;

  const ask = async () => {
    if (!comment.trim() || busy) return;
    setBusy(true); setNote("");
    try {
      const res = await fetch("/api/proposals/" + proposalId + "/revise", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: id, comment, currentText: shown }),
      });
      const data = await res.json();
      if (!data.ok) { setNote(p.couldNotRevise + (data.error || "error")); setBusy(false); return; }
      setNote(data.note || "");
      if (data.changed) setProposed(data.revised);
    } catch { setNote(p.reachError); }
    setBusy(false);
  };

  const accept = async () => {
    if (proposed == null || busy) return;
    setBusy(true);
    const ok = await onCommit(id, proposed);
    setBusy(false);
    if (ok) { setProposed(null); setNote(""); setComment(""); setOpen(false); }
  };

  const discard = () => { setProposed(null); setNote(""); };

  return (
    <div className="bg-card border border-line rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-[12px] tracking-wide font-semibold text-muted">{label.toUpperCase()}</div>
        <button type="button" onClick={() => setOpen(!open)} className="shrink-0 text-[13px] font-semibold text-ink underline">{open ? p.close : p.suggestChange}</button>
      </div>

      <div style={{ userSelect: "none" }} className={single ? "font-bold text-[18px]" : "text-[15px] text-ink"}>
        {single ? (shown || p.empty) : paras(shown)}
      </div>

      {proposed != null && (
        <div className="mt-3 text-[12px] tracking-wide font-semibold text-ink">{p.proposedBanner}</div>
      )}

      {open && (
        <div className="mt-5 border-t border-line pt-4">
          {note && <div className="mb-3 bg-paper border border-line rounded-[5px] px-4 py-3 text-[14px] leading-relaxed" style={{ userSelect: "none" }}>{note}</div>}
          {proposed == null ? (
            <>
              <label className="block text-[13px] font-semibold text-muted mb-2">{p.whatChange}</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder={p.changePh} className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-3 text-[15px] bg-card outline-none focus:border-ink resize-y" />
              <div className="mt-3 flex items-center gap-3">
                <button type="button" onClick={ask} disabled={busy || !comment.trim()} className="bg-ink text-paper text-[14.5px] font-semibold px-5 py-[10px] rounded-[4px] disabled:opacity-40">{busy ? p.working : p.askAgent}</button>
                <Dictation value={comment} onChange={setComment} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={accept} disabled={busy} className="bg-ink text-paper text-[14.5px] font-semibold px-5 py-[10px] rounded-[4px] disabled:opacity-40">{busy ? p.savingChange : p.acceptChange}</button>
              <button type="button" onClick={discard} disabled={busy} className="text-[14.5px] font-semibold text-muted">{p.discard}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetTable({ budget, rates, setRates }: { budget: any; rates: Record<string, string>; setRates: (r: Record<string, string>) => void }) {
  const { t } = useDict();
  const p = t.proposal;
  const cats = (budget && budget.categories) || (budget && budget.lines ? [{ name: "", lines: budget.lines }] : []);
  if (!cats.length) return null;
  const effUnit = (line: any) => { const o = rates[line.item]; return o != null && o !== "" ? o : line.unit_cost; };
  const lineTotal = (line: any) => {
    const uc = parseAmt(effUnit(line)); const qty = parseAmt(line.quantity);
    if (uc > 0 && qty > 0) return uc * qty;
    return parseAmt(line.total);
  };
  let grand = 0;
  cats.forEach((c: any) => (c.lines || []).forEach((l: any) => { grand += lineTotal(l); }));

  return (
    <div className="bg-card border border-line rounded-lg p-6">
      <div className="text-[16px] font-bold mb-1">{p.budget}</div>
      <p className="text-[14px] text-muted leading-relaxed mb-4">{p.budgetIntro}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px] border-collapse" style={{ userSelect: "none" }}>
          <thead>
            <tr className="text-left text-muted border-b border-line">
              <th className="py-2 pr-3 font-semibold">{p.colItem}</th>
              <th className="py-2 px-2 font-semibold">{p.colUnit}</th>
              <th className="py-2 px-2 font-semibold text-right">{p.colRate}</th>
              <th className="py-2 px-2 font-semibold text-right">{p.colQty}</th>
              <th className="py-2 px-2 font-semibold text-right">{p.colTotal}</th>
              <th className="py-2 pl-2 font-semibold w-[140px]">{p.colYourRate}</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c: any, ci: number) => {
              const lines = c.lines || [];
              let sub = 0; lines.forEach((l: any) => { sub += lineTotal(l); });
              return (
                <Fragment key={ci}>
                  {c.name && <tr><td colSpan={6} className="pt-4 pb-1 font-bold text-ink">{String.fromCharCode(65 + ci)}. {c.name}</td></tr>}
                  {lines.map((l: any, li: number) => {
                    const sourced = l.rate_basis === "sourced";
                    const estimate = l.rate_basis === "estimate";
                    const overridden = rates[l.item] != null && rates[l.item] !== "";
                    return (
                      <Fragment key={li}>
                        <tr className="border-b border-[#EFEEE7] align-top">
                          <td className="py-2 pr-3">
                            <div className="text-ink">{l.item}</div>
                            <div className="mt-0.5">
                              <span className={`text-[10.5px] tracking-wide font-semibold px-1.5 py-0.5 rounded ${estimate ? "bg-[#FCE8CC] text-[#8A5A00]" : sourced ? "bg-[#E6EFEA] text-[#0F6E5C]" : "bg-[#E3E2DC] text-[#45453D]"}`}>{estimate ? p.tagEstimate : sourced ? p.tagSourced : p.tagConfirmed}</span>
                              {l.source ? <span className="text-[11.5px] text-muted ml-2">{l.source}</span> : null}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-muted whitespace-nowrap">{l.unit}</td>
                          <td className="py-2 px-2 text-right whitespace-nowrap">{effUnit(l)}</td>
                          <td className="py-2 px-2 text-right whitespace-nowrap">{l.quantity}</td>
                          <td className="py-2 px-2 text-right whitespace-nowrap font-semibold">{fmtIN(lineTotal(l))}</td>
                          <td className="py-2 pl-2">
                            <input value={rates[l.item] || ""} onChange={(e) => setRates({ ...rates, [l.item]: e.target.value })} placeholder={l.unit_cost} style={{ userSelect: "text" }} className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[4px] px-2 h-[36px] text-[13.5px] bg-paper outline-none focus:border-ink" />
                          </td>
                        </tr>
                        {sourced && overridden && (
                          <tr><td colSpan={6} className="pb-2">
                            <div className="text-[12.5px] text-[#8A5A00] bg-[#FCF3E6] border border-[#F0E0C8] rounded px-3 py-2">{p.caution1}{l.source ? " (" + l.source + ")" : ""}{p.caution2}</div>
                          </td></tr>
                        )}
                      </Fragment>
                    );
                  })}
                  <tr className="border-b border-line"><td colSpan={4} className="py-2 text-right font-semibold text-muted">{p.subtotal} {c.name}</td><td className="py-2 px-2 text-right font-semibold">{fmtIN(sub)}</td><td></td></tr>
                </Fragment>
              );
            })}
            <tr><td colSpan={4} className="py-3 text-right font-extrabold">{p.grandTotal}</td><td className="py-3 px-2 text-right font-extrabold">{fmtIN(grand)}</td><td></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DownloadCard({ id, kind, label, note, primary }: { id: string; kind: string; label: string; note: string; primary?: boolean }) {
  const { t } = useDict();
  return (
    <a href={"/api/proposals/" + id + "/file/" + kind} className={`block rounded-lg p-5 border ${primary ? "bg-panel text-paper border-panel" : "bg-card text-ink border-line"}`}>
      <div className="text-[17px] font-bold">{label}</div>
      <div className={`text-[13px] ${primary ? "text-white/60" : "text-muted"}`}>{note}</div>
      <div className={`mt-6 text-[12px] tracking-wide font-semibold ${primary ? "text-paper" : "text-ink"}`}>{t.proposal.download}</div>
    </a>
  );
}

export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useDict();
  const p = t.proposal;
  const SECTIONS: [string, string, boolean][] = [
    [p.secTitle, "title", true],
    [p.secSubtitle, "subtitle", true],
    [p.secProblem, "problem", false],
    [p.secObjective, "objective", false],
    [p.secStrategy, "strategy", false],
    [p.secResults, "results_narrative", false],
    [p.secActivities, "activities", false],
    [p.secSustainability, "sustainability", false],
  ];

  const [id, setId] = useState("");
  const [row, setRow] = useState<any>(null);
  const [missing, setMissing] = useState(false);
  const [email, setEmail] = useState("");
  const [texts, setTexts] = useState<any>(null);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => { params.then((pr) => setId(pr.id)); }, [params]);

  const fetchRow = async (reschedule: boolean) => {
    const supabase = createClient();
    const { data } = await supabase.from("proposals").select("id,status,title,meta,composed,substance,error").eq("id", id).single();
    if (!data) { setMissing(true); return; }
    setRow(data);
    if (reschedule && (data.status === "generating" || data.status === "rendering")) {
      timer.current = setTimeout(() => fetchRow(true), 5000);
    }
  };

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); });
    fetchRow(true);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [id]);

  useEffect(() => {
    if (row && row.status === "draft" && texts === null) {
      const c = row.composed || {};
      setTexts({
        title: c.title || "", subtitle: c.subtitle || "",
        problem: c.problem || "", objective: c.objective || "", strategy: c.strategy || "",
        results_narrative: c.results_narrative || "", activities: c.activities || "", sustainability: c.sustainability || "",
      });
      setRates({});
    }
  }, [row, texts]);

  useEffect(() => {
    if (!(row && row.status === "draft")) return;
    const block = (e: Event) => { e.preventDefault(); };
    const keyBlock = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "c" || k === "x" || k === "s" || k === "p")) e.preventDefault();
    };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("keydown", keyBlock);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("keydown", keyBlock);
    };
  }, [row]);

  const commitSection = async (section: string, newText: string) => {
    try {
      const res = await fetch("/api/proposals/" + id + "/section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, text: newText }),
      });
      const data = await res.json();
      if (!data.ok) { alert(p.couldNotSave + (data.error || "error")); return false; }
      setTexts((tx: any) => ({ ...tx, [section]: newText }));
      return true;
    } catch { alert(p.couldNotSaveChange); return false; }
  };

  const approve = async () => {
    setApproving(true);
    try {
      const res = await fetch("/api/proposals/" + id + "/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });
      const data = await res.json();
      if (!data.ok) { alert(p.couldNotFinalise + (data.error || "error")); setApproving(false); return; }
      await fetchRow(false);
    } catch { alert(p.couldNotFinaliseShort); }
    setApproving(false);
  };

  const status = row?.status;
  const protect = status === "draft";
  const wmSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='210'><text x='10' y='120' transform='rotate(-28 180 105)' fill='rgba(20,20,18,0.07)' font-size='17' font-family='sans-serif' font-weight='bold'>DRAFT &#183; ${email || "preview"} &#183; PRASTAV</text></svg>`
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col" onContextMenu={protect ? (e) => e.preventDefault() : undefined}>
      {protect && <style>{"@media print{body{display:none !important}}"}</style>}
      {protect && <div aria-hidden className="pointer-events-none fixed inset-0 z-50" style={{ backgroundImage: `url("data:image/svg+xml,${wmSvg}")`, backgroundRepeat: "repeat" }} />}

      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line relative z-10 bg-canvas">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">{p.allProposals}</Link>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-12 flex justify-center relative z-10">
        <div className="w-full max-w-[820px]">

          {missing && (
            <div className="bg-card border border-line rounded-lg p-8 text-center">
              <div className="text-[18px] font-bold mb-2">{p.notFound}</div>
              <Link href="/dashboard" className="text-muted underline">{p.backToDashboard}</Link>
            </div>
          )}

          {!missing && (!row || status === "generating") && (
            <div className="bg-card border border-line rounded-lg p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-[22px] h-[22px] rounded-full border-[3px] border-[#E4E3DC] border-t-ink animate-spin" />
                <span className="text-[12px] tracking-wide font-semibold text-muted">{p.buildingKicker}</span>
              </div>
              <h1 className="font-extrabold text-[clamp(24px,4vw,30px)] tracking-tight mb-2">{row?.title || p.buildingTitleFallback}</h1>
              <p className="text-[15px] text-muted leading-relaxed">{p.buildingBody}</p>
            </div>
          )}

          {!missing && status === "rendering" && (
            <div className="bg-card border border-line rounded-lg p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-[22px] h-[22px] rounded-full border-[3px] border-[#E4E3DC] border-t-ink animate-spin" />
                <span className="text-[12px] tracking-wide font-semibold text-muted">{p.finalisingKicker}</span>
              </div>
              <h1 className="font-extrabold text-[clamp(24px,4vw,30px)] tracking-tight mb-2">{p.finalisingTitle}</h1>
              <p className="text-[15px] text-muted leading-relaxed">{p.finalisingBody}</p>
            </div>
          )}

          {!missing && status === "error" && (
            <div className="bg-card border-l-[3px] border-ink rounded-[6px] p-8">
              <h1 className="font-extrabold text-[24px] tracking-tight mb-2">{p.errorTitle}</h1>
              <p className="text-[15px] text-muted leading-relaxed mb-4">{p.errorBody1}<a href="mailto:hello@prastav.app?subject=Help%20with%20my%20Prastav%20proposal" className="font-semibold text-ink underline">hello@prastav.app</a>{p.errorBody2}</p>
              {row?.error && <p className="text-[12.5px] text-muted mb-6 break-words">{p.technical}{row.error}</p>}
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/dashboard" className="inline-block bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">{p.backToDashboard}</Link>
                <a href="mailto:hello@prastav.app?subject=Help%20with%20my%20Prastav%20proposal" className="inline-block border border-ink text-ink text-[15px] font-semibold px-6 py-3 rounded-[4px]">{p.getHelp}</a>
              </div>
            </div>
          )}

          {!missing && status === "draft" && texts && (
            <>
              <div className="mb-6">
                <span className="text-[12px] tracking-wide font-semibold text-muted">{p.reviewKicker}</span>
                <h1 className="font-extrabold text-[clamp(24px,4vw,30px)] tracking-tight mt-1 mb-1">{p.reviewTitle}</h1>
                <p className="text-[15px] text-muted leading-relaxed">{p.reviewBody}</p>
              </div>

              <div className="flex flex-col gap-4">
                {SECTIONS.map(([label, key, single]) => (
                  <Section key={key} id={key} label={label} single={single as boolean} text={texts[key] || ""} proposalId={id} onCommit={commitSection} />
                ))}

                {row.substance && row.substance.budget_table && (
                  <BudgetTable budget={row.substance.budget_table} rates={rates} setRates={setRates} />
                )}
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button type="button" onClick={approve} disabled={approving} className="bg-ink text-paper text-[16px] font-semibold px-8 py-[15px] rounded-[4px] disabled:opacity-40">{approving ? p.finalising : p.finalise}</button>
                <Link href="/dashboard" className="text-muted text-[15px] font-semibold">{p.saveExit}</Link>
              </div>
            </>
          )}

          {!missing && status === "ready" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-[22px] h-[22px] rounded-full bg-ink text-paper flex items-center justify-center text-[13px]">&#10003;</span>
                <span className="text-[12px] tracking-wide font-semibold">{p.readyKicker}</span>
              </div>
              <h1 className="font-extrabold text-[clamp(24px,4vw,30px)] tracking-tight leading-tight mb-1">{row?.meta?.title || row?.title}</h1>
              <div className="text-[15px] text-muted mb-7">{[row?.meta?.geography, row?.meta?.duration, row?.meta?.budget].filter(Boolean).join(" · ")}</div>
              <div className="grid sm:grid-cols-3 gap-4 mb-7">
                <DownloadCard id={id} kind="pdf" label={p.dlPdf} note={p.dlPdfNote} primary />
                <DownloadCard id={id} kind="docx" label={p.dlWord} note={p.dlWordNote} />
                <DownloadCard id={id} kind="xlsx" label={p.dlExcel} note={p.dlExcelNote} />
              </div>
              <div className="bg-card border border-line rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="flex-grow">
                  <div className="text-[15px] font-semibold">{p.howWas}</div>
                  <div className="text-[13.5px] text-muted">{p.howWasSub}</div>
                </div>
                <Link href={"/feedback?proposal=" + id} className="shrink-0 bg-ink text-paper text-[14px] font-semibold px-5 py-2.5 rounded-[4px] text-center">{p.shareFeedback}</Link>
              </div>
              <Link href="/dashboard" className="text-[15px] font-semibold text-muted">{p.backToDashboard}</Link>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
