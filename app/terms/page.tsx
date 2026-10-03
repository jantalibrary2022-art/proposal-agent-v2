import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = { title: "Terms of Service · Prastav" };

// English for now; a vetted Hindi version is pending. Have this reviewed by
// someone familiar with Indian contract and consumer law before launch.
const EFFECTIVE = "3 October 2026";

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "About these terms",
    body: [
      "Prastav is an AI workbench that helps organisations in the development sector prepare project proposals, operated by Prakash Kumar, Ranchi, Jharkhand, India (\"Prastav\", \"we\", \"us\"). By creating an account or using the service, you agree to these terms. If you do not agree, do not use the service.",
    ],
  },
  {
    h: "What Prastav does",
    body: [
      "Prastav helps you draft, improve and format project proposals using AI, drawing on the information you provide and on cited public sources. It is a tool that assists your work. You remain the author of your proposal, and you are responsible for reviewing, editing and verifying everything before you submit it to any donor or third party.",
    ],
  },
  {
    h: "Your account",
    body: [
      "You must provide accurate information, keep your login credentials secure, and are responsible for activity under your account. Tell us promptly at hello@prastav.app if you believe your account has been used without your permission.",
    ],
  },
  {
    h: "Acceptable use",
    body: [
      "You agree not to use Prastav for anything unlawful, to upload content you do not have the right to use, to submit personal or sensitive data about individuals without a lawful basis, or to attempt to disrupt, overload, reverse-engineer or gain unauthorised access to the service. You are responsible for the content you submit and generate.",
    ],
  },
  {
    h: "Your content and the generated output",
    body: [
      "The inputs you provide remain yours. Subject to payment where applicable, the proposal generated for you is yours to use for your own purposes.",
      "AI-generated text can contain errors, omissions or figures that need checking. Prastav aims to cite sources and flag unverified numbers, but it does not guarantee accuracy or completeness. You must review and verify the output, including all facts, figures and claims, before relying on it or submitting it. Prastav does not guarantee that any proposal will secure funding, and nothing it produces is legal, financial or professional advice.",
    ],
  },
  {
    h: "Fees and payment",
    body: [
      "Where the service is paid, the fee is shown before you buy, and a completed proposal is made available to download once payment succeeds. Discounts and access codes, where offered, apply as stated at the time. Any taxes, where applicable, are as shown. Refunds, cancellation and delivery are covered by our Refund, Cancellation & Delivery Policy at prastav.app/refunds. If you believe you were charged in error, contact hello@prastav.app and we will look into it.",
    ],
  },
  {
    h: "Availability",
    body: [
      "The service is provided on an \"as is\" and \"as available\" basis. We work to keep it running and improving, but we do not promise it will be uninterrupted or error-free, and we may change or suspend features.",
    ],
  },
  {
    h: "Limitation of liability",
    body: [
      "To the extent permitted by law, Prastav and its operator are not liable for indirect or consequential losses, or for decisions you make based on the output. Our total liability for any claim relating to the service is limited to the amount you paid for the proposal in question.",
    ],
  },
  {
    h: "Intellectual property",
    body: [
      "The Prastav platform, its software, design and brand belong to its operator. These terms do not transfer any rights in the platform to you. Your own content and the proposals generated for you remain yours as described above.",
    ],
  },
  {
    h: "Suspension and termination",
    body: [
      "We may suspend or close an account that breaches these terms or uses the service in a way that harms others or the service. You may stop using Prastav at any time and can ask us to delete your account and data.",
    ],
  },
  {
    h: "Changes to these terms",
    body: [
      "We may update these terms as the service develops. When we do, we will change the effective date below and, where appropriate, notify you. Continued use after a change means you accept the updated terms.",
    ],
  },
  {
    h: "Governing law",
    body: [
      "These terms are governed by the laws of India, and the courts at Ranchi, Jharkhand have jurisdiction, subject to any rights you have under applicable consumer law.",
    ],
  },
  {
    h: "Contact",
    body: [
      "Questions about these terms: Prakash Kumar, Prastav — hello@prastav.app.",
    ],
  },
];

export default async function TermsPage() {
  const { t } = await getDict();
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-2">Terms of Service</h1>
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
            Questions? Write to{" "}
            <a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
