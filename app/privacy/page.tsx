import Link from "next/link";
import { getDict } from "../../lib/i18n";

export const metadata = { title: "Privacy Policy · Prastav" };

// Legal text is kept in English for now; a vetted Hindi version is pending
// (all Hindi on the site is reviewed by a fluent person before launch).
const EFFECTIVE = "2 October 2026";

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "Who we are",
    body: [
      "Prastav is an AI workbench that helps organisations in the development sector prepare project proposals. Prastav is operated by Prakash Kumar, an independent development-sector consultant based in Ranchi, Jharkhand, India (\"Prastav\", \"we\", \"us\").",
      "For any privacy question or request, contact us at hello@prastav.app.",
    ],
  },
  {
    h: "What we collect",
    body: [
      "Account details you give us: your name and email address, and the password you set (stored in hashed form by our authentication provider).",
      "Organisation profiles you create: the organisation details, experience and documents you choose to add.",
      "Proposal content: the ideas, RFPs, drafts, answers and files you submit, and the proposals generated from them.",
      "Payment details: when you pay, the transaction is handled by our payment provider. We receive a record of the payment but do not store your full card or bank details.",
      "Usage data: basic analytics such as page visits, and any feedback or messages you send us.",
    ],
  },
  {
    h: "How we use your information",
    body: [
      "To provide the service: to run the proposal workflow, generate your documents and let you review, revise and download them.",
      "Expert review and quality: Prastav, including Prakash Kumar, may access the proposals and inputs you create in order to deliver, review, support and improve the service. Expert review of output is a core part of what Prastav offers.",
      "Billing: to process payments, issue invoices and keep purchase records.",
      "Improvement and support: to understand problems, fix errors and improve the product, and to respond to you.",
    ],
  },
  {
    h: "AI processing",
    body: [
      "Your inputs and the proposals you generate are processed by our AI provider (Anthropic) to produce your proposal. This content is used to generate your output and is not used to train AI models.",
    ],
  },
  {
    h: "How we share information",
    body: [
      "We do not sell your personal data, and we do not share your proposals with other users.",
      "We use trusted providers who process data on our behalf: Supabase (hosting, database and file storage), Anthropic (AI processing) and our payment provider (payments). They may process data only to provide these services to us.",
      "We may disclose information if required by law, regulation or valid legal process, or to protect our rights and the safety of users.",
    ],
  },
  {
    h: "Where your data is processed",
    body: [
      "Prastav is available globally, and our hosting and AI providers may process data on servers outside your country, including outside India. Where that happens, we rely on these providers' contractual and technical safeguards.",
    ],
  },
  {
    h: "How long we keep it",
    body: [
      "We keep your account and content for as long as your account is active or as needed to provide the service and meet legal and accounting obligations. You can delete individual proposals, and you can ask us to delete your account and associated data.",
    ],
  },
  {
    h: "Your rights",
    body: [
      "Subject to applicable law, including India's Digital Personal Data Protection Act, 2023 and the EU GDPR where it applies, you may request access to your personal data, correction of it, or its deletion, and you may withdraw consent you have given. To exercise any of these, or to raise a grievance, contact hello@prastav.app and we will respond within the time the law requires.",
    ],
  },
  {
    h: "Your responsibilities",
    body: [
      "Please do not upload personal or sensitive information about identifiable individuals (for example, named beneficiaries) unless it is necessary for your proposal and you have the right to share it. You are responsible for the content you submit and for ensuring you may lawfully use it.",
    ],
  },
  {
    h: "Security",
    body: [
      "We protect your data with access controls (including database row-level security so users reach only their own records) and encryption in transit. No method of storage or transmission is perfectly secure, but we work to protect your information and to address issues promptly.",
    ],
  },
  {
    h: "Children",
    body: [
      "Prastav is intended for organisations and for adults acting on their behalf. It is not directed at children under 18.",
    ],
  },
  {
    h: "Changes to this policy",
    body: [
      "We may update this policy as the service develops. When we do, we will change the effective date below and, where appropriate, tell you.",
    ],
  },
  {
    h: "Contact",
    body: [
      "Grievances and privacy requests: Prakash Kumar, Prastav — hello@prastav.app.",
    ],
  },
];

export default async function PrivacyPage() {
  const { t } = await getDict();
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line bg-canvas">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/contact" className="text-[13px] tracking-wide text-muted">{t.footer.contact}</Link>
          <Link href="/dashboard" className="text-[14.5px] text-muted">{t.common.dashboard}</Link>
        </div>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-2">Privacy Policy</h1>
          <p className="text-[14px] text-muted mb-10">Effective {EFFECTIVE}</p>

          <div className="flex flex-col divide-y divide-line border-y border-line">
            {SECTIONS.map((s) => (
              <section key={s.h} className="py-6">
                <h2 className="text-[18px] font-bold tracking-[-0.01em] mb-3">{s.h}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="text-[15.5px] leading-relaxed text-[#3A3A31] mb-2.5 last:mb-0">{p}</p>
                ))}
              </section>
            ))}
          </div>

          <p className="text-[13px] text-muted leading-relaxed mt-10">
            Questions about this policy? Write to{" "}
            <a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
