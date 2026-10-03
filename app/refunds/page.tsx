import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = { title: "Refund, Cancellation & Delivery · Prastav" };

const EFFECTIVE_HI = "3 अक्टूबर 2026";
const EFFECTIVE = "3 October 2026";

const SECTIONS_EN: { h: string; body: string[] }[] = [
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

const SECTIONS_HI: { h: string; body: string[] }[] = [
  {
    h: "आप किसके लिए भुगतान करते हैं",
    body: [
      "Prastav प्रति प्रस्ताव एक बार का शुल्क लेता है, जो भुगतान से पहले दिखाया जाता है। आप बिना किसी शुल्क के ड्राफ़्ट तैयार कर सकते हैं और उसकी समीक्षा कर सकते हैं। भुगतान केवल तब लिया जाता है जब आप पूरा प्रस्ताव और उसकी फ़ाइलें खोलने के लिए \"भुगतान करें और अंतिम रूप दें\" चुनते हैं। कोई सदस्यता या आवर्ती शुल्क नहीं है।",
    ],
  },
  {
    h: "डिलीवरी",
    body: [
      "Prastav पूरी तरह डिजिटल सेवा है। कोई भौतिक शिपिंग नहीं होती। भुगतान सफल होते ही आपका प्रस्ताव अंतिम रूप ले लेता है और PDF, Word व Excel फ़ाइलें प्रस्ताव पेज और आपके डैशबोर्ड से डाउनलोड के लिए उपलब्ध हो जाती हैं, आमतौर पर कुछ ही मिनटों में।",
      "यदि सफल भुगतान के 30 मिनट के भीतर आपकी फ़ाइलें उपलब्ध न हों, तो अपनी चालान संख्या के साथ hello@prastav.app पर लिखें, हम इसे सुलझा देंगे।",
    ],
  },
  {
    h: "रद्दीकरण",
    body: [
      "चूँकि भुगतान चुनने तक कोई शुल्क नहीं लिया जाता, आप भुगतान से पहले किसी भी चरण पर बिना किसी लागत के रुक सकते हैं। भुगतान सफल होने और प्रस्ताव के अंतिम रूप लेने के बाद ऑर्डर रद्द नहीं किया जा सकता, क्योंकि डिजिटल डिलीवरी पहले ही की जा चुकी होती है।",
    ],
  },
  {
    h: "रिफ़ंड",
    body: [
      "हम पूरी राशि लौटाएँगे यदि: आपसे शुल्क लिया गया पर हमारी ओर की तकनीकी खराबी के कारण प्रस्ताव नहीं दिया जा सका; या उसी प्रस्ताव के लिए आपसे एक से अधिक बार या गलती से शुल्क लिया गया।",
      "चूँकि प्रस्ताव एक डिजिटल उत्पाद है जो तुरंत दिया जाता है, इसलिए अंतिम रूप लेने और फ़ाइलें डाउनलोड के लिए उपलब्ध होने के बाद, ऊपर बताई स्थितियों को छोड़कर, हम रिफ़ंड नहीं देते।",
      "स्वीकृत रिफ़ंड 5 से 7 कार्य दिवसों के भीतर मूल भुगतान माध्यम में किए जाते हैं। राशि आपके खाते में दिखने का समय आपके बैंक या कार्ड जारीकर्ता पर निर्भर करता है।",
    ],
  },
  {
    h: "रिफ़ंड का अनुरोध कैसे करें",
    body: [
      "अपनी चालान संख्या ('खरीदारी' पेज पर दिखाई गई) और समस्या के संक्षिप्त विवरण के साथ hello@prastav.app पर ईमेल करें। हम 2 कार्य दिवसों के भीतर उत्तर देने का प्रयास करते हैं।",
    ],
  },
  {
    h: "संपर्क",
    body: [
      "प्रकाश कुमार, Prastav, रांची, झारखंड, भारत — hello@prastav.app।",
    ],
  },
];

export default async function RefundsPage() {
  const { locale, t } = await getDict();
  const hi = locale === "hi";
  const SECTIONS = hi ? SECTIONS_HI : SECTIONS_EN;
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-2">{hi ? "रिफ़ंड, रद्दीकरण और डिलीवरी" : "Refund, Cancellation & Delivery"}</h1>
          <p className="text-[14px] text-muted mb-10">{hi ? "प्रभावी तिथि: " + EFFECTIVE_HI : "Effective " + EFFECTIVE}{hi && <span className="block mt-1 text-[13px]">यह अंग्रेज़ी नीति का अनुवाद है। किसी भी अंतर की स्थिति में अंग्रेज़ी संस्करण मान्य होगा।</span>}</p>

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
            {hi ? "प्रश्न हों तो लिखें: " : "Questions? Write to "}
            <a href="mailto:hello@prastav.app" className="font-semibold text-ink underline">hello@prastav.app</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
