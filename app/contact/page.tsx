"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
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
    if (!message.trim()) { setErr("Please write a short message."); return; }
    if (!email.trim()) { setErr("Please add your email so we can reply."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const j = await res.json();
      setSending(false);
      if (!j.ok) { setErr(j.error || "Something went wrong. Please email us instead."); return; }
      setDone(true);
    } catch {
      setSending(false);
      setErr("Something went wrong. Please email us at hello@prastav.app instead.");
    }
  };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line bg-canvas">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/help" className="text-[13px] tracking-wide text-muted">HELP</Link>
          <Link href="/dashboard" className="text-[14.5px] text-muted">Dashboard</Link>
        </div>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[640px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-3">Get in touch</h1>
          <p className="text-[17px] text-muted leading-relaxed mb-8">
            Questions about Prastav, your proposal, or working with Prakash directly. Write to us and we will get back to you. You can also email
            {" "}<a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a> directly.
          </p>

          {done ? (
            <div className="bg-card border border-line rounded-lg p-8">
              <h2 className="text-[20px] font-bold mb-2">Thank you, your message is in.</h2>
              <p className="text-[15.5px] text-muted leading-relaxed mb-5">We have your note and will reply to the email you gave us. If it is urgent, email us at hello@prastav.app.</p>
              <Link href="/" className="inline-block bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">Back to home</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={label}>Your name</label>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                </div>
                <div>
                  <label className={label}>Email</label>
                  <input type="email" className={input} value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@organisation.org" />
                </div>
              </div>
              <div>
                <label className={label}>Subject</label>
                <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is this about?" />
              </div>
              <div>
                <label className={label}>Message</label>
                <textarea value={message} onChange={(e) => { setMessage(e.target.value); setErr(""); }} placeholder="Tell us what you need." className="w-full box-border h-[150px] border-[1.5px] border-[#C9C7BF] rounded-[5px] p-4 text-[16px] leading-relaxed bg-card resize-none outline-none focus:border-ink" />
              </div>
              {err && <div className="text-[14px] text-[#B4442F]">{err}</div>}
              <div>
                <button type="submit" disabled={sending} className="bg-ink text-paper text-[16px] font-semibold px-7 py-[14px] rounded-[4px] disabled:opacity-40">{sending ? "Sending…" : "Send message"}</button>
              </div>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-line text-[14px] text-muted leading-relaxed">
            <div className="font-semibold text-ink mb-1">Prastav</div>
            An AI workbench for the development sector, built by Prakash Kumar, Ranchi.
            <br />Email <a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a>
          </div>
        </div>
      </main>
    </div>
  );
}
