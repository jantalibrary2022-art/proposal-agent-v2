import Link from "next/link";

const LANGS: [string, string, boolean][] = [
  ["English", "ENGLISH", true],
  ["हिन्दी", "HINDI", false],
  ["বাংলা", "BENGALI", false],
  ["मराठी", "MARATHI", false],
  ["తెలుగు", "TELUGU", false],
  ["தமிழ்", "TAMIL", false],
  ["ગુજરાતી", "GUJARATI", false],
  ["ಕನ್ನಡ", "KANNADA", false],
  ["ଓଡ଼ିଆ", "ODIA", false],
  ["ਪੰਜਾਬੀ", "PUNJABI", false],
  ["اردو", "URDU", false],
  ["অসমীয়া", "ASSAMESE", false],
];

export default function Language() {
  return (
    <main className="min-h-screen flex flex-col px-6 sm:px-12 lg:px-16 py-10">
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-10">
          <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[20px] tracking-[-0.02em]">Prastav</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <div className="text-[12px] tracking-[0.12em] mb-4">WELCOME · स्वागत है</div>
            <h1 className="font-extrabold text-[clamp(30px,6vw,44px)] tracking-[-0.03em] leading-none">Choose your language</h1>
            <div className="text-[22px] text-muted mt-1.5">अपनी भाषा चुनें</div>
          </div>
          <div className="text-[12px] tracking-[0.05em] text-muted pb-1.5">STEP 1 OF 2 · CHANGE ANYTIME</div>
        </div>

        <div className="h-[1.5px] bg-ink my-7" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {LANGS.map(([native, name, selected]) => (
            <div
              key={name}
              className={
                selected
                  ? "relative bg-[#E3E2DC] border-[1.5px] border-ink rounded-md px-5 pt-5 pb-4"
                  : "relative bg-card border border-line rounded-md px-5 pt-5 pb-4"
              }
            >
              {selected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ink flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              )}
              <div className="text-[26px] font-bold leading-tight">{native}</div>
              <div className="text-[11px] tracking-wide text-muted mt-2">{name}</div>
            </div>
          ))}
        </div>

        <div className="flex-1" />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 mt-8">
          <span className="text-[14px] text-muted">The whole app, and every proposal, is produced in the language you choose.</span>
          <Link href="/signup" className="bg-ink text-paper text-[15.5px] font-semibold px-8 py-3.5 rounded flex items-center gap-2.5">
            Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
