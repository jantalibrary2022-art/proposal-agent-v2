"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { useDict } from "../../_components/LocaleProvider";

export default function IdeaPage() {
  const router = useRouter();
  const { locale, t } = useDict();
  const d = t.idea;
  const fl = t.flows;
  const steps = d.steps;
  const [step, setStep] = useState(0);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [orgProfileId, setOrgProfileId] = useState<string>("");
  const [noProfile, setNoProfile] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickAbout, setQuickAbout] = useState("");

  const [ideaMode, setIdeaMode] = useState<"have" | "shape">("have");
  const [idea, setIdea] = useState("");
  const [hints, setHints] = useState("");
  const [concepts, setConcepts] = useState<any[]>([]);
  const [conceptIdx, setConceptIdx] = useState<number | null>(null);
  const [ideating, setIdeating] = useState(false);

  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceItems, setEvidenceItems] = useState<string[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [intaking, setIntaking] = useState(false);
  const [intakeErr, setIntakeErr] = useState("");
  const [brief, setBrief] = useState<any>(null);

  const [approaches, setApproaches] = useState<any[]>([]);
  const [approachIdx, setApproachIdx] = useState<number | null>(null);
  const [approachAdjust, setApproachAdjust] = useState("");
  const [loadingApproaches, setLoadingApproaches] = useState(false);
  const [approachErr, setApproachErr] = useState("");

  const [answers, setAnswers] = useState({ location: "", beneficiaries: "", duration: "", budget: "", funder: "" });
  const setA = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));
  const [qa, setQa] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);

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

  const profilePayload = () => noProfile
    ? { quick_profile: { name: quickName.trim(), about: quickAbout.trim() } }
    : { org_profile_id: orgProfileId };

  const onPickFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploadErr(""); setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/rfp/extract-text", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.text) {
        setEvidenceText((t) => t + (t ? "\n\n" : "") + "=== " + f.name + " ===\n" + data.text);
        setEvidenceItems((items) => [...items, f.name]);
      } else {
        setUploadErr(data.error === "unsupported_type" ? d.errUpload : d.errRead);
      }
    } catch { setUploadErr(d.errRead); }
    setUploadBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const suggestConcepts = async () => {
    setIdeating(true); setIntakeErr("");
    try {
      const res = await fetch("/api/open/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "ideate", hints, evidence: evidenceText, ...profilePayload() }) });
      const data = await res.json();
      if (data.ok && data.data && Array.isArray(data.data.concepts)) { setConcepts(data.data.concepts); setConceptIdx(null); }
      else setIntakeErr(data.error === "no_profile" ? d.errPickProfile : d.errConcepts);
    } catch { setIntakeErr(d.errConceptsRetry); }
    setIdeating(false);
  };

  const conceptToIdea = (c: any) => {
    const g = c.geography || {};
    const geo = [g.block, g.district, g.state].filter(Boolean).join(", ");
    return [c.title + ".", c.core_problem, "Target: " + c.target + ".", geo ? "Geography: " + geo + "." : "", c.rough_duration ? "Duration: " + c.rough_duration + "." : ""].filter(Boolean).join(" ");
  };

  const loadApproaches = async (theBrief: any) => {
    setLoadingApproaches(true); setApproachErr(""); setApproaches([]); setApproachIdx(null);
    try {
      const res = await fetch("/api/open/approaches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: theBrief, evidence: evidenceText, ...profilePayload() }) });
      const data = await res.json();
      if (data.ok && data.data && Array.isArray(data.data.approaches)) setApproaches(data.data.approaches);
      else setApproachErr(d.errApproaches);
    } catch { setApproachErr(d.errApproaches); }
    setLoadingApproaches(false);
  };

  const runIntake = async () => {
    const ideaText = ideaMode === "shape" && conceptIdx != null ? conceptToIdea(concepts[conceptIdx]) : idea;
    setIntaking(true); setIntakeErr("");
    try {
      const res = await fetch("/api/open/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "direct", idea: ideaText, evidence: evidenceText, ...profilePayload() }) });
      const data = await res.json();
      if (data.ok && data.data) {
        const b = data.data;
        setBrief(b);
        const g = b.geography || {};
        setAnswers((s) => ({
          ...s,
          location: s.location || [g.block, g.district, g.state].filter(Boolean).join(", ") || g.coverage || "",
          beneficiaries: s.beneficiaries || b.target || "",
          duration: s.duration || b.duration || "",
          budget: s.budget || b.budget_ceiling || "",
          funder: s.funder || (b.donor && b.donor !== "Donor-agnostic" ? b.donor : ""),
        }));
        setIntaking(false);
        setStep(2);
        loadApproaches(b);
        return;
      }
      setIntakeErr(data.error === "no_profile" ? d.errPickProfile : data.error === "missing_idea" ? d.errIdea : d.errReadIdea);
    } catch { setIntakeErr(d.errReadIdea); }
    setIntaking(false);
  };

  const generate = async () => {
    setStarting(true);
    const chosen = approachIdx != null ? { ...approaches[approachIdx], adjust: approachAdjust.trim() } : null;
    const questions = (brief && brief.questions_for_user) || [];
    const qaPairs = questions.map((q: string, i: number) => ({ question: q, answer: (qa[String(i)] || "").trim() })).filter((p: any) => p.answer);
    const ideaText = ideaMode === "shape" && conceptIdx != null ? conceptToIdea(concepts[conceptIdx]) : idea;
    const extra = qaPairs.length ? "\n\nApplicant clarifications:\n" + qaPairs.map((p: any) => "- " + p.question + " " + p.answer).join("\n") : "";
    const payload: any = {
      idea: ideaText + extra,
      location: answers.location, beneficiaries: answers.beneficiaries, duration: answers.duration, budget: answers.budget, funder: answers.funder,
      brief, chosen_approach: chosen, applicant_evidence: evidenceText,
      ...profilePayload(),
    };
    try {
      const res = await fetch("/api/proposals/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: payload }) });
      const data = await res.json();
      if (data.ok && data.id) { router.push("/proposals/" + data.id); return; }
      alert(d.couldNotStart + (data.error || "unknown error"));
    } catch (e) { alert(d.couldNotStartShort); }
    setStarting(false);
  };

  // voice (for the "have an idea" box)
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState(locale === "hi" ? "hi-IN" : "en-IN");
  const recognitionRef = useRef<any>(null);
  const keepRef = useRef(false);
  const committedRef = useRef("");
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);
  const run = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const recognition = new SR();
    recognition.lang = lang; recognition.interimResults = true; recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) committedRef.current += t + " "; else interim += t;
      }
      setIdea((committedRef.current + interim).replace(/\s+/g, " ").trimStart());
    };
    recognition.onend = () => { if (keepRef.current) { try { recognition.start(); } catch {} } else setListening(false); };
    recognition.onerror = (event: any) => { if (event.error === "not-allowed" || event.error === "service-not-allowed") { keepRef.current = false; setListening(false); } };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  };
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    committedRef.current = idea ? idea.trim() + " " : "";
    keepRef.current = true; setListening(true); run();
  };
  const stopListening = () => { keepRef.current = false; recognitionRef.current?.stop(); setListening(false); };
  const toggleMic = () => { listening ? stopListening() : startListening(); };

  const canContinue = () => {
    if (step === 0) return noProfile ? quickName.trim().length > 0 : !!orgProfileId;
    if (step === 1) return (ideaMode === "have" ? idea.trim().length > 0 : conceptIdx != null) && !intaking;
    if (step === 2) return approachIdx != null || (!loadingApproaches && approaches.length === 0);
    if (step === 3) return Boolean(answers.location.trim() && answers.beneficiaries.trim() && answers.duration.trim());
    return true;
  };
  const goNext = async () => {
    if (listening) stopListening();
    if (step === 1) {
      if (brief) { setStep(2); if (!approaches.length && !loadingApproaches) loadApproaches(brief); return; }
      await runIntake(); return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };
  const goBack = () => { if (listening) stopListening(); if (step === 0) router.push("/dashboard"); else setStep(step - 1); };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";
  const selectedProfile = profiles.find((p) => p.id === orgProfileId);
  const orgReview = noProfile ? (quickName.trim() || d.withoutProfile) : (selectedProfile ? selectedProfile.name : fl.dash);
  const pickProfile = (id: string) => { setNoProfile(false); setOrgProfileId(id); };
  const pickNone = () => { setNoProfile(true); setOrgProfileId(""); };

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
          <div className="text-[12px] tracking-wide text-muted mb-5 font-semibold">{d.sidebar}</div>
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

          {step === 0 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{d.s0Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{d.s0Body}</p>
              {!profilesLoaded ? (
                <div className="text-[15px] text-muted">{d.loadingProfiles}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {profiles.map((p) => (
                    <button key={p.id} type="button" onClick={() => pickProfile(p.id)} className={`text-left rounded-lg border p-4 ${!noProfile && orgProfileId === p.id ? "border-ink bg-card" : "border-line bg-card"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${!noProfile && orgProfileId === p.id ? "border-ink" : "border-[#C9C7BF]"}`}>{!noProfile && orgProfileId === p.id && <span className="w-[9px] h-[9px] rounded-full bg-ink" />}</span>
                        <span className="text-[15.5px] font-semibold">{p.name}</span>
                        {p.is_default && <span className="text-[10px] tracking-wide font-semibold bg-[#E3E2DC] text-[#45453D] px-1.5 py-0.5 rounded">{d.default}</span>}
                        <span className="text-[13px] text-muted capitalize ml-auto">{p.type}</span>
                      </div>
                    </button>
                  ))}
                  <button type="button" onClick={pickNone} className={`text-left rounded-lg border p-4 ${noProfile ? "border-ink bg-card" : "border-line bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${noProfile ? "border-ink" : "border-[#C9C7BF]"}`}>{noProfile && <span className="w-[9px] h-[9px] rounded-full bg-ink" />}</span>
                      <span className="text-[15.5px] font-semibold">{d.noProfile}</span>
                    </div>
                  </button>
                  {noProfile && (
                    <div className="rounded-lg border border-line bg-card p-5 flex flex-col gap-4">
                      <div><label className={label}>{d.name}</label><input className={input} value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder={d.namePh} /></div>
                      <div><label className={label}>{d.aboutLabel}</label><input className={input} value={quickAbout} onChange={(e) => setQuickAbout(e.target.value)} placeholder={d.aboutPh} /></div>
                      <div className="text-[13.5px] text-muted leading-relaxed">{d.noProfileNote1}<Link href="/profiles" className="font-semibold text-ink underline">{d.createProfile}</Link>{d.noProfileNote2}</div>
                    </div>
                  )}
                  {profiles.length > 0 && <Link href="/profiles" className="text-[13.5px] font-semibold text-ink underline mt-1">{d.manageProfiles}</Link>}
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{d.s1Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-5">{d.s1Body}</p>

              <div className="flex items-center gap-1 bg-[#DEDDD6] rounded-[5px] p-1 mb-5 w-fit">
                <button type="button" onClick={() => setIdeaMode("have")} className={`px-4 py-[8px] rounded-[4px] text-[14px] font-semibold ${ideaMode === "have" ? "bg-card text-ink" : "text-muted"}`}>{d.haveIdea}</button>
                <button type="button" onClick={() => setIdeaMode("shape")} className={`px-4 py-[8px] rounded-[4px] text-[14px] font-semibold ${ideaMode === "shape" ? "bg-card text-ink" : "text-muted"}`}>{d.shapeIdea}</button>
              </div>

              {ideaMode === "have" ? (
                <>
                  <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={d.havePh} className="w-full h-[140px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={toggleMic} disabled={!supported} className={`flex items-center gap-2 px-4 py-[10px] rounded-[4px] text-[14.5px] font-semibold border-[1.5px] ${listening ? "bg-ink text-paper border-ink" : "bg-card text-ink border-ink"} disabled:opacity-40`}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      {listening ? d.listening : d.speak}
                    </button>
                    {supported && (
                      <div className="flex items-center gap-1 bg-[#DEDDD6] rounded-[4px] p-1">
                        <button type="button" onClick={() => setLang("en-IN")} disabled={listening} className={`px-3 py-[6px] rounded-[3px] text-[13px] font-semibold disabled:opacity-50 ${lang === "en-IN" ? "bg-ink text-paper" : "text-muted"}`}>{d.langEn}</button>
                        <button type="button" onClick={() => setLang("hi-IN")} disabled={listening} className={`px-3 py-[6px] rounded-[3px] text-[13px] font-semibold disabled:opacity-50 ${lang === "hi-IN" ? "bg-ink text-paper" : "text-muted"}`}>{d.langHi}</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <label className={label}>{d.shapeLabel}</label>
                  <textarea value={hints} onChange={(e) => setHints(e.target.value)} placeholder={d.shapePh} className="w-full h-[90px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
                  <button type="button" onClick={suggestConcepts} disabled={ideating} className="mt-3 bg-card border-[1.5px] border-ink text-ink text-[14.5px] font-semibold px-[18px] py-[11px] rounded-[4px] disabled:opacity-40">{ideating ? d.thinking : d.suggestConcepts}</button>
                  {concepts.length > 0 && (
                    <div className="mt-5 flex flex-col gap-3">
                      {concepts.map((c, i) => (
                        <button key={i} type="button" onClick={() => setConceptIdx(i)} className={`text-left rounded-lg border p-4 ${conceptIdx === i ? "border-ink bg-card" : "border-line bg-card"}`}>
                          <div className="text-[15.5px] font-bold mb-1">{c.title}</div>
                          <div className="text-[14px] text-[#45453D] leading-snug mb-1">{c.core_problem}</div>
                          <div className="text-[13px] text-muted leading-snug">{c.target}{c.rough_duration ? " · " + c.rough_duration : ""}{c.rough_budget_band ? " · " + c.rough_budget_band : ""}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 border-t border-line pt-5">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.csv" onChange={onPickFile} className="hidden" />
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadBusy} className="flex items-center gap-2 px-4 py-[10px] rounded-[4px] text-[14px] font-semibold border-[1.5px] bg-card text-ink border-[#C9C7BF] disabled:opacity-40">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    {uploadBusy ? d.reading : d.attach}
                  </button>
                  {evidenceItems.length > 0 && <span className="text-[13px] text-muted">{evidenceItems.join(", ")}</span>}
                </div>
                {uploadErr && <div className="mt-2 text-[13px] text-[#9A3B1E]">{uploadErr}</div>}
              </div>

              {intakeErr && <div className="mt-4 text-[13.5px] text-[#9A3B1E]">{intakeErr}</div>}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{d.s2Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{d.s2BodyA}{brief?.theme || d.s2Theme}{d.s2BodyB}{evidenceItems.length ? d.s2BodyEvidence : ""}{d.s2BodyC}</p>
              {loadingApproaches ? (
                <div className="text-[15px] text-muted">{d.thinkingApproaches}</div>
              ) : approaches.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {approaches.map((a, i) => (
                    <button key={i} type="button" onClick={() => setApproachIdx(i)} className={`text-left rounded-lg border p-5 ${approachIdx === i ? "border-ink bg-card" : "border-line bg-card"}`}>
                      <div className="text-[16px] font-bold mb-1.5">{a.title}</div>
                      <div className="text-[14.5px] text-[#45453D] leading-snug mb-2">{a.summary}</div>
                      {a.why_it_fits_org && <div className="text-[13px] text-muted leading-snug">{d.fit}{a.why_it_fits_org}</div>}
                      {a.trade_off && <div className="text-[13px] text-muted leading-snug mt-0.5">{d.tradeOff}{a.trade_off}</div>}
                    </button>
                  ))}
                  <div className="mt-2">
                    <label className={label}>{d.adjustLabel}</label>
                    <textarea value={approachAdjust} onChange={(e) => setApproachAdjust(e.target.value)} placeholder={d.adjustPh} className="w-full h-[80px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-3 text-[15px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
                  </div>
                </div>
              ) : (
                <div className="text-[15px] text-muted leading-relaxed">{approachErr || d.noApproaches}{d.noApproachesCont}</div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{d.s3Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{d.s3Body}</p>
              <div className="mb-5"><label className={label}>{d.location}</label><input className={input} value={answers.location} onChange={(e) => setA("location", e.target.value)} placeholder={d.locationPh} /></div>
              <div className="mb-5"><label className={label}>{d.whoHelps}</label><input className={input} value={answers.beneficiaries} onChange={(e) => setA("beneficiaries", e.target.value)} placeholder={d.whoHelpsPh} /></div>
              <div className="mb-5"><label className={label}>{d.duration}</label><input className={input} value={answers.duration} onChange={(e) => setA("duration", e.target.value)} placeholder={d.durationPh} /></div>
              <div className="mb-5">
                <label className={label}>{d.budget}</label>
                <input className={input} value={answers.budget} onChange={(e) => setA("budget", e.target.value)} placeholder={d.budgetPh} />
                {brief && brief.budget_basis === "estimated-to-confirm" && <div className="mt-1.5 text-[13px] text-muted">{d.budgetNote}</div>}
              </div>
              <div className="mb-2"><label className={label}>{d.funder}</label><input className={input} value={answers.funder} onChange={(e) => setA("funder", e.target.value)} placeholder={d.funderPh} /></div>

              {brief && (brief.questions_for_user || []).length > 0 && (
                <div className="mt-6 flex flex-col gap-5">
                  <div className="text-[13px] tracking-wide text-muted font-semibold">{d.moreThings}</div>
                  {(brief.questions_for_user || []).map((q: string, i: number) => (
                    <div key={i}>
                      <label className={label}>{q}</label>
                      <input className={input} value={qa[String(i)] || ""} onChange={(e) => setQa((a) => ({ ...a, [String(i)]: e.target.value }))} placeholder={d.answerPh} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{d.s4Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{d.s4Body}</p>
              <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                {[[d.sumOrg, orgReview], [d.sumTheme, (brief && brief.theme) || fl.dash], [d.sumApproach, approachIdx != null ? approaches[approachIdx].title : d.defaultApproach], [d.sumLocation, answers.location], [d.sumWho, answers.beneficiaries], [d.sumDuration, answers.duration], [d.sumBudget, answers.budget || d.toBeEstimated], [d.sumMaterial, evidenceItems.length ? evidenceItems.join(", ") : d.noneAttached]].map(([k, v]) => (
                  <div key={k} className="px-5 py-4"><div className="text-[12px] tracking-wide text-muted font-semibold mb-1">{k}</div><div className="text-[15px] leading-relaxed">{v}</div></div>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between mt-11">
            <button type="button" onClick={goBack} className="text-muted text-[15.5px] font-semibold">{fl.back}</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} disabled={!canContinue()} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{step === 1 && intaking ? d.readingIdea : fl.continue}</button>
            ) : (
              <button type="button" onClick={generate} disabled={starting} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{starting ? d.starting : d.generate}</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
