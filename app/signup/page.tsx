"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { useDict } from "../_components/LocaleProvider";

export default function SignUp() {
  const { t } = useDict();
  const d = t.auth.signup;
  const [accountType, setAccountType] = useState<"individual" | "organisation">("individual");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  useEffect(() => {
    try { if (new URLSearchParams(window.location.search).get("error") === "link_invalid") setLinkInvalid(true); } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8 || scorePassword(password) < 2) {
      setError(d.weakError);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          account_type: accountType,
          full_name: name,
          org_name: accountType === "organisation" ? orgName : null,
        },
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-[460px] text-center">
          <span className="inline-flex w-12 h-12 rounded-full bg-ink items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          </span>
          <h1 className="font-extrabold text-[28px] tracking-[-0.03em] mt-6 mb-3">{d.sentTitle}</h1>
          <p className="text-[15.5px] text-muted leading-relaxed">{d.sentBody1}<span className="text-ink font-semibold">{email}</span>{d.sentBody2}</p>
          <p className="text-[14px] text-muted mt-6">{d.didntGet}<button onClick={() => setSent(false)} className="font-semibold text-ink underline">{d.tryAgain}</button>.</p>
          <Link href="/login" className="inline-block mt-8 text-[14px] font-semibold text-ink">{d.backToLogin}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">
      <aside className="hidden lg:flex w-[440px] shrink-0 bg-panel text-paper flex-col p-14">
        <Link href="/" className="flex items-center gap-2 mb-16 w-fit">
          <span className="w-[26px] h-[26px] rounded-[3px] bg-paper text-panel font-extrabold text-[15px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[20px] tracking-[-0.02em]">Prastav</span>
        </Link>
        <h2 className="font-extrabold text-[36px] leading-[1.08] tracking-[-0.03em] mb-5">{d.asideHeading}</h2>
        <p className="text-[16px] leading-relaxed text-white/60 mb-10">{d.asideSub}</p>
        <div className="space-y-[18px]">
          <Point text={d.point1} />
          <Point text={d.point2} />
          <Point text={d.point3} />
        </div>
      </aside>

      <section className="flex-1 flex flex-col justify-center px-6 sm:px-16 py-12">
        <div className="w-full max-w-[520px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink mb-6">{t.auth.backHome}</Link>
          {linkInvalid && (
            <div className="mb-6 border border-[#E3C9A8] bg-[#FBF3E8] rounded-[5px] px-4 py-3 text-[14px] leading-relaxed text-[#5A3A12]" role="status">
              {d.linkInvalid} <Link href="/login" className="font-semibold underline">{d.linkInvalidSignIn}</Link>
            </div>
          )}
          <div className="flex items-center justify-between mb-7">
            <h1 className="font-extrabold text-[30px] tracking-[-0.03em]">{d.title}</h1>
            <span className="text-[14.5px] text-muted">{d.haveOne} <Link href="/login" className="font-semibold text-ink">{d.logIn}</Link></span>
          </div>

          <div className="text-[12px] tracking-wide text-muted mb-2.5">{d.registeringAs}</div>
          <div className="flex bg-[#DEDDD6] rounded p-[5px] mb-7">
            <button type="button" onClick={() => setAccountType("individual")} className={(accountType === "individual" ? "bg-ink text-paper" : "text-muted") + " flex-1 text-center font-semibold text-[15px] py-3 rounded-[3px]"}>{d.individual}</button>
            <button type="button" onClick={() => setAccountType("organisation")} className={(accountType === "organisation" ? "bg-ink text-paper" : "text-muted") + " flex-1 text-center font-semibold text-[15px] py-3 rounded-[3px]"}>{d.organisation}</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {accountType === "organisation" && (
              <div>
                <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">{d.orgName}</label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} type="text" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
              </div>
            )}
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">{accountType === "organisation" ? d.nameOrg : d.nameInd}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">{d.email}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">{d.password}</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
              {password.length > 0 ? (
                <div className="mt-2">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={"h-[5px] flex-1 rounded-full " + (scorePassword(password) > i ? "bg-ink" : "bg-[#DEDDD6]")} />
                    ))}
                  </div>
                  <p className="text-[12.5px] text-muted mt-1.5">{d.strength[scorePassword(password)]} · {d.hintWith}</p>
                </div>
              ) : (
                <p className="text-[12.5px] text-muted mt-1.5">{d.hintEmpty}</p>
              )}
            </div>

            {error && <p className="text-[14px] text-[#B4442F]">{error}</p>}

            <button type="submit" disabled={loading} className="w-full h-[54px] bg-ink text-paper rounded font-semibold text-[16px] disabled:opacity-60">
              {loading ? d.submitting : d.submit}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

function Point({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C9C8C2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      <span className="text-[15.5px] text-white/85">{text}</span>
    </div>
  );
}
