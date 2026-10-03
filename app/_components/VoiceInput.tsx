"use client";

import { useEffect, useRef, useState } from "react";
import { useDict } from "./LocaleProvider";

// Speak-to-type for any text field, using the browser's built-in speech
// recognition (Chrome, Edge, Android Chrome). Spoken words are appended to
// whatever is already in the field. Free: no audio leaves through our servers.

type Lang = "en-IN" | "hi-IN";

// Only one microphone may be live at a time across the page.
let activeStop: (() => void) | null = null;

function getSR(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export default function VoiceInput({
  value,
  onChange,
  size = "md",
  showLang = true,
}: {
  value: string;
  onChange: (text: string) => void;
  size?: "sm" | "md";
  showLang?: boolean;
}) {
  const { locale, t } = useDict();
  const v = t.voice;
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState<Lang>(locale === "hi" ? "hi-IN" : "en-IN");
  const [msg, setMsg] = useState("");

  const recRef = useRef<any>(null);
  const keepRef = useRef(false);
  const baseRef = useRef("");        // text before the current recognition session
  const sessionRef = useRef("");     // text shown for the current session (final + still-provisional words)
  const heardRef = useRef(false);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!getSR()) setSupported(false);
    return () => { keepRef.current = false; try { recRef.current?.abort(); } catch {} };
  }, []);

  const join = (...parts: string[]) => parts.filter((s) => s && s.trim()).join(" ").replace(/\s+/g, " ").trim();

  const stop = () => {
    keepRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    if (activeStop === stop) activeStop = null;
  };

  const startSession = () => {
    const SR = getSR();
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    // Android Chrome and iPhone Safari can repeat words in continuous mode, so
    // on phones we take one phrase at a time and restart automatically until
    // the user taps stop.
    const ua = navigator.userAgent;
    const phone = /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = !phone;
    sessionRef.current = "";
    rec.onresult = (e: any) => {
      let finals = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const tx = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += " " + tx; else interim += " " + tx;
      }
      // Keep what the user can see. Safari often leaves Hindi words provisional
      // and never marks them final, so committing only finals would erase them.
      // Safari can also send an empty result as it stops; ignore it.
      if (!(finals + interim).trim()) return;
      sessionRef.current = finals + " " + interim;
      heardRef.current = true;
      setMsg("");
      onChangeRef.current(join(baseRef.current, finals, interim));
    };
    rec.onerror = (e: any) => {
      const err = e && e.error;
      if (err === "not-allowed" || err === "service-not-allowed") { keepRef.current = false; setMsg(v.denied); }
      else if (err === "network") { keepRef.current = false; setMsg(v.network); }
      else if (err === "audio-capture") { keepRef.current = false; setMsg(v.noMic); }
      // "no-speech" and "aborted" are normal pauses; the session restarts below.
    };
    rec.onend = () => {
      baseRef.current = join(baseRef.current, sessionRef.current);
      sessionRef.current = "";
      onChangeRef.current(baseRef.current);
      if (keepRef.current) {
        try { startSession(); } catch { stop(); }
      } else {
        setListening(false);
        if (!heardRef.current) setMsg((m) => m || v.nothingHeard);
      }
    };
    recRef.current = rec;
    try { rec.start(); } catch { stop(); }
  };

  const start = () => {
    if (!getSR()) { setSupported(false); return; }
    if (activeStop && activeStop !== stop) activeStop();
    activeStop = stop;
    baseRef.current = (valueRef.current || "").trim();
    heardRef.current = false;
    setMsg("");
    keepRef.current = true;
    setListening(true);
    startSession();
  };

  const btn = size === "sm"
    ? "gap-1.5 px-3 h-[36px] text-[13px]"
    : "gap-2 px-4 py-[10px] text-[14.5px]";

  if (!supported) return <div className="mt-2 text-[13px] text-muted">{v.unsupported}</div>;

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => (listening ? stop() : start())}
          aria-pressed={listening}
          className={`flex items-center rounded-[4px] font-semibold border-[1.5px] ${btn} ${listening ? "bg-ink text-paper border-ink" : "bg-card text-ink border-ink"}`}
        >
          {listening ? (
            <span className="relative flex w-2.5 h-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#E5484D] opacity-70 animate-ping" />
              <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-[#E5484D]" />
            </span>
          ) : (
            <svg width={size === "sm" ? 15 : 17} height={size === "sm" ? 15 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
          )}
          {listening ? v.listening : v.speak}
        </button>
        {showLang && (
          <div className="flex items-center gap-1 bg-[#DEDDD6] rounded-[4px] p-1" role="group" aria-label={v.langLabel}>
            {(["en-IN", "hi-IN"] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                disabled={listening}
                className={`px-2.5 py-[5px] rounded-[3px] text-[12.5px] font-semibold disabled:opacity-50 ${lang === code ? "bg-ink text-paper" : "text-muted"}`}
              >
                {code === "en-IN" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>
        )}
      </div>
      {msg && <div className="mt-2 text-[13px] text-[#8A3B12] leading-snug" role="status">{msg}</div>}
    </div>
  );
}
