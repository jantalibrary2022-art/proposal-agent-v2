import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = { title: "Refund, Cancellation & Delivery · Prastav" };

// English for now; a vetted Hindi version is pending.
const EFFECTIVE = "3 October 2026";

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "What you pay for",
    body: [
      "Prastav charges a one-time fee per proposal, shown before you pay. You can generate and review a draft at no charge. Payment is taken only when you choose \"Pay & finalise\" to unlock the full proposal and its files. There are no subscriptions or recurring charges.",
    ],
  },
  {
    h: "Delivery",
    body: [
      "Prastav is a fully digital service. There is no physical shipping. As soon as your payment succeeds, your proposal is finalised and the PDF, Word and Excel files become available to download from the proposal page and from your dashboard, usually within a few minutes.",
      "If your files are not available within 30 minutes of a successful payment, write to hello@prastav.app with your invoice number and we will resolve it.",
    ],
  },
  {
    h: "Cancellation",
    body: [
      "Since nothing is charged until you choose to pay, you can stop at any point before payment without any cost. Once a payment has succeeded and the proposal is finalised, the order cannot be cancelled, as the digital deliverable has already been provided.",
    ],
  },
  {
    h: "Refunds",
    body: [
      "We will refund the full amount if: you were charged but the proposal could not be delivered because of a technical failure on our side; or you were charged more than once, or charged in error, for the same proposal.",
      "Because the proposal is a digital product delivered instantly, we do not offer refunds once it has been finalised and the files have been made available for download, except in the cases above.",
      "Approved refunds are made to the original payment method within 5 to 7 working days. The time for the amount to reflect in your account depends on your bank or card issuer.",
    ],
  },
  {
    h: "How to request a refund",
    body: [
      "Email hello@prastav.app with your invoice number (shown on the Purchases page) and a short description of the issue. We aim to respond within 2 working days.",
    ],
  },
  {
    h: "Contact",
    body: [
      "Prakash Kumar, Prastav, Ranchi, Jharkhand, India — hello@prastav.app.",
    ],
  },
];

export default async function RefundsPage() {
  const { t } = await getDict();
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-2">Refund, Cancellation &amp; Delivery</h1>
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
