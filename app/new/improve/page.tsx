"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDict } from "../../_components/LocaleProvider";
import VoiceInput from "../../_components/VoiceInput";
import OutputLanguagePicker, { defaultOutputLanguage, type OutputLanguage } from "../../_components/OutputLanguagePicker";
import AccessCodeInput from "../../_components/AccessCodeInput";

export default function ImprovePage() {
  const router = useRouter();
  const { locale, t } = useDict();
  const [outLang, setOutLang] = useState<OutputLanguage>(defaultOutputLanguage(locale));
  const [couponCode, setCouponCode] = useState("");
  const im = t.improve;
  const fl = t.flows;
  const steps = im.steps;
  const [step, setStep] = useState(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [draftPaste, setDraftPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [diagnosing, setDiagnosing] = useState(false);
  const [diagErr, setDiagErr] = useState("");
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [draftText, setDraftText] = useState("");

  const [qaAnswers, setQaAnswers] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);

  const onPickFile = (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setSelectedFile(f); setFileName(f.name); setDiagErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const runDiagnose = async () => {
    setDiagnosing(true); setDiagErr("");
    try {
      const fd = new FormData();
      if (selectedFile) fd.append("file", selectedFile);
      else fd.append("draft_text", draftPaste);
      const res = await fetch("/api/improve/diagnose", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.diagnosis) {
        setDiagnosis(data.diagnosis);
        setDraftText(data.draft_text || draftPaste);
        setDiagnosing(false);
        setStep(1);
        return;
      }
      setDiagErr(
        data.error === "unsupported_type" ? im.errUnsupported :
        data.error === "draft_too_short" ? im.errShort :
        data.error && String(data.error).startsWith("could_not_read_file") ? im.errRead :
        im.errGeneric
      );
    } catch { setDiagErr(im.errGeneric); }
    setDiagnosing(false);
  };

  const generate = async () => {
    setStarting(true);
    const qa = ((diagnosis && diagnosis.questions_for_user) || []).map((q: any) => ({ id: q.id, question: q.question, answer: (qaAnswers[q.id] || "").trim() }));
    const payload: any = { draft_text: draftText, diagnosis, qa, output_language: outLang, coupon_code: couponCode };
    try {
      const res = await fetch("/api/proposals/generate-improve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: payload }) });
      const data = await res.json();
      if (data.ok && data.id) { router.push("/proposals/" + data.id); return; }
      alert(im.couldNotStart + (data.error || "unknown error"));
    } catch (e) { alert(im.couldNotStartShort); }
    setStarting(false);
  };

  const canContinue = () => {
    if (step === 0) return (!!selectedFile || draftPaste.trim().length > 200) && !diagnosing;
    return true;
  };
  const goNext = async () => {
    if (step === 0) {
      if (diagnosis && draftText) { setStep(1); return; }
      await runDiagnose(); return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };
  const goBack = () => { if (step === 0) router.push("/dashboard"); else setStep(step - 1); };

  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";
  const m = (diagnosis && diagnosis.meta) || {};
  const strengths = (diagnosis && diagnosis.strengths) || [];
  const weaknesses = (diagnosis && diagnosis.weaknesses) || [];
  const flags = (diagnosis && diagnosis.source_authority_flags) || [];
  const plan = (diagnosis && diagnosis.improvement_plan) || [];
  const questions = (diagnosis && diagnosis.questions_for_user) || [];

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
          <div className="text-[12px] tracking-wide text-muted mb-5 font-semibold">{im.sidebar}</div>
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
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{im.s0Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{im.s0Body}</p>
              <div className="mb-4 flex items-center gap-3 flex-wrap">
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={onPickFile} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-[10px] rounded-[4px] text-[14.5px] font-semibold border-[1.5px] bg-card text-ink border-ink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  {im.upload}
                </button>
                {fileName && <span className="text-[13.5px] text-muted">{im.selected}{fileName}</span>}
              </div>
              <div className="text-[13px] text-muted mb-2">{im.orPaste}</div>
              <textarea value={draftPaste} onChange={(e) => { setDraftPaste(e.target.value); if (e.target.value.trim()) { setSelectedFile(null); setFileName(""); } }} placeholder={im.pastePh} className="w-full h-[220px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[15px] leading-relaxed bg-card resize-none outline-none focus:border-ink font-mono" />
              {diagErr && <div className="mt-3 text-[13.5px] text-[#9A3B1E]">{diagErr}</div>}
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{im.s1Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{im.s1Body}</p>
              {diagnosis && (
                <div className="flex flex-col gap-6">
                  <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                    {[[fl.metaTitle, m.title], [fl.metaDonor, m.donor], [fl.metaGeography, m.geography], [fl.metaTarget, m.target], [fl.metaDuration, m.duration], [fl.metaBudget, m.budget]].filter(([, v]) => v && String(v).trim()).map(([k, v]) => (
                      <div key={k as string} className="px-5 py-3"><div className="text-[12px] tracking-wide text-muted font-semibold mb-0.5">{k}</div><div className="text-[15px] leading-relaxed">{v}</div></div>
                    ))}
                  </div>

                  {strengths.length > 0 && (
                    <div>
                      <div className="text-[13px] tracking-wide text-muted font-semibold mb-2">{im.strengths}</div>
                      <div className="flex flex-col gap-2">
                        {strengths.map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-[14.5px] leading-snug">
                            <span className="mt-[3px] text-[#2F5E3A] shrink-0">✓</span><span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {weaknesses.length > 0 && (
                    <div>
                      <div className="text-[13px] tracking-wide text-muted font-semibold mb-2">{im.weaknesses}</div>
                      <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                        {weaknesses.map((w: any, i: number) => (
                          <div key={i} className="px-5 py-3.5">
                            <div className="text-[14.5px] font-semibold leading-snug">{w.area}</div>
                            <div className="text-[14px] text-[#45453D] leading-snug mt-0.5">{w.issue}</div>
                            {w.why_it_matters && <div className="text-[13px] text-muted leading-snug mt-1">{im.whyMatters}{w.why_it_matters}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {flags.length > 0 && (
                    <div>
                      <div className="text-[13px] tracking-wide text-muted font-semibold mb-2">{im.sourcesToCorrect}</div>
                      <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                        {flags.map((f: any, i: number) => (
                          <div key={i} className="px-5 py-3.5">
                            <div className="text-[14.5px] leading-snug">{f.claim}</div>
                            <div className="text-[13px] text-muted leading-snug mt-1">{im.draftUsed}{f.source_used}{im.replaceWith}{f.authoritative_source}{im.period}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.length > 0 && (
                    <div>
                      <div className="text-[13px] tracking-wide text-muted font-semibold mb-2">{im.improvementPlan}</div>
                      <div className="flex flex-col gap-2">
                        {plan.map((pl: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-[14.5px] leading-snug"><span className="mt-[2px] text-muted shrink-0">{i + 1}.</span><span>{pl}</span></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{im.s2Title}</h1>
              {questions.length > 0 ? (
                <>
                  <p className="text-[16px] text-muted leading-relaxed mb-6">{im.s2Body}</p>
                  <div className="flex flex-col gap-6">
                    {questions.map((q: any) => (
                      <div key={q.id}>
                        <label className={label}>{q.question}</label>
                        {q.why && <div className="text-[13px] text-muted mb-2 -mt-1">{q.why}</div>}
                        <textarea value={qaAnswers[q.id] || ""} onChange={(e) => setQaAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder={im.answerPh} className="w-full h-[90px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-3 text-[15px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
                        <VoiceInput value={qaAnswers[q.id] || ""} onChange={(t) => setQaAnswers((a) => ({ ...a, [q.id]: t }))} size="sm" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[16px] text-muted leading-relaxed">{im.noQuestions}</p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{im.s3Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{im.s3Body}</p>
              <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                {[[im.sumDraft, draftText ? `${draftText.length.toLocaleString()}${im.charsRead}` : fl.dash], [fl.metaTitle, m.title || fl.dash], [im.sumWeak, String(weaknesses.length)], [im.sumSources, String(flags.length)], [im.sumClar, String(((diagnosis && diagnosis.questions_for_user) || []).filter((q: any) => (qaAnswers[q.id] || "").trim()).length) + im.ofWord + String(questions.length)]].map(([k, v]) => (
                  <div key={k} className="px-5 py-4"><div className="text-[12px] tracking-wide text-muted font-semibold mb-1">{k}</div><div className="text-[15px] leading-relaxed">{v}</div></div>
                ))}
              </div>
            </>
          )}

          {step === steps.length - 1 && <OutputLanguagePicker value={outLang} onChange={setOutLang} />}
          {step === steps.length - 1 && <AccessCodeInput value={couponCode} onChange={setCouponCode} />}

          <div className="flex items-center justify-between mt-11">
            <button type="button" onClick={goBack} className="text-muted text-[15.5px] font-semibold">{fl.back}</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} disabled={!canContinue()} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{step === 0 ? (diagnosing ? im.diagnosing : im.diagnose) : fl.continue}</button>
            ) : (
              <button type="button" onClick={generate} disabled={starting} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{starting ? im.starting : im.build}</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
