"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex">
      <aside className="hidden lg:flex w-[440px] shrink-0 bg-panel text-paper flex-col p-14">
        <Link href="/" className="flex items-center gap-2 mb-16 w-fit">
          <span className="w-[26px] h-[26px] rounded-[3px] bg-paper text-panel font-extrabold text-[15px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[20px] tracking-[-0.02em]">Prastav</span>
        </Link>
        <h2 className="font-extrabold text-[36px] leading-[1.08] tracking-[-0.03em] mb-5">Welcome back.</h2>
        <p className="text-[16px] leading-relaxed text-white/60">Pick up your proposals where you left off.</p>
        <div className="mt-auto text-[13px] text-white/40">An AI workbench for the development sector.</div>
      </aside>

      <section className="flex-1 flex flex-col justify-center px-6 sm:px-16 py-12">
        <div className="w-full max-w-[460px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink mb-6">← Back to home</Link>
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-extrabold text-[30px] tracking-[-0.03em]">Log in</h1>
            <span className="text-[14.5px] text-muted">New here? <Link href="/signup" className="font-semibold text-ink">Register</Link></span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-[#3A3A32] mb-1.5">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[14px] font-semibold text-[#3A3A32]">Password</label>
                <Link href="/forgot" className="text-[13px] font-semibold text-muted hover:text-ink">Forgot password?</Link>
              </div>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full h-[50px] border-[1.5px] border-[#C9C7BF] rounded px-4 text-[15.5px] bg-white outline-none focus:border-ink" />
            </div>
            {error && <p className="text-[14px] text-[#B4442F]">{error}</p>}
            <button type="submit" disabled={loading} className="w-full h-[54px] bg-ink text-paper rounded font-semibold text-[16px] disabled:opacity-60">
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
