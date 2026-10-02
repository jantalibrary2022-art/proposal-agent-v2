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
          <a href="#how" className="hidden sm:inline text-[11.5px] tracking-wide text-muted">METHOD</a>
          <a href="#pricing" className="hidden sm:inline text-[11.5px] tracking-wide text-muted">PRICING</a>
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
      <section className="relative mx-4 sm:mx-8 my-7 min-h-[540px] lg:min-h-[600px] rounded-[18px] bg-panel overflow-hidden">
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
          <a href="#how" className="text-[13px] sm:text-[13.5px] font-medium text-white/85 px-3 sm:px-3.5 py-2">How it works</a>
          <a href="#pricing" className="text-[13px] sm:text-[13.5px] font-medium text-white/85 px-3 sm:px-3.5 py-2">Pricing</a>
          <Link href="/language" className="text-[13px] sm:text-[13.5px] font-semibold text-panel bg-paper px-4 sm:px-[18px] py-2 rounded-full">Start free</Link>
        </div>
      </section>

      {/* Why not a chatbot */}
      <section className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-20 sm:py-28">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">WHY NOT JUST A CHATBOT</div>
        <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">A general chatbot will invent a figure to fill a gap. A donor will notice.</h2>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[720px]">Prastav is built the other way round. It cites only authoritative sources, fetches the current figure and attributes it, and where no sound source has the number, it flags the gap for you to fill rather than guessing. Every statistic in your proposal is one you can stand behind.</p>
        <div className="mt-11 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            ["Grounded evidence", "Figures come from Census, NFHS, NSS, government portals and recognised institutions, with the source attached so you can verify every number."],
            ["Honest gaps", "Where no authoritative source has a figure, Prastav names the gap and the source that would hold it, instead of filling it with something a reviewer can puncture."],
            ["Expert vetting", "You review and edit every section before it goes out. The tool drafts to a practitioner's standard; your judgment is the final check."],
          ].map(([t, d]) => (
            <div key={t} className="bg-card border border-line rounded-lg p-6">
              <div className="text-[16px] font-bold mb-2">{t}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The practitioner */}
      <section className="bg-panel text-paper">
        <div className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-20 sm:py-28">
          <div className="text-[12px] tracking-[0.1em] text-white/45 mb-8">THE PRACTITIONER BEHIND IT</div>
          <div className="flex flex-col md:flex-row gap-10 md:gap-14 md:items-start">
            <div className="shrink-0 md:w-[260px]">
              <img src="/prakash-kumar.jpg" alt="Prakash Kumar" className="w-[190px] md:w-full aspect-[4/5] object-cover object-top rounded-xl grayscale" />
              <div className="mt-4">
                <div className="text-[17px] font-bold tracking-[-0.02em]">Prakash Kumar</div>
                <div className="text-[13.5px] text-white/55 mt-0.5 leading-snug">Founder, Prastav. Independent development-sector consultant.</div>
              </div>
            </div>
            <div className="min-w-0 flex-grow">
              <h2 className="font-extrabold text-[clamp(26px,4.3vw,40px)] tracking-[-0.03em] leading-[1.06] max-w-[620px]">Built on 24 years of practice.</h2>
              <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-white/75 max-w-[620px]">Prastav applies the judgment of a practitioner who has spent 24 years in the development sector, across health, gender, child protection and livelihoods. His work centres on research studies, programme design, and building the capacity of the teams that run them, the same discipline the tool brings to your proposal.</p>
              <p className="mt-4 text-[16px] leading-relaxed text-white/60 max-w-[620px]">A registered social auditor, he is often the person organisations bring in to get the evidence and the method right. That is the standard every draft is held to here.</p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-3 text-[13.5px]">
                <span className="text-white/70"><span className="text-white/40">Education&nbsp;&nbsp;</span>XISS, Ranchi — PGDRD</span>
                <span className="text-white/70"><span className="text-white/40">Accreditation&nbsp;&nbsp;</span>Registered Social Auditor, ISAI (SA-654)</span>
                <span className="text-white/70"><span className="text-white/40">Specialism&nbsp;&nbsp;</span>Research &amp; capacity building</span>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-9 border-t border-white/12">
            <div className="text-[12px] tracking-[0.1em] text-white/45 mb-6">A SELECTION OF ORGANISATIONS HE HAS WORKED WITH</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
              <div>
                <div className="text-[11px] tracking-[0.08em] text-white/35 mb-3">MULTILATERAL &amp; INTERNATIONAL</div>
                <div className="flex flex-col gap-1.5 text-[15px] font-semibold text-white/85">
                  <span>World Bank</span><span>UNICEF</span><span>Save the Children</span><span>HelpAge India</span><span>Research Triangle Institute</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.08em] text-white/35 mb-3">GOVERNMENT MISSIONS</div>
                <div className="flex flex-col gap-1.5 text-[15px] font-semibold text-white/85">
                  <span>NRLM</span><span>BRLPS</span><span>JSLPS</span><span>SHSRC Chhattisgarh</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.08em] text-white/35 mb-3">CORPORATE &amp; ADVISORY</div>
                <div className="flex flex-col gap-1.5 text-[15px] font-semibold text-white/85">
                  <span>Marico</span><span>Welspun</span><span>Protiviti</span><span>OakNorth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three ways in */}
      <section id="how" className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-20 sm:py-28 scroll-mt-16">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">HOW IT WORKS</div>
        <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">Three ways in. One rigorous proposal out.</h2>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[720px]">However you arrive, Prastav reads what you give it, asks only what it still needs, researches the evidence, and builds a complete proposal you review section by section.</p>
        <div className="mt-11 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            ["Start from your idea", "Describe your project, or let Prastav suggest approaches grounded in your organisation's work. Attach a baseline study and it builds on your own data."],
            ["Respond to an RFP", "Paste the donor's call. Prastav reads it, checks your eligibility, follows the prescribed format, and asks only what the RFP leaves open."],
            ["Improve a draft", "Upload a proposal you have already written. Prastav diagnoses it against a fundable standard, corrects weak evidence, and rebuilds a stronger version."],
          ].map(([t, d], i) => (
            <div key={t} className="bg-card border border-line rounded-lg p-6">
              <div className="text-[12px] tracking-[0.1em] text-muted mb-3">0{i + 1}</div>
              <div className="text-[17px] font-bold mb-2">{t}</div>
              <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The standard */}
      <section className="bg-faint border-y border-line">
        <div className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-20 sm:py-28">
          <div className="text-[12px] tracking-[0.1em] text-muted mb-4">THE STANDARD IT BUILDS TO</div>
          <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">What makes a proposal fundable, built in by default.</h2>
          <div className="mt-11 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7 max-w-[900px]">
            {[
              ["A clear theory of change", "Problem, what must change, objective, results, activities, each following from the last, stated explicitly."],
              ["A real logframe", "Every result with an indicator, a baseline, a target and a means of verification, outcomes kept distinct from outputs."],
              ["Evidence-based problem analysis", "Authoritative national data and the specific local situation, not national figures standing in for the district."],
              ["A defensible budget", "Line items tied to activities, rates sourced where they exist and clearly flagged where they are estimates."],
              ["Risks and assumptions", "Made explicit, each with a likelihood, an impact and a concrete mitigation."],
              ["Three formats, submission-grade", "A professionally formatted PDF, an editable Word document, and a live Excel budget, in English or Hindi."],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-3.5">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-ink shrink-0" />
                <div>
                  <div className="text-[16px] font-bold mb-1">{t}</div>
                  <div className="text-[14.5px] leading-relaxed text-[#4A4A42]">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-20 sm:py-28 scroll-mt-16">
        <div className="text-[12px] tracking-[0.1em] text-muted mb-4">PRICING</div>
        <h2 className="font-extrabold text-[clamp(27px,4.5vw,42px)] tracking-[-0.03em] leading-[1.06] max-w-[760px]">One fee per proposal. The document is professional either way.</h2>
        <p className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-[#3A3A31] max-w-[720px]">Every proposal, at every price, comes out as a properly formatted, submission-grade document. What you pay more for is sharper writing, not basic presentation.</p>
        <div className="mt-11 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[820px]">
          <div className="bg-card border border-line rounded-lg p-7">
            <div className="text-[12px] tracking-[0.1em] text-muted mb-3">BASE</div>
            <div className="flex items-baseline gap-1.5 mb-1"><span className="text-[34px] font-extrabold tracking-[-0.03em]">₹6,999</span><span className="text-[14px] text-muted">per proposal</span></div>
            <div className="text-[14.5px] leading-relaxed text-[#4A4A42] mt-3">The full method, grounded research, a complete proposal in three formats, reviewed section by section. Discounts for grassroots organisations and in bulk.</div>
          </div>
          <div className="bg-panel text-paper rounded-lg p-7">
            <div className="text-[12px] tracking-[0.1em] text-white/45 mb-3">FULL POLISH · ADD-ON</div>
            <div className="flex items-baseline gap-1.5 mb-1"><span className="text-[34px] font-extrabold tracking-[-0.03em]">+₹500</span><span className="text-[14px] text-white/55">per proposal</span></div>
            <div className="text-[14.5px] leading-relaxed text-white/70 mt-3">The whole proposal re-composed in one pass for a sharper argument and a stronger, more persuasive voice. A difference in the writing, not the formatting.</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-panel text-paper">
        <div className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-20 sm:py-28 text-center">
          <h2 className="font-extrabold text-[clamp(30px,5vw,48px)] tracking-[-0.03em] leading-[1.03] max-w-[720px] mx-auto">Write your next proposal on 24 years of practice.</h2>
          <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/language" className="bg-paper text-panel text-[15px] font-semibold px-7 py-3.5 rounded-[4px]">Start free</Link>
            <a href="#how" className="border border-white/25 text-paper text-[15px] font-semibold px-7 py-3.5 rounded-[4px]">See how it works</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="px-5 sm:px-8 w-full max-w-[1100px] mx-auto py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-[3px] bg-ink text-paper font-extrabold text-[14px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[16px] tracking-[-0.02em]">Prastav</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-muted">
            <a href="#how">Method</a>
            <a href="#pricing">Pricing</a>
            <Link href="/dashboard">Sign in</Link>
          </div>
          <div className="text-[12.5px] text-muted">An AI workbench for the development sector.</div>
        </div>
      </footer>
    </main>
  );
}
