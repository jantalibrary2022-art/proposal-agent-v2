"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

export default function ResetPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setHasSession(true);
    });
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && active) setHasSession(true);
        }
      } catch {}
      const { data } = await supabase.auth.getSession();
      if (active) { if (data.session) setHasSession(true); setChecking(false); }
    })();
    return () => { active = false; sub.data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("The two passwords do not match."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
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
          <h1 className="font-extrabold text-[28px] tracking-tight mb-2">Set a new password</h1>
          {done ? (
            <p className="text-[15px] text-muted leading-relaxed">Your password has been updated. Taking you to log in…</p>
          ) : (
            <>
              <p className="text-[15px] text-muted leading-relaxed mb-7">Choose a new password for your account.</p>
              {!checking && !hasSession && (
                <div className="mb-5 text-[14px] text-muted bg-card border border-line rounded-[5px] px-4 py-3">Open this page from the reset link in your email. If you came here directly, request a new link from <Link href="/forgot" className="font-semibold text-ink">forgot password</Link>.</div>
              )}
              <form onSubmit={submit}>
                <label className="block text-[14px] font-semibold text-[#3A3A32] mb-2">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink" />
                <label className="block text-[14px] font-semibold text-[#3A3A32] mt-4 mb-2">Confirm new password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink" />
                {error && <div className="mt-3 text-[14px] text-[#B42318]">{error}</div>}
                <button type="submit" disabled={saving} className="mt-5 w-full bg-ink text-paper text-[16px] font-semibold h-[52px] rounded-[4px] disabled:opacity-40">{saving ? "Saving…" : "Update password"}</button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
