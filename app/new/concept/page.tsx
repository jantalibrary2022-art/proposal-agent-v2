"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import { useDict } from "../../_components/LocaleProvider";
import VoiceInput from "../../_components/VoiceInput";
import OutputLanguagePicker, { defaultOutputLanguage, type OutputLanguage } from "../../_components/OutputLanguagePicker";

export default function ConceptPage() {
  const router = useRouter();
  const { locale, t } = useDict();
  const d = t.concept;
  const di = t.idea; // shared profile + detail labels
  const fl = t.flows;
  const steps = d.steps;
  const [step, setStep] = useState(0);
  const [outLang, setOutLang] = useState<OutputLanguage>(defaultOutputLanguage(locale));

  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [orgProfileId, setOrgProfileId] = useState<string>("");
  const [noProfile, setNoProfile] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickAbout, setQuickAbout] = useState("");

  const [idea, setIdea] = useState("");
  const [formatText, setFormatText] = useState("");
  const [formatName, setFormatName] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [answers, setAnswers] = useState({ location: "", beneficiaries: "", duration: "", budget: "", funder: "" });
  const setA = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));
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
      if (data.ok && data.text) { setFormatText(data.text); setFormatName(f.name); }
      else setUploadErr(data.error === "unsupported_type" ? di.errUpload : di.errRead);
    } catch { setUploadErr(di.errRead); }
    setUploadBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const canContinue = () => {
    if (step === 0) return (noProfile ? quickName.trim().length > 0 : !!orgProfileId) && idea.trim().length > 0;
    if (step === 1) return Boolean(answers.location.trim() && answers.beneficiaries.trim() && answers.duration.trim());
    return true;
  };
  const goNext = () => { if (step < steps.length - 1) setStep(step + 1); };
  const goBack = () => { if (step === 0) router.push("/dashboard"); else setStep(step - 1); };

  const generate = async () => {
    setStarting(true);
    const payload: any = {
      output_language: outLang,
      idea,
      location: answers.location, beneficiaries: answers.beneficiaries, duration: answers.duration, budget: answers.budget, funder: answers.funder,
      format_doc_text: formatText || "",
      ...profilePayload(),
    };
    try {
      const res = await fetch("/api/proposals/generate-concept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: payload }) });
      const data = await res.json();
      if (data.ok && data.id) { router.push("/proposals/" + data.id); return; }
      alert(d.couldNotStart + (data.error || "unknown error"));
    } catch (e) { alert(d.couldNotStartShort); }
    setStarting(false);
  };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";
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
              <p className="text-[16px] text-muted leading-relaxed mb-5">{d.intro}</p>

              {!profilesLoaded ? (
                <div className="text-[15px] text-muted">{di.loadingProfiles}</div>
              ) : (
                <div className="flex flex-col gap-3 mb-7">
                  {profiles.map((p) => (
                    <button key={p.id} type="button" onClick={() => pickProfile(p.id)} className={`text-left rounded-lg border p-4 ${!noProfile && orgProfileId === p.id ? "border-ink bg-card" : "border-line bg-card"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${!noProfile && orgProfileId === p.id ? "border-ink" : "border-[#C9C7BF]"}`}>{!noProfile && orgProfileId === p.id && <span className="w-[9px] h-[9px] rounded-full bg-ink" />}</span>
                        <span className="text-[15.5px] font-semibold">{p.name}</span>
                        {p.is_default && <span className="text-[10px] tracking-wide font-semibold bg-[#E3E2DC] text-[#45453D] px-1.5 py-0.5 rounded">{di.default}</span>}
                        <span className="text-[13px] text-muted capitalize ml-auto">{p.type}</span>
                      </div>
                    </button>
                  ))}
                  <button type="button" onClick={pickNone} className={`text-left rounded-lg border p-4 ${noProfile ? "border-ink bg-card" : "border-line bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center shrink-0 ${noProfile ? "border-ink" : "border-[#C9C7BF]"}`}>{noProfile && <span className="w-[9px] h-[9px] rounded-full bg-ink" />}</span>
                      <span className="text-[15.5px] font-semibold">{di.noProfile}</span>
                    </div>
                  </button>
                  {noProfile && (
                    <div className="rounded-lg border border-line bg-card p-5 flex flex-col gap-4">
                      <div><label className={label}>{di.name}</label><input className={input} value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder={di.namePh} /></div>
                      <div><label className={label}>{di.aboutLabel}</label><input className={input} value={quickAbout} onChange={(e) => setQuickAbout(e.target.value)} placeholder={di.aboutPh} /></div>
                      <div className="text-[13.5px] text-muted leading-relaxed">{di.noProfileNote1}<Link href="/profiles" className="font-semibold text-ink underline">{di.createProfile}</Link>{di.noProfileNote2}</div>
                    </div>
                  )}
                  {profiles.length > 0 && <Link href="/profiles" className="text-[13.5px] font-semibold text-ink underline mt-1">{di.manageProfiles}</Link>}
                </div>
              )}

              <label className={label}>{d.ideaLabel}</label>
              <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={d.ideaPh} className="w-full h-[140px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
              <VoiceInput value={idea} onChange={setIdea} />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{d.s1Title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{d.s1Body}</p>

              <div className="flex flex-col gap-5">
                <div><label className={label}>{di.location}</label><input className={input} value={answers.location} onChange={(e) => setA("location", e.target.value)} placeholder={di.locationPh} /></div>
                <div><label className={label}>{di.whoHelps}</label><input className={input} value={answers.beneficiaries} onChange={(e) => setA("beneficiaries", e.target.value)} placeholder={di.whoHelpsPh} /></div>
                <div><label className={label}>{di.duration}</label><input className={input} value={answers.duration} onChange={(e) => setA("duration", e.target.value)} placeholder={di.durationPh} /></div>
                <div>
                  <label className={label}>{d.budgetLabelC}</label>
                  <input className={input} value={answers.budget} onChange={(e) => setA("budget", e.target.value)} placeholder={d.budgetPhC} />
                  <div className="text-[13px] text-muted mt-1.5">{d.budgetNoteC}</div>
                </div>
                <div><label className={label}>{di.funder}</label><input className={input} value={answers.funder} onChange={(e) => setA("funder", e.target.value)} placeholder={di.funderPh} /></div>

                <div>
                  <label className={label}>{d.formatLabel}</label>
                  <div className="text-[13.5px] text-muted leading-relaxed mb-2">{d.formatHelp}</div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={onPickFile} className="hidden" id="fmtfile" />
                  <label htmlFor="fmtfile" className="inline-block cursor-pointer bg-card border-[1.5px] border-ink text-ink text-[14.5px] font-semibold px-[18px] py-[11px] rounded-[4px]">{uploadBusy ? di.reading : d.formatAttach}</label>
                  {formatName && <div className="text-[13.5px] text-ink font-semibold mt-2">{d.formatAttached}{formatName}</div>}
                  {uploadErr && <div className="text-[13.5px] text-[#9B2D1F] mt-2">{uploadErr}</div>}
                </div>

                <OutputLanguagePicker value={outLang} onChange={setOutLang} />
              </div>
            </>
          )}

          <div className="flex items-center justify-between mt-10">
            <button type="button" onClick={goBack} className="text-muted text-[15px] font-semibold">{fl.back}</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} disabled={!canContinue()} className="bg-ink text-paper text-[16px] font-semibold px-8 py-[14px] rounded-[4px] disabled:opacity-40">{fl.continue}</button>
            ) : (
              <button type="button" onClick={generate} disabled={!canContinue() || starting} className="bg-ink text-paper text-[16px] font-semibold px-8 py-[14px] rounded-[4px] disabled:opacity-40">{starting ? d.starting : d.generate}</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
