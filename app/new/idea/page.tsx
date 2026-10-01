"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const steps = ["Your idea", "Where & who", "Timeline & budget", "Funder", "Review"];

export default function IdeaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [starting, setStarting] = useState(false);
  const generate = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/proposals/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const data = await res.json();
      if (data.ok && data.id) { router.push("/proposals/" + data.id); return; }
      alert("Could not start: " + (data.error || "unknown error"));
    } catch (e) { alert("Could not start the proposal."); }
    setStarting(false);
  };
  const [answers, setAnswers] = useState({
    idea: "", location: "", beneficiaries: "", duration: "", budget: "", funder: "",
  });
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));

  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState("en-IN");
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
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) committedRef.current += t + " ";
        else interim += t;
      }
      set("idea", (committedRef.current + interim).replace(/\s+/g, " ").trimStart());
    };
    recognition.onend = () => { if (keepRef.current) { try { recognition.start(); } catch {} } else setListening(false); };
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") { keepRef.current = false; setListening(false); }
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  };
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    committedRef.current = answers.idea ? answers.idea.trim() + " " : "";
    keepRef.current = true; setListening(true); run();
  };
  const stopListening = () => { keepRef.current = false; recognitionRef.current?.stop(); setListening(false); };
  const toggleMic = () => { listening ? stopListening() : startListening(); };

  const canContinue = () => {
    if (step === 0) return answers.idea.trim().length > 0;
    if (step === 1) return Boolean(answers.location.trim() && answers.beneficiaries.trim());
    if (step === 2) return answers.duration.trim().length > 0;
    if (step === 3) return answers.funder.trim().length > 0;
    return true;
  };
  const goNext = () => { if (listening) stopListening(); if (step < steps.length - 1) setStep(step + 1); };
  const goBack = () => { if (listening) stopListening(); if (step === 0) router.push("/dashboard"); else setStep(step - 1); };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">Save &amp; exit</Link>
      </header>

      <div className="h-[5px] bg-[#DEDDD6]"><div className="h-[5px] bg-ink transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

      <main className="flex-grow px-6 sm:px-11 py-12 flex justify-center gap-11">
        <aside className="hidden lg:block w-[220px] shrink-0">
          <div className="text-[12px] tracking-wide text-muted mb-5 font-semibold">NEW PROPOSAL · YOUR IDEA</div>
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
          <div className="text-[12px] tracking-wide text-muted mb-3 font-semibold">STEP {step + 1} OF {steps.length}</div>

          {step === 0 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">What is your project about?</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">In a sentence or two, tell us the change you want to see and how. Plain language is fine. You can type, or speak your answer.</p>
              <textarea value={answers.idea} onChange={(e) => set("idea", e.target.value)} placeholder="For example: Improve maternal and child nutrition in tribal SHG households through kitchen gardens, community counselling, and convergence with ICDS and health services." className="w-full h-[150px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <button type="button" onClick={toggleMic} disabled={!supported} className={`flex items-center gap-2 px-4 py-[10px] rounded-[4px] text-[14.5px] font-semibold border-[1.5px] ${listening ? "bg-ink text-paper border-ink" : "bg-card text-ink border-ink"} disabled:opacity-40`}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  {listening ? "Listening… tap to stop" : "Speak your answer"}
                </button>
                {supported && (
                  <div className="flex items-center gap-1 bg-[#DEDDD6] rounded-[4px] p-1">
                    <button type="button" onClick={() => setLang("en-IN")} disabled={listening} className={`px-3 py-[6px] rounded-[3px] text-[13px] font-semibold disabled:opacity-50 ${lang === "en-IN" ? "bg-ink text-paper" : "text-muted"}`}>English</button>
                    <button type="button" onClick={() => setLang("hi-IN")} disabled={listening} className={`px-3 py-[6px] rounded-[3px] text-[13px] font-semibold disabled:opacity-50 ${lang === "hi-IN" ? "bg-ink text-paper" : "text-muted"}`}>हिन्दी</button>
                  </div>
                )}
              </div>
              {!supported && <div className="mt-2 text-[13.5px] text-muted">Voice input is not available in this browser. It works best in Chrome. You can type instead.</div>}
              <div className="mt-5 bg-card border border-dashed border-[#BEBCB2] rounded-[6px] px-6 py-5 flex items-center gap-4">
                <div className="flex-grow">
                  <div className="text-[15.5px] font-bold mb-1">Not sure yet? Let Prastav suggest ideas.</div>
                  <div className="text-[14px] text-muted leading-snug">We will propose a few project concepts built on your strengths and where you work.</div>
                </div>
                <button type="button" className="shrink-0 bg-card border-[1.5px] border-ink text-ink text-[14.5px] font-semibold px-[18px] py-[11px] rounded-[4px]">Help me shape an idea</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">Where will this work happen, and who will it help?</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">The place and the people it serves. This grounds the evidence search.</p>
              <div className="mb-5">
                <label className={label}>Location</label>
                <input className={input} value={answers.location} onChange={(e) => set("location", e.target.value)} placeholder="District, block, or area, e.g. Murhu block, Khunti, Jharkhand" />
              </div>
              <div>
                <label className={label}>Who it will help</label>
                <input className={input} value={answers.beneficiaries} onChange={(e) => set("beneficiaries", e.target.value)} placeholder="e.g. 1,200 women in SHG households and their children under 5" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">Timeline and budget</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">Rough figures are fine. Leave the budget blank if you are not sure, we can estimate it.</p>
              <div className="mb-5">
                <label className={label}>How long will it run?</label>
                <input className={input} value={answers.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 24 months" />
              </div>
              <div>
                <label className={label}>Budget (optional)</label>
                <input className={input} value={answers.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. around Rs 1.4 crore" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">Who is this proposal for?</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">The funder you have in mind. If you are not sure yet, say so and we will keep it general.</p>
              <div>
                <label className={label}>Funder</label>
                <input className={input} value={answers.funder} onChange={(e) => set("funder", e.target.value)} placeholder="e.g. a CSR foundation, a government scheme, or 'not decided yet'" />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">Review before we build</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">Check your answers. You can go back to change anything.</p>
              <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
                {[["Your idea", answers.idea], ["Location", answers.location], ["Who it will help", answers.beneficiaries], ["Duration", answers.duration], ["Budget", answers.budget || "Not specified"], ["Funder", answers.funder]].map(([k, v]) => (
                  <div key={k} className="px-5 py-4">
                    <div className="text-[12px] tracking-wide text-muted font-semibold mb-1">{k}</div>
                    <div className="text-[15px] leading-relaxed">{v}</div>
                  </div>
                ))}
              </div>
              {submitted && <div className="mt-5 bg-card border-l-[3px] border-ink rounded-[6px] px-5 py-4 text-[14.5px]">Got it. The next step we build will connect this to your engine and produce the proposal.</div>}
            </>
          )}

          <div className="flex items-center justify-between mt-11">
            <button type="button" onClick={goBack} className="text-muted text-[15.5px] font-semibold">&larr; Back</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} disabled={!canContinue()} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">Continue</button>
            ) : (
              <button type="button" onClick={generate} disabled={starting} className="bg-ink text-paper text-[16px] font-semibold px-[34px] py-[15px] rounded-[4px] disabled:opacity-40">{starting ? "Starting…" : "Generate proposal"}</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
