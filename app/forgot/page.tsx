"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { useDict } from "../_components/LocaleProvider";

export default function ForgotPage() {
  const { t } = useDict();
  const d = t.auth.forgot;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError(d.enterEmail); return; }
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/auth/reset",
    });
    setSending(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center border-b border-line">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
      </header>
      <main className="flex-grow flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          {!sent ? (
            <>
              <h1 className="font-extrabold text-[28px] tracking-tight mb-2">{d.title}</h1>
              <p className="text-[15px] text-muted leading-relaxed mb-7">{d.intro}</p>
              <form onSubmit={submit}>
                <label className="block text-[14px] font-semibold text-[#3A3A32] mb-2">{d.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink" placeholder={d.emailPlaceholder} />
                {error && <div className="mt-3 text-[14px] text-[#B42318]">{error}</div>}
                <button type="submit" disabled={sending} className="mt-5 w-full bg-ink text-paper text-[16px] font-semibold h-[52px] rounded-[4px] disabled:opacity-40">{sending ? d.submitting : d.submit}</button>
              </form>
              <div className="mt-6 text-[14.5px] text-muted">{d.remembered} <Link href="/login" className="font-semibold text-ink">{d.backToLogin}</Link></div>
            </>
          ) : (
            <>
              <h1 className="font-extrabold text-[28px] tracking-tight mb-2">{d.sentTitle}</h1>
              <p className="text-[15px] text-muted leading-relaxed mb-7">{d.sentBody1}{email}{d.sentBody2}</p>
              <Link href="/login" className="inline-block bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">{d.backToLogin}</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
