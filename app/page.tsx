import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-5 sm:px-8 h-[60px] border-b border-line">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-[3px] bg-ink text-paper font-extrabold text-[14px] flex items-center justify-center">प्र</span>
          <span className="font-extrabold text-[18px] tracking-[-0.02em]">Prastav</span>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline text-[11.5px] tracking-wide text-muted">METHOD</span>
          <span className="hidden sm:inline text-[11.5px] tracking-wide text-muted">PRICING</span>
          <span className="text-[11.5px] tracking-wide">EN</span>
          <Link href="/dashboard" className="hidden sm:inline text-[11.5px] tracking-wide">SIGN IN</Link>
          <Link href="/language" className="bg-ink text-paper text-[12.5px] font-semibold px-4 py-2 rounded-[3px]">Start free</Link>
        </nav>
      </header>

      {/* Meta line */}
      <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 text-center">
        <span className="text-[11px] sm:text-[12px] tracking-[0.08em] text-muted">AN AI WORKBENCH FOR THE DEVELOPMENT SECTOR</span>
        <span className="text-[10px] sm:text-[11px] tracking-[0.08em] border border-line rounded px-2 py-0.5">PROPOSALS</span>
        <span className="text-[11px] sm:text-[12px] tracking-[0.08em] text-muted">MORE SERVICES SOON</span>
      </div>

      {/* Wordmark */}
      <h1 className="text-center font-extrabold leading-[0.9] tracking-[-0.04em] mt-3 text-[clamp(64px,14vw,150px)]">Prastav</h1>

      {/* Byline */}
      <div className="mt-4 flex items-center justify-center gap-2.5 px-5 text-center">
        <span className="w-5 h-5 rounded bg-ink flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#2A2A24]">Built on 24 years of practice, multiplied by AI</span>
      </div>

      {/* Framed panel */}
      <section className="relative mx-4 sm:mx-8 my-7 flex-1 min-h-[540px] rounded-[18px] bg-panel overflow-hidden">
        <div aria-hidden className="pointer-events-none select-none absolute -bottom-10 left-0 w-full text-center font-extrabold tracking-[-0.04em] text-white/[0.04] leading-none text-[clamp(120px,22vw,210px)]">EVIDENCE</div>

        {/* Proposal specimen */}
        <div className="absolute left-1/2 -translate-x-1/2 top-12 sm:top-14 w-[300px] sm:w-[328px] bg-card rounded-md shadow-[0_30px_70px_rgba(0,0,0,0.42)] overflow-hidden text-left">
          <div className="bg-ink px-5 py-5">
            <div className="text-[9.5px] tracking-[0.15em] text-white/50">PROJECT PROPOSAL</div>
            <div className="mt-2 text-white font-bold text-[16px] leading-tight tracking-[-0.02em]">Poshan Saathi — SHG Nutrition &amp; ICDS Convergence</div>
          </div>
          <div className="px-5 py-5">
            <div className="text-[9px] tracking-[0.1em] text-muted mb-3">PROBLEM STATEMENT</div>
            <div className="h-[7px] w-[95%] bg-[#ECEAE1] rounded mb-2" />
            <div className="h-[7px] w-full bg-[#ECEAE1] rounded mb-2" />
            <div className="h-[7px] w-[74%] bg-[#ECEAE1] rounded mb-5" />
            <div className="text-[9px] tracking-[0.1em] text-muted mb-2.5">RESULTS FRAMEWORK</div>
            <div className="border border-[#E9E7DD] rounded overflow-hidden">
              <div className="flex bg-[#F5F4EF] text-[8.5px] text-muted"><div className="basis-[60px] shrink-0 px-2 py-1.5">LEVEL</div><div className="grow px-2 py-1.5">TARGET</div></div>
              <div className="flex border-t border-[#EEECE3] text-[11px]"><div className="basis-[60px] shrink-0 px-2 py-1.5 font-bold">Out.2</div><div className="grow px-2 py-1.5 text-[#3A3A31]">≥200 entitlements</div></div>
              <div className="flex border-t border-[#EEECE3] text-[11px]"><div className="basis-[60px] shrink-0 px-2 py-1.5 font-bold">Out.1</div><div className="grow px-2 py-1.5 text-[#3A3A31]">≥60% earn income</div></div>
            </div>
          </div>
        </div>

        {/* Budget chip */}
        <div className="hidden lg:block absolute top-[300px] left-[9%] w-[256px] bg-card rounded-md shadow-[0_24px_54px_rgba(0,0,0,0.4)] p-4">
          <div className="text-[9px] tracking-[0.1em] text-muted mb-3">BUDGET · UNIT COSTS</div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] text-[#3A3A31]">Project Coordinator</span>
            <span className="text-[8px] tracking-wide text-paper bg-ink px-1.5 py-0.5 rounded">SOURCED</span>
          </div>
          <div className="h-px bg-[#EEECE3] mb-2.5" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#3A3A31]">CRP honorarium</span>
            <span className="text-[8px] tracking-wide text-muted border border-line px-1.5 py-0.5 rounded">EST · FLAG</span>
          </div>
        </div>

        {/* Format tags */}
        <div className="hidden lg:flex absolute top-[150px] right-[9%] flex-col gap-2.5">
          <div className="text-[10px] tracking-[0.1em] text-panel bg-card rounded px-3.5 py-2 text-center shadow-lg">PDF</div>
          <div className="text-[10px] tracking-[0.1em] text-white/85 bg-white/[0.08] border border-white/15 rounded px-3.5 py-2 text-center">WORD</div>
          <div className="text-[10px] tracking-[0.1em] text-white/85 bg-white/[0.08] border border-white/15 rounded px-3.5 py-2 text-center">EXCEL</div>
        </div>

        {/* Pill */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 border border-white/15 rounded-full py-2 pl-3 sm:pl-4 pr-2 backdrop-blur">
          <span className="w-[22px] h-[22px] rounded-full bg-paper text-panel font-extrabold text-[12px] flex items-center justify-center mr-1">प्र</span>
          <a href="#" className="text-[13px] sm:text-[13.5px] font-medium text-white/85 px-3 sm:px-3.5 py-2">How it works</a>
          <a href="#" className="text-[13px] sm:text-[13.5px] font-medium text-white/85 px-3 sm:px-3.5 py-2">See a sample</a>
          <Link href="/language" className="text-[13px] sm:text-[13.5px] font-semibold text-panel bg-paper px-4 sm:px-[18px] py-2 rounded-full">Start free</Link>
        </div>
      </section>
    </main>
  );
}
