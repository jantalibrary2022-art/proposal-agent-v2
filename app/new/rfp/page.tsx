"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { useDict } from "../../_components/LocaleProvider";
import VoiceInput from "../../_components/VoiceInput";
import OutputLanguagePicker, { defaultOutputLanguage, type OutputLanguage } from "../../_components/OutputLanguagePicker";
import AccessCodeInput from "../../_components/AccessCodeInput";
import { useDraftGate, DraftGateNotice } from "../../_components/DraftGate";

export default function RfpPage() {
  const router = useRouter();
  const draftGate = useDraftGate();
  const { locale, t } = useDict();
  const [outLang, setOutLang] = useState<OutputLanguage>(defaultOutputLanguage(locale));
  const [couponCode, setCouponCode] = useState("");
  const rf = t.rfp;
  const fl = t.flows;
  const steps = rf.steps;
  const [step, setStep] = useState(0);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [orgProfileId, setOrgProfileId] = useState<string>("");
  const [noProfile, setNoProfile] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickAbout, setQuickAbout] = useState("");

  const [starting, setStarting] = useState(false);
  const [answers, setAnswers] = useState({
    rfp_text: "", idea: "", location: "", beneficiaries: "", duration: "", budget: "",
  });
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));

  const [extracting, setExtracting] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Optional separate "proposal format / guidelines" document. When present, it is
  // the authoritative source for the prescribed structure the proposal must follow.
  const [formatText, setFormatText] = useState("");
  const [formatExtracting, setFormatExtracting] = useState(false);
  const [formatName, setFormatName] = useState("");
  const [formatErr, setFormatErr] = useState("");
  const formatRef = useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState("");
  const analyzedTextRef = useRef("");
  const analyzedFormatRef = useRef("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("org_profiles").select("id,name,type,is_default").eq("user_id", data.user.id).order("is_default", { ascending: false }).order("created_at", { ascending: true }).then(({ data: rows }) => {
        const list = rows || [];
        setProfiles(list);
        const def = list.find((p: any) => p.is_default) || list[0];
        if (def) setOrgProfileId(def.id); else setNoProfile(true);
        setProfilesLoaded(true);
      });
    });
  }, []);

  const onPickRfpFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploadErr(""); setUploadName(f.name); setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/rfp/extract-text", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.text) { set("rfp_text", data.text); }
      else { setUploadName(""); setUploadErr(data.error === "unsupported_type" ? rf.errUpload : rf.errReadPaste); }
    } catch { setUploadName(""); setUploadErr(rf.errReadPaste); }
    setExtracting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFormatFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFormatErr(""); setFormatName(f.name); setFormatExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/rfp/extract-text", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.text) { setFormatText(data.text); }
      else { setFormatName(""); setFormatErr(data.error === "unsupported_type" ? rf.errUpload : rf.errReadPaste); }
    } catch { setFormatName(""); setFormatErr(rf.errReadPaste); }
    setFormatExtracting(false);
    if (formatRef.current) formatRef.current.value = "";
  };

  const profilePayload = () => noProfile
    ? { quick_profile: { name: quickName.trim(), about: quickAbout.trim() } }
    : { org_profile_id: orgProfileId };

  const prefillFromAnalysis = (a: any) => {
    const g = a.geography || {};
    const geoStated = g.stated || g.constraint || "";
    const tg = a.target_group || {};
    const tgStated = tg.stated || "";
    const dur = a.duration || {};
    const durText = dur.notes || [dur.min, dur.max].filter(Boolean).join(" to ") || "";
    const bud = a.budget || {};
    const budText = bud.notes || [bud.min, bud.max].filter(Boolean).join(" to ") || bud.max || "";
    setAnswers((s) => ({
      ...s,
      location: s.location || geoStated,
      beneficiaries: s.beneficiaries || tgStated,
      duration: s.duration || durText,
      budget: s.budget || budText,
    }));
  };

  const runAnalyze = async () => {
    setAnalyzing(true); setAnalyzeErr("");
    try {
      const res = await fetch("/api/rfp/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rfp_text: answers.rfp_text, format_text: formatText, ...profilePayload() }) });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setAnalysis(data.analysis);
        analyzedTextRef.current = answers.rfp_text;
        analyzedFormatRef.current = formatText;
        prefillFromAnalysis(data.analysis);
        setAnalyzing(false);
        setStep(2);
        return;
      }
      setAnalyzeErr(data.error === "no_profile" ? rf.errPickProfile : data.error === "missing_rfp" ? rf.errMissingRfp : rf.errAnalyze);
    } catch { setAnalyzeErr(rf.errAnalyzeRetry); }
    setAnalyzing(false);
  };

  const generate = async () => {
    setStarting(true);
    if (!(await draftGate.prepare(couponCode))) { setStarting(false); return; }
    const payload: any = { ...answers, format_text: formatText, output_language: outLang, coupon_code: couponCode, rfp_analysis: analysis, ...profilePayload() };
    try {
      const res = await fetch("/api/proposals/generate-rfp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: payload }) });
      const data = await res.json();
      if (data.ok && data.id) { router.push("/proposals/" + data.id); return; }
      if (draftGate.handleRefusal(data.error)) { setStarting(false); return; }
      alert(rf.couldNotStart + (data.error || "unknown error"));
    } catch (e) { alert(rf.couldNotStartShort); }
    setStarting(false);
  };


  const canContinue = () => {
    if (step === 0) return noProfile ? quickName.trim().length > 0 : !!orgProfileId;
    if (step === 1) return answers.rfp_text.trim().length > 40 && !analyzing;
    if (step === 2) return !!analysis;
    if (step === 3) return answers.idea.trim().length > 0;
    if (step === 4) return Boolean(answers.location.trim() && answers.beneficiaries.trim());
    if (step === 5) return answers.duration.trim().length > 0;
    return true;
  };
  const goNext = async () => {
    if (step === 1) {
      if (analysis && analyzedTextRef.current === answers.rfp_text && analyzedFormatRef.current === formatText) { setStep(2); return; }
      await runAnalyze(); return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };
  const goBack = () => { if (step === 0) router.push("/dashboard"); else setStep(step - 1); };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const inputLocked = "w-full box-border border-[1.5px] border-[#DEDDD6] rounded-[5px] px-4 h-[52px] text-[16px] bg-[#F2F1EC] text-[#55554D] outline-none";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";
  const selectedProfile = profiles.find((p) => p.id === orgProfileId);
  const orgReview = noProfile ? (quickName.trim() || rf.withoutProfile) : (selectedProfile ? selectedProfile.name : fl.dash);

  const pickProfile = (id: string) => { setNoProfile(false); setOrgProfileId(id); };
  const pickNone = () => { setNoProfile(true); setOrgProfileId(""); };

  const rfpChars = answers.rfp_text.trim().length;

  const g = (analysis && analysis.geography) || {};
  const geoConstraint = g.stated || g.constraint || "";
  const geoLocked = !!analysis && g.left_to_applicant === false && !!geoConstraint;
  const tgA = (analysis && analysis.target_group) || {};
  const tgStated = tgA.stated || "";
  const tgLocked = !!analysis && tgA.left_to_applicant === false && !!tgStated;
  const elig = (analysis && analysis.eligibility_check) || [];
  const notMet = elig.filter((e: any) => e.status === "not_met").length;

  const budgetLine = () => {
    const b = (analysis && analysis.budget) || {};
    const t = b.notes || [b.min, b.max].filter(Boolean).join(" to ") || b.max || "";
    return t ? (b.currency ? b.currency + " " + t : t) : "";
  };
  const durationLine = () => {
    const d = (analysis && analysis.duration) || {};
    return d.notes || [d.min, d.max].filter(Boolean).join(" to ") || "";
  };

  const statusChip = (s: string) => {
    const map: any = {
      met: { bg: "#E2EDE3", fg: "#2F5E3A", t: rf.chipMet },
      not_met: { bg: "#F4E0DA", fg: "#9A3B1E", t: rf.chipNotMet },
      unclear: { bg: "#F0EAD8", fg: "#7A6A2E", t: rf.chipUnclear },
      not_applicable: { bg: "#E8E7E1", fg: "#55554D", t: rf.chipNA },
    };
    const c = map[s] || map.not_applicable;
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded shrink-0" style={{ background: c.bg, color: c.fg }}>{c.t}</span>;
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">{fl.saveExit}</Link>
      </header>

      <div className="h-[5px] bg-[#DEDDD6]"><div className="h-[5px] bg-ink transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

      <main className="flex-grow px-6 sm:px-11 py-12 flex justify-center gap-11">
        <aside className="hidden lg:block w-[220px] shrink-0">
          <div className="text-[12px] tracking-wide text-muted mb-5 font-semibold">{rf.sidebar}</div>
          <div className="flex flex-col gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-2.5">
                <span className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${i <= step ? "bg-ink text-paper" : "bg-[#DEDDD6] text-muted"}`}>{i < step ? "✓" : i + 1}</span>
                <span className={`text-[15px] ${i === step ? "font-bold text-ink" : "text-muted"}`}>{s}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="w-full max-w-[640px]">
          <div className="text-[12px] tracking-wide text-muted mb-3 font-semibold">{fl.step} {step + 1} {fl.of} {steps.length}</div>

          {step === 0 && <DraftGateNotice gate={draftGate.gate} compact />}
          {step === 0 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s0Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s0Body}</p>
              {!profilesLoaded ? (
                <div className="text-[15px] text-muted">{rf.loadingProfiles}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {profiles.map((p) => (
                    <button key={p.id} type="button" onClick={() => pickProfile(p.id)} className={`text-left rounded-lg border p-4 ${!noProfile && orgProfileId === p.id ? "border-ink bg-card" : "border-line bg-card"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${!noProfile && orgProfileId === p.id ? "border-ink" : "border-[#C9C7BF]"}`}>{!noProfile && orgProfileId === p.id && <span className="w-[9px] h-[9px] rounded-full bg-ink" />}</span>
                        <span className="text-[15.5px] font-semibold">{p.name}</span>
                        {p.is_default && <span className="text-[10px] tracking-wide font-semibold bg-[#E3E2DC] text-[#45453D] px-1.5 py-0.5 rounded">{rf.default}</span>}
                        <span className="text-[13px] text-muted capitalize ml-auto">{p.type}</span>
                      </div>
                    </button>
                  ))}

                  <button type="button" onClick={pickNone} className={`text-left rounded-lg border p-4 ${noProfile ? "border-ink bg-card" : "border-line bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${noProfile ? "border-ink" : "border-[#C9C7BF]"}`}>{noProfile && <span className="w-[9px] h-[9px] rounded-full bg-ink" />}</span>
                      <span className="text-[15.5px] font-semibold">{rf.noProfile}</span>
                    </div>
                  </button>

                  {noProfile && (
                    <div className="rounded-lg border border-line bg-card p-5 flex flex-col gap-4">
                      <div>
                        <label className={label}>{rf.name}</label>
                        <input className={input} value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder={rf.namePh} />
                      </div>
                      <div>
                        <label className={label}>{rf.aboutLabel}</label>
                        <input className={input} value={quickAbout} onChange={(e) => setQuickAbout(e.target.value)} placeholder={rf.aboutPh} />
                      </div>
                      <div className="text-[13.5px] text-muted leading-relaxed">{rf.noProfileNote1}<Link href="/profiles" className="font-semibold text-ink underline">{rf.createProfile}</Link>{rf.noProfileNote2}</div>
                    </div>
                  )}

                  {profiles.length > 0 && <Link href="/profiles" className="text-[13.5px] font-semibold text-ink underline mt-1">{rf.manageProfiles}</Link>}
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s1Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s1Body}</p>
              <div className="mb-4 flex items-center gap-3 flex-wrap">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={onPickRfpFile} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={extracting} className="flex items-center gap-2 px-4 py-[10px] rounded-[4px] text-[14.5px] font-semibold border-[1.5px] bg-card text-ink border-ink disabled:opacity-40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  {extracting ? rf.reading : rf.uploadRfp}
                </button>
                {uploadName && !extracting && <span className="text-[13.5px] text-muted">{rf.loadedPre}{uploadName}{rf.loadedPost}</span>}
              </div>
              {uploadErr && <div className="mb-3 text-[13.5px] text-[#9A3B1E]">{uploadErr}</div>}
              <textarea value={answers.rfp_text} onChange={(e) => set("rfp_text", e.target.value)} placeholder={rf.rfpPh} className="w-full h-[300px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[15px] leading-relaxed bg-card resize-none outline-none focus:border-ink font-mono" />
              <div className="mt-2 text-[13px] text-muted">{rfpChars > 0 ? `${rfpChars.toLocaleString()}${rf.charsSuffix}` : rf.charsHint}</div>

              <div className="mt-6 pt-5 border-t border-line">
                <div className="flex items-center gap-3 flex-wrap">
                  <input ref={formatRef} type="file" accept=".pdf,.docx,.txt" onChange={onPickFormatFile} className="hidden" />
                  <button type="button" onClick={() => formatRef.current?.click()} disabled={formatExtracting} className="flex items-center gap-2 px-4 py-[10px] rounded-[4px] text-[14.5px] font-semibold border-[1.5px] bg-card text-ink border-[#C9C7BF] disabled:opacity-40">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    {formatExtracting ? rf.reading : rf.uploadFormat}
                  </button>
                  {formatName && !formatExtracting && <span className="text-[13.5px] text-muted">{rf.loadedPre}{formatName}{rf.formatLoadedPost}</span>}
                </div>
                {formatErr && <div className="mt-2 text-[13.5px] text-[#9A3B1E]">{formatErr}</div>}
                <div className="mt-2 text-[13px] text-muted leading-relaxed">{rf.formatHint}</div>
              </div>

              {analyzeErr && <div className="mt-3 text-[13.5px] text-[#9A3B1E]">{analyzeErr}</div>}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s2Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s2Body}</p>
              {analysis && (
                <div className="flex flex-col gap-5">
                  <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                    {[
                      [rf.mDonor, analysis.donor],
                      [rf.mThemes, (analysis.themes || []).join(", ")],
                      [rf.mGeography, geoConstraint || (g.left_to_applicant ? rf.leftToApplicant : "")],
                      [rf.mTarget, tgStated || (tgA.left_to_applicant ? rf.leftToApplicant : "")],
                      [rf.mBudget, budgetLine()],
                      [rf.mDuration, durationLine()],
                      [rf.mDeadline, analysis.deadline],
                      [rf.mSections, analysis.prescribed_format && analysis.prescribed_format.sections ? analysis.prescribed_format.sections.join(", ") : ""],
                    ].filter(([, v]) => v && String(v).trim()).map(([k, v]) => (
                      <div key={k as string} className="px-5 py-3.5">
                        <div className="text-[12px] tracking-wide text-muted font-semibold mb-1">{k}</div>
                        <div className="text-[15px] leading-relaxed">{v}</div>
                      </div>
                    ))}
                  </div>

                  {elig.length > 0 && (
                    <div>
                      <div className="text-[13px] tracking-wide text-muted font-semibold mb-2">{rf.eligibility}</div>
                      <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                        {elig.map((e: any, i: number) => (
                          <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                            <div className="flex-grow">
                              <div className="text-[14.5px] font-semibold leading-snug">{e.requirement}</div>
                              {e.evidence && <div className="text-[13px] text-muted leading-snug mt-0.5">{e.evidence}</div>}
                            </div>
                            {statusChip(e.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notMet > 0 && (
                    <div className="rounded-lg border border-[#E6C9BE] bg-[#F7ECE7] px-5 py-4 text-[14px] text-[#7A3016] leading-relaxed">
                      {rf.notMet1}{notMet === 1 ? rf.notMetOne : notMet + rf.notMetReq}{rf.notMet2}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s3Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s3Body}</p>
              <textarea value={answers.idea} onChange={(e) => set("idea", e.target.value)} placeholder={rf.ideaPh} className="w-full h-[150px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
              <VoiceInput value={answers.idea} onChange={(t) => set("idea", t)} />
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s4Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s4Body}</p>
              <div className="mb-5">
                <label className={label}>{rf.location}</label>
                {geoLocked ? (
                  <>
                    <input className={inputLocked} value={answers.location} readOnly />
                    <div className="mt-1.5 text-[13px] text-muted">{rf.setByRfp}</div>
                  </>
                ) : (
                  <>
                    <input className={input} value={answers.location} onChange={(e) => set("location", e.target.value)} placeholder={rf.locationPh} />
                    {geoConstraint && <div className="mt-1.5 text-[13px] text-muted">{rf.rfpRequires1}{geoConstraint}{rf.rfpRequires2}</div>}
                  </>
                )}
              </div>
              <div>
                <label className={label}>{rf.whoHelps}</label>
                {tgLocked ? (
                  <>
                    <input className={inputLocked} value={answers.beneficiaries} readOnly />
                    <div className="mt-1.5 text-[13px] text-muted">{rf.setByRfp}</div>
                  </>
                ) : (
                  <>
                    <input className={input} value={answers.beneficiaries} onChange={(e) => set("beneficiaries", e.target.value)} placeholder={rf.whoHelpsPh} />
                    {tgStated && <div className="mt-1.5 text-[13px] text-muted">{rf.fromRfp}</div>}
                  </>
                )}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s5Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s5Body}</p>
              <div className="mb-5">
                <label className={label}>{rf.howLong}</label>
                <input className={input} value={answers.duration} onChange={(e) => set("duration", e.target.value)} placeholder={rf.durationPh} />
                {durationLine() && <div className="mt-1.5 text-[13px] text-muted">{rf.rfpPrefix}{durationLine()}{rf.rfpSuffix}</div>}
              </div>
              <div>
                <label className={label}>{rf.budget}</label>
                <input className={input} value={answers.budget} onChange={(e) => set("budget", e.target.value)} placeholder={rf.budgetPh} />
                {budgetLine() && <div className="mt-1.5 text-[13px] text-muted">{rf.rfpPrefix}{budgetLine()}{rf.rfpSuffix}</div>}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{rf.s6Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{rf.s6Body}</p>
              <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                {[[rf.sumOrg, orgReview], [rf.sumRfp, rfpChars > 0 ? `${rfpChars.toLocaleString()}${rf.charsRead}` : fl.dash], [rf.sumApproach, answers.idea], [rf.sumLocation, answers.location], [rf.sumWho, answers.beneficiaries], [rf.sumDuration, answers.duration], [rf.sumBudget, answers.budget || rf.notSpecified]].map(([k, v]) => (
                  <div key={k} className="px-5 py-4">
                    <div className="text-[12px] tracking-wide text-muted font-semibold mb-1">{k}</div>
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{v}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === steps.length - 1 && <OutputLanguagePicker value={outLang} onChange={setOutLang} />}
          {step === steps.length - 1 && <AccessCodeInput value={couponCode} onChange={setCouponCode} />}
          {step === steps.length - 1 && <DraftGateNotice gate={draftGate.gate} code={couponCode} />}

          <div className="flex items-center justify-between mt-11">
            <button type="button" onClick={goBack} className="text-muted text-[15.5px] font-semibold">{fl.back}</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} disabled={!canContinue()} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{step === 1 ? (analyzing ? rf.readingRfp : rf.readRfp) : fl.continue}</button>
            ) : (
              <button type="button" onClick={generate} disabled={starting} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{starting ? rf.starting : draftGate.buttonLabel(couponCode, rf.build)}</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
