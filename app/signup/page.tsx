"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function SignUp() {
  const [accountType, setAccountType] = useState<"individual" | "organisation">("individual");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
          <h1 className="font-extrabold text-[28px] tracking-[-0.03em] mt-6 mb-3">Check your email</h1>
          <p className="text-[15.5px] text-muted leading-relaxed">We sent a verification link to <span className="text-ink font-semibold">{email}</span>. Click it to confirm your account, then come back and log in.</p>
          <p className="text-[14px] text-muted mt-6">Didn&apos;t get it? Check spam, or <button onClick={() => setSent(false)} className="font-semibold text-ink underline">try again</button>.</p>
          <Link href="/login" className="inline-block mt-8 text-[14px] font-semibold text-ink">← Back to log in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">
      <aside className="hidden lg:flex w-[440px] shrink-0 bg-panel text-paper flex-col p-14">
        <div className="flex items-center gap-2 mb-16">
          <span className="w-[26px] h-[26px] rounded-[3px] bg-paper text-panel font-extrabold text-[15px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[20px] tracking-[-0.02em]">Prastav</span>
        </div>
        <h2 className="font-extrabold text-[36px] leading-[1.08] tracking-[-0.03em] mb-5">Proposals that hold up to scrutiny.</h2>
        <p className="text-[16px] leading-relaxed text-white/60 mb-10">Set up in a minute. Your work is saved as you go, so you can leave and return anytime.</p>
        <div className="space-y-[18px]">
          <Point text="Sourced evidence, never invented figures" />
          <Point text="PDF, Word and Excel in one run" />
          <Point text="English, Hindi and other Indian languages" />
        </div>
      </aside>

      <section className="flex-1 flex flex-col justify-center px-6 sm:px-16 py-12">
        <div className="w-full max-w-[520px] mx-auto">
          <div className="flex items-center justify-between mb-7">
            <h1 className="font-extrabold text-[30px] tracking-[-0.03em]">Create your account</h1>
            <span className="text-[14.5px] text-muted">Have one? <Link href="/login" className="font-semibold text-ink">Log in</Link></span>
          </div>

          <div className="text-[12px] tracking-wide text-muted mb-2.5">I AM REGISTERING AS</div>
          <div className="flex bg-[#DEDDD6] rounded p-[5px] mb-7">
            <button type="button" onClick={() => setAccountType("individual")} className={(accountType === "individual" ? "bg-ink text-paper" : "text-muted") + " flex-1 text-center font-semibold text-[15px] py-3 rounded-[3px]"}>An individual</button>
            <button type="button" onClick={() => setAccountType("organisation")} className={(accountType === "organisation" ? "bg-ink text-paper" : "text-muted") + " flex-1 text-center font-semibold text-[15px] py-3 rounded-[3px]"}>An organisation</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {accountType === "organisation" && (
              <div>
                <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">Organisation name</label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} type="text" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
              </div>
            )}
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">{accountType === "organisation" ? "Your name (primary contact)" : "Full name"}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
              <p className="text-[12.5px] text-muted mt-1.5">At least 6 characters.</p>
            </div>

            {error && <p className="text-[14px] text-[#B4442F]">{error}</p>}

            <button type="submit" disabled={loading} className="w-full h-[54px] bg-ink text-paper rounded font-semibold text-[16px] disabled:opacity-60">
              {loading ? "Creating your account…" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Point({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C9C8C2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      <span className="text-[15.5px] text-white/85">{text}</span>
    </div>
  );
}
