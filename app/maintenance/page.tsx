import Link from "next/link";

export const dynamic = "force-dynamic";

// Shown to everyone except a signed-in admin while PRASTAV_MAINTENANCE=on.
// Self-contained: no data, no auth, no locale provider needed.
export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6">
      <div className="max-w-[520px] text-center">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="w-[30px] h-[30px] rounded-[4px] bg-ink text-paper font-extrabold text-[17px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[22px] tracking-[-0.02em]">Prastav</span>
        </div>
        <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-[-0.03em] leading-tight mb-4">We&apos;ll be right back</h1>
        <p className="text-[15.5px] text-muted leading-relaxed mb-2">
          Prastav is undergoing a short upgrade to serve you better. Please check back shortly.
        </p>
        <p className="text-[15.5px] text-muted leading-relaxed" lang="hi">
          Prastav को बेहतर बनाने के लिए थोड़ी देर का अपग्रेड चल रहा है। कृपया कुछ देर बाद फिर देखें।
        </p>
        <div className="mt-10 text-[13px] text-muted">
          <Link href="/login" className="underline font-semibold text-ink">Admin sign in</Link>
        </div>
      </div>
    </main>
  );
}
