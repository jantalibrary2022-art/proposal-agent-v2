import Link from "next/link";

export const metadata = { title: "Help · Prastav" };

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does Prastav do?",
    a: "Prastav turns your project idea, a donor's RFP, or an existing draft into a complete, submission-grade proposal, with a theory of change, a logframe, an evidence-based problem analysis, a defensible budget, and risks and assumptions. You review every section before it is finalised.",
  },
  {
    q: "What are the three ways to start?",
    a: "Start from your idea (describe your project, or let Prastav suggest approaches grounded in your work); Respond to an RFP (paste the donor call and Prastav reads it, checks eligibility, follows the format, and asks only what the RFP leaves open); or Improve a draft (upload a proposal you have written and Prastav diagnoses and rebuilds a stronger version).",
  },
  {
    q: "Where do the statistics come from?",
    a: "Prastav cites authoritative sources such as Census, NFHS, NSS and government portals, and attaches the source to each figure. Where no sound source has a number, it flags the gap for you to fill rather than inventing a figure. Every statistic is one you can stand behind.",
  },
  {
    q: "Can I upload my own baseline study or data?",
    a: "Yes. When you start from an idea, you can attach a baseline study or dataset. Prastav reads it, uses it to shape the approach, and treats it as grounded, citable evidence in the proposal.",
  },
  {
    q: "What formats do I get?",
    a: "A professionally formatted PDF, an editable Word document, and a live Excel budget. You can work in English or Hindi.",
  },
  {
    q: "What does it cost?",
    a: "A single fee of ₹6,999 per proposal delivers the full method and a complete proposal in all three formats, reviewed section by section. Discounts are available for grassroots organisations and in bulk. When a proposal needs personal attention, Prakash is available to work with you directly.",
  },
  {
    q: "Where are my invoices?",
    a: "Open Account, then View purchases, or use Purchases in the top menu. Each purchase has an invoice you can view and print. Invoices are issued in Prakash Kumar's name; Prastav is the brand.",
  },
  {
    q: "How do I change my name or password?",
    a: "Open Account from the top menu or your avatar. You can update your name there, and change your password after confirming your current one. If you have forgotten your current password, use the email reset link on the login page.",
  },
  {
    q: "Something failed while my proposal was being built. What now?",
    a: "You can start again from the dashboard. Build failures are logged to us automatically, and if it happens again, email hello@prastav.app and we will help you get it sorted right away.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line bg-canvas">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/contact" className="text-[13px] tracking-wide text-muted">CONTACT</Link>
          <Link href="/dashboard" className="text-[14.5px] text-muted">Dashboard</Link>
        </div>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-3">Help</h1>
          <p className="text-[17px] text-muted leading-relaxed mb-10">
            Answers to the common questions. If you do not find what you need, <Link href="/contact" className="font-semibold text-ink underline">get in touch</Link> and we will help.
          </p>

          <div className="flex flex-col divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <div key={f.q} className="py-6">
                <h2 className="text-[18px] font-bold tracking-[-0.01em] mb-2">{f.q}</h2>
                <p className="text-[15.5px] leading-relaxed text-[#3A3A31]">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-panel text-paper rounded-lg p-7">
            <h2 className="text-[20px] font-bold tracking-[-0.01em] mb-2">Still stuck?</h2>
            <p className="text-[15px] leading-relaxed text-white/70 mb-5">Write to us and we will get back to you, or email hello@prastav.app directly.</p>
            <Link href="/contact" className="inline-block bg-paper text-panel text-[15px] font-semibold px-6 py-3 rounded-[4px]">Contact us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
