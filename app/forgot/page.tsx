"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Enter your email."); return; }
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
              <h1 className="font-extrabold text-[28px] tracking-tight mb-2">Reset your password</h1>
              <p className="text-[15px] text-muted leading-relaxed mb-7">Enter the email you registered with and we will send you a link to set a new password.</p>
              <form onSubmit={submit}>
                <label className="block text-[14px] font-semibold text-[#3A3A32] mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink" placeholder="you@example.org" />
                {error && <div className="mt-3 text-[14px] text-[#B42318]">{error}</div>}
                <button type="submit" disabled={sending} className="mt-5 w-full bg-ink text-paper text-[16px] font-semibold h-[52px] rounded-[4px] disabled:opacity-40">{sending ? "Sending…" : "Send reset link"}</button>
              </form>
              <div className="mt-6 text-[14.5px] text-muted">Remembered it? <Link href="/login" className="font-semibold text-ink">Back to log in</Link></div>
            </>
          ) : (
            <>
              <h1 className="font-extrabold text-[28px] tracking-tight mb-2">Check your email</h1>
              <p className="text-[15px] text-muted leading-relaxed mb-7">If an account exists for {email}, we have sent a link to reset your password. Open it on this device to continue.</p>
              <Link href="/login" className="inline-block bg-ink text-paper text-[15px] font-semibold px-6 py-3 rounded-[4px]">Back to log in</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
