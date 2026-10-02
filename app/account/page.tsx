"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setEmail(data.user.email || "");
      setName((data.user.user_metadata?.full_name as string) || "");
      setLoaded(true);
    });
  }, [router]);

  const saveName = async () => {
    setNameMsg(""); setNameSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setNameSaving(false);
    setNameMsg(error ? error.message : "Saved.");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (newPw.length < 8) { setPwErr("Use at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwErr("The two new passwords do not match."); return; }
    setPwSaving(true);
    const supabase = createClient();
    const { error: verr } = await supabase.auth.signInWithPassword({ email, password: currentPw });
    if (verr) { setPwSaving(false); setPwErr("Your current password is incorrect."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) { setPwErr(error.message); return; }
    setPwMsg("Your password has been updated.");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const input = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-4 h-[52px] text-[16px] bg-card outline-none focus:border-ink";
  const inputRO = "w-full box-border border-[1.5px] border-[#DEDDD6] rounded-[5px] px-4 h-[52px] text-[16px] bg-[#F2F1EC] text-[#55554D] outline-none";
  const label = "block text-[14px] font-semibold text-[#3A3A32] mb-2";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">Back to dashboard</Link>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-12 flex justify-center">
        <div className="w-full max-w-[560px]">
          <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-8">Account</h1>

          {!loaded ? (
            <div className="text-[15px] text-muted">Loading…</div>
          ) : (
            <div className="flex flex-col gap-8">
              <section className="bg-card border border-line rounded-lg p-6">
                <h2 className="text-[17px] font-bold mb-5">Your details</h2>
                <div className="mb-5">
                  <label className={label}>Name</label>
                  <input className={input} value={name} onChange={(e) => { setName(e.target.value); setNameMsg(""); }} placeholder="Your name" />
                </div>
                <div className="mb-5">
                  <label className={label}>Email</label>
                  <input className={inputRO} value={email} readOnly />
                  <div className="mt-1.5 text-[13px] text-muted">Your email is the login for your account and can't be changed here.</div>
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={saveName} disabled={nameSaving} className="bg-ink text-paper text-[15px] font-semibold px-6 py-[12px] rounded-[4px] disabled:opacity-40">{nameSaving ? "Saving…" : "Save"}</button>
                  {nameMsg && <span className="text-[14px] text-muted">{nameMsg}</span>}
                </div>
              </section>

              <section className="bg-card border border-line rounded-lg p-6">
                <h2 className="text-[17px] font-bold mb-5">Change password</h2>
                <form onSubmit={changePassword}>
                  <div className="mb-4">
                    <label className={label}>Current password</label>
                    <input type="password" className={input} value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwErr(""); setPwMsg(""); }} autoComplete="current-password" />
                  </div>
                  <div className="mb-4">
                    <label className={label}>New password</label>
                    <input type="password" className={input} value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwErr(""); setPwMsg(""); }} autoComplete="new-password" />
                  </div>
                  <div className="mb-5">
                    <label className={label}>Confirm new password</label>
                    <input type="password" className={input} value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwErr(""); setPwMsg(""); }} autoComplete="new-password" />
                  </div>
                  {pwErr && <div className="mb-4 text-[14px] text-[#B42318]">{pwErr}</div>}
                  {pwMsg && <div className="mb-4 text-[14px] text-[#2F5E3A]">{pwMsg}</div>}
                  <button type="submit" disabled={pwSaving} className="bg-ink text-paper text-[15px] font-semibold px-6 py-[12px] rounded-[4px] disabled:opacity-40">{pwSaving ? "Updating…" : "Update password"}</button>
                </form>
              </section>

              <section className="bg-card border border-line rounded-lg p-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[17px] font-bold mb-1">Billing</h2>
                  <div className="text-[13.5px] text-muted">Your purchases and invoices.</div>
                </div>
                <Link href="/purchases" className="shrink-0 bg-ink text-paper text-[14px] font-semibold px-5 py-2.5 rounded-[4px]">View purchases</Link>
              </section>

              <div className="text-[14px] text-muted">Forgot your current password? <Link href="/forgot" className="font-semibold text-ink underline">Reset it by email</Link> instead.</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
