"use client";

import { useState } from "react";
import Link from "next/link";
import { useDict } from "../_components/LocaleProvider";
import SiteHeader from "../_components/SiteHeader";

export default function ContactPage() {
  const { t } = useDict();
  const c = t.contactPage;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!message.trim()) { setErr(c.errMsg); return; }
    if (!email.trim()) { setErr(c.errEmail); return; }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const j = await res.json();
      setSending(false);
      if (!j.ok) { setErr(j.error || c.errGeneric); return; }
      setDone(true);
    } catch {
      setSending(false);
      setErr(c.errGeneric);
    }
  };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[640px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-3">{c.title}</h1>
          <p className="text-[17px] text-muted leading-relaxed mb-8">
            {c.intro1}<a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a>{c.intro2}
          </p>

          {done ? (
            <div className="bg-card border border-line rounded-lg p-8">
              <h2 className="text-[20px] font-bold mb-2">{c.doneTitle}</h2>
              <p className="text-[15.5px] text-muted leading-relaxed mb-5">{c.doneBody}</p>
              <Link href="/" className="inline-block bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">{c.backHome}</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={label}>{c.name}</label>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePh} />
                </div>
                <div>
                  <label className={label}>{c.email}</label>
                  <input type="email" className={input} value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder={c.emailPh} />
                </div>
              </div>
              <div>
                <label className={label}>{c.subject}</label>
                <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={c.subjectPh} />
              </div>
              <div>
                <label className={label}>{c.message}</label>
                <textarea value={message} onChange={(e) => { setMessage(e.target.value); setErr(""); }} placeholder={c.messagePh} className="w-full box-border h-[150px] border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
              </div>
              {err && <div className="text-[14px] text-[#B4442F]">{err}</div>}
              <div>
                <button type="submit" disabled={sending} className="bg-ink text-paper text-[16px] font-semibold px-7 py-[14px] rounded-[4px] disabled:opacity-40">{sending ? c.sending : c.send}</button>
              </div>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-line text-[14px] text-muted leading-relaxed">
            <div className="font-semibold text-ink mb-1">{c.footName}</div>
            {c.footBody}
            <br />{c.footEmail}<a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a>
          </div>
        </div>
      </main>
    </div>
  );
}
