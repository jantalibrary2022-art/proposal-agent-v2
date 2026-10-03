"use client";

import { useEffect, useState } from "react";
import { useDict } from "../../_components/LocaleProvider";

// Waiting screen while a proposal is generated (typically 5 to 11 minutes).
// The bar follows the real stage the engine reports (meta.progress.stage) and
// eases forward within a stage; it never claims 100% before the draft exists.

const OPEN_STEPS = ["intake", "research", "cost", "build", "compose", "draft"];
const IMPROVE_STEPS = ["diagnose", "research", "cost", "rebuild", "compose", "draft"];
const WEIGHTS = [0.08, 0.3, 0.14, 0.26, 0.2, 0.02];
const EXPECTED_TOTAL_MIN = 8;

function computePct(steps: string[], stage: string | null, stageAt: number, now: number): { pct: number; idx: number } {
  let idx = stage ? steps.indexOf(stage) : 0;
  if (idx < 0) idx = 0;
  const start = WEIGHTS.slice(0, idx).reduce((a, b) => a + b, 0);
  const w = WEIGHTS[idx] || 0.02;
  const expectedMs = Math.max(20000, w * EXPECTED_TOTAL_MIN * 60000);
  const within = 1 - Math.exp(-Math.max(0, now - stageAt) / expectedMs);
  return { pct: Math.min(0.97, start + w * 0.9 * within), idx };
}

export default function GenerationProgress({
  title,
  mode,
  stage,
  stageAt,
  createdAt,
  email,
}: {
  title?: string | null;
  mode?: string | null;
  stage?: string | null;
  stageAt?: string | null;
  createdAt?: string | null;
  email?: string;
}) {
  const { t } = useDict();
  const g = t.genProgress;
  // First render is deterministic (server and browser agree); the clock and the
  // random starting tip are applied after mount.
  const [nowState, setNow] = useState<number | null>(null);
  const [tip, setTip] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    setNow(Date.now());
    setTip(Math.floor(Math.random() * g.tips.length));
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [g.tips.length]);
  useEffect(() => {
    const i = setInterval(() => {
      setFade(false);
      setTimeout(() => { setTip((n) => (n + 1) % g.tips.length); setFade(true); }, 350);
    }, 12000);
    return () => clearInterval(i);
  }, [g.tips.length]);

  const steps = mode === "improve" ? IMPROVE_STEPS : OPEN_STEPS;
  const created = createdAt ? Date.parse(createdAt) : 0;
  const now = nowState ?? created;
  const at = stageAt ? Date.parse(stageAt) : created;
  const { pct, idx } = computePct(steps, stage || null, at, now);
  const mins = Math.max(0, Math.floor((now - created) / 60000));
  const stageLabel = (key: string) => (g.stages as Record<string, string>)[key === "intake" && mode === "rfp" ? "intakeRfp" : key] || key;

  return (
    <div className="bg-card border border-line rounded-lg p-6 sm:p-8">
      <style>{`
        @keyframes prastav-line { 0% { transform: scaleX(0); } 60%,100% { transform: scaleX(1); } }
        @keyframes prastav-pen { 0% { transform: translate(0,0) rotate(-8deg); } 25% { transform: translate(60px,0) rotate(-4deg); } 50% { transform: translate(110px,4px) rotate(-10deg); } 75% { transform: translate(40px,8px) rotate(-6deg); } 100% { transform: translate(0,0) rotate(-8deg); } }
        @keyframes prastav-sheen { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
        .pv-line { transform-origin: left; animation: prastav-line 3.2s ease-in-out infinite; }
        .pv-pen { animation: prastav-pen 3.2s ease-in-out infinite; }
        .pv-sheen { animation: prastav-sheen 2.4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .pv-line, .pv-pen, .pv-sheen { animation: none; } }
      `}</style>

      <div className="text-[12px] tracking-wide font-semibold text-muted mb-1">{g.kicker}</div>
      <h1 className="font-extrabold text-[clamp(22px,4vw,30px)] tracking-tight leading-tight mb-6">{title || g.titleFallback}</h1>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 items-start">
        <div>
          {/* Progress bar */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[15px] font-semibold">{stageLabel(steps[idx])}…</div>
            <div className="text-[13px] text-muted tabular-nums">{Math.round(pct * 100)}%</div>
          </div>
          <div className="relative h-2.5 rounded-full bg-[#E4E3DC] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
            <div className="absolute inset-y-0 left-0 bg-ink rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${pct * 100}%` }}>
              <div className="pv-sheen absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
          </div>
          <div className="mt-2 text-[13px] text-muted">{g.elapsed.replace("{m}", String(mins))}</div>

          {/* Steps */}
          <ol className="mt-6 flex flex-col gap-2.5">
            {steps.slice(0, 5).map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[14.5px]">
                <span className={"w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold " + (i < idx ? "bg-ink text-paper" : i === idx ? "border-2 border-ink" : "border border-[#C9C7BF] text-muted")}>
                  {i < idx ? "✓" : i + 1}
                </span>
                <span className={i < idx ? "text-muted line-through decoration-[#C9C7BF]" : i === idx ? "font-semibold" : "text-muted"}>{stageLabel(s)}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 border-t border-line pt-4 text-[14px] leading-relaxed text-[#3A3A31]">
            {email ? g.leaveNote.replace("{email}", email) : g.leaveNoteNoEmail}
          </div>
        </div>

        {/* Animation + tip */}
        <div className="flex flex-col gap-4">
          <div className="relative bg-white border border-line rounded-md h-[170px] overflow-hidden" aria-hidden>
            <div className="absolute left-5 right-5 top-5 h-2.5 rounded bg-ink/80 w-2/3" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="absolute left-5 right-5 h-[6px] rounded bg-[#D9D7CE]" style={{ top: 44 + i * 18 }}>
                <div className="pv-line h-full rounded bg-[#8F8C80]" style={{ animationDelay: `${i * 0.45}s`, width: `${[92, 78, 88, 60, 84, 70][i]}%` }} />
              </div>
            ))}
            <svg className="pv-pen absolute left-[60px] top-[52px]" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1a1a17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" fill="#F4F3EE" />
            </svg>
          </div>
          <div className="bg-[#F4F3EE] border border-line rounded-md p-4 min-h-[128px]">
            <div className="text-[11px] tracking-[0.1em] text-muted mb-2">{g.tipKicker}</div>
            <p className={"text-[14.5px] leading-relaxed transition-opacity duration-300 " + (fade ? "opacity-100" : "opacity-0")}>{g.tips[tip]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
