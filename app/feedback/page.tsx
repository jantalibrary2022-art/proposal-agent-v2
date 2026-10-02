"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { useDict } from "../_components/LocaleProvider";

export default function FeedbackPage() {
  const { t } = useDict();
  const f = t.feedbackPage;
  const DIMS: [string, string, string][] = [
    ["process", f.dProcess, f.dProcessH],
    ["ease", f.dEase, f.dEaseH],
    ["quality", f.dQuality, f.dQualityH],
    ["website", f.dWebsite, f.dWebsiteH],
  ];

  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("proposal");
      if (p) setProposalId(p);
    } catch {}
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
      setLoaded(true);
    });
  }, []);

  const setR = (k: string, v: number) => setRatings((a) => ({ ...a, [k]: v }));
  const canSubmit = DIMS.every(([k]) => (ratings[k] || 0) > 0);

  const submit = async () => {
    if (!canSubmit) { setErr(f.rateAll); return; }
    setErr(""); setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").insert({
      user_id: userId,
      proposal_id: proposalId,
      process: ratings.process, ease: ratings.ease, quality: ratings.quality, website: ratings.website,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">{t.common.backToDashboard}</Link>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-12 flex justify-center">
        <div className="w-full max-w-[560px]">
          {!loaded ? (
            <div className="text-[15px] text-muted">{t.common.loading}</div>
          ) : !userId ? (
            <div>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{f.loginTitle}</h1>
              <p className="text-[16px] text-muted leading-relaxed">{f.loginPre}<Link href="/login" className="font-semibold text-ink underline">{f.loginLink}</Link>{f.loginPost}</p>
            </div>
          ) : done ? (
            <div>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{f.thankTitle}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-6">{f.thankBody}</p>
              <Link href="/dashboard" className="inline-block bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">{t.common.backToDashboard}</Link>
            </div>
          ) : (
            <>
              <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-3">{f.title}</h1>
              <p className="text-[16px] text-muted leading-relaxed mb-8">{f.intro}</p>
              <div className="flex flex-col gap-7">
                {DIMS.map(([k, labelTxt, hint]) => (
                  <div key={k}>
                    <div className="text-[15.5px] font-semibold">{labelTxt}</div>
                    <div className="text-[13.5px] text-muted mb-3">{hint}</div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setR(k, n)} className={"w-11 h-11 rounded-[6px] text-[15px] font-semibold border-[1.5px] " + ((ratings[k] || 0) === n ? "bg-ink text-paper border-ink" : "bg-card text-ink border-[#C9C7BF]")}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <div className="text-[15.5px] font-semibold mb-2">{f.elseLabel}</div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={f.elsePh} className="w-full h-[110px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-3 text-[15px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
                </div>
                {err && <div className="text-[14px] text-[#B4442F]">{err}</div>}
                <div>
                  <button type="button" onClick={submit} disabled={saving} className="bg-ink text-paper text-[16px] font-semibold px-7 py-[14px] rounded-[4px] disabled:opacity-40">{saving ? f.sending : f.send}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
