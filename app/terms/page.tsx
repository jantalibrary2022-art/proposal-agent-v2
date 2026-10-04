import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = { title: "Terms of Service · Prastav" };

const EFFECTIVE_HI = "3 अक्टूबर 2026";
const EFFECTIVE = "3 October 2026";

const SECTIONS_EN: { h: string; body: string[] }[] = [
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
      "Unpaid drafts: you may hold up to 2 unpaid drafts at a time, each counted for 7 days from creation, including drafts you delete. An unpaid draft stays open for 7 days; it is then locked as expired, can be restored by paying within the following 30 days, and is then permanently deleted. If a draft expires unpaid, new proposals must be paid for before generation until you next pay for a proposal. Drafts that fail to generate because of a fault on our side do not count, and an upfront payment for a proposal that fails is kept as credit for your next proposal or refunded on request. Full details are on prastav.app/pricing.",
      "Offers: Prastav may run automatic offers, such as founding member pricing, shown on prastav.app/pricing with their conditions and limits, and applied at payment without a code. Only one discount applies per proposal; where more than one is available, the larger applies. Offers may be changed or ended at any time without affecting payments already made.",
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

const SECTIONS_HI: { h: string; body: string[] }[] = [
  {
    h: "इन शर्तों के बारे में",
    body: [
      "Prastav एक AI वर्कबेंच है जो विकास क्षेत्र की संस्थाओं को परियोजना प्रस्ताव तैयार करने में मदद करता है, जिसका संचालन प्रकाश कुमार, रांची, झारखंड, भारत द्वारा किया जाता है (\"Prastav\", \"हम\")। खाता बनाकर या सेवा का उपयोग करके आप इन शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो सेवा का उपयोग न करें।",
    ],
  },
  {
    h: "Prastav क्या करता है",
    body: [
      "Prastav आपकी दी गई जानकारी और उद्धृत सार्वजनिक स्रोतों के आधार पर, AI की मदद से परियोजना प्रस्ताव का ड्राफ़्ट बनाने, उसे सुधारने और फ़ॉर्मेट करने में आपकी सहायता करता है। यह आपके काम में मदद करने वाला एक साधन है। प्रस्ताव के लेखक आप ही रहते हैं, और किसी दानदाता या तीसरे पक्ष को जमा करने से पहले हर चीज़ की समीक्षा, संपादन और पुष्टि करने की ज़िम्मेदारी आपकी है।",
    ],
  },
  {
    h: "आपका खाता",
    body: [
      "आपको सही जानकारी देनी होगी, अपने लॉगिन विवरण सुरक्षित रखने होंगे, और अपने खाते से होने वाली गतिविधि की ज़िम्मेदारी आपकी है। यदि आपको लगे कि आपके खाते का आपकी अनुमति के बिना उपयोग हुआ है, तो तुरंत hello@prastav.app पर बताएँ।",
    ],
  },
  {
    h: "स्वीकार्य उपयोग",
    body: [
      "आप सहमत हैं कि आप Prastav का उपयोग किसी गैरकानूनी काम के लिए नहीं करेंगे, ऐसी सामग्री अपलोड नहीं करेंगे जिसके उपयोग का आपको अधिकार न हो, बिना वैध आधार के व्यक्तियों का व्यक्तिगत या संवेदनशील डेटा जमा नहीं करेंगे, और सेवा को बाधित करने, उस पर अत्यधिक भार डालने, उसकी रिवर्स-इंजीनियरिंग करने या उस तक अनधिकृत पहुँच पाने का प्रयास नहीं करेंगे। आपके द्वारा जमा की गई और तैयार की गई सामग्री की ज़िम्मेदारी आपकी है।",
    ],
  },
  {
    h: "आपकी सामग्री और तैयार किया गया आउटपुट",
    body: [
      "आपकी दी गई जानकारी आपकी ही रहती है। जहाँ लागू हो, भुगतान के अधीन, आपके लिए तैयार किया गया प्रस्ताव आपके अपने उद्देश्यों के लिए उपयोग करने हेतु आपका है।",
      "AI द्वारा तैयार पाठ में त्रुटियाँ, चूक या ऐसे आँकड़े हो सकते हैं जिनकी जाँच आवश्यक हो। Prastav स्रोतों का हवाला देने और बिना पुष्टि वाले आँकड़ों को चिह्नित करने का प्रयास करता है, पर सटीकता या पूर्णता की गारंटी नहीं देता। आउटपुट पर निर्भर होने या उसे जमा करने से पहले आपको सभी तथ्यों, आँकड़ों और दावों सहित उसकी समीक्षा और पुष्टि करनी होगी। Prastav इस बात की गारंटी नहीं देता कि कोई प्रस्ताव अनुदान प्राप्त करेगा, और इसका कोई भी आउटपुट कानूनी, वित्तीय या पेशेवर सलाह नहीं है।",
    ],
  },
  {
    h: "शुल्क और भुगतान",
    body: [
      "जहाँ सेवा सशुल्क है, वहाँ ख़रीदने से पहले शुल्क दिखाया जाता है, और भुगतान सफल होने पर पूरा प्रस्ताव डाउनलोड के लिए उपलब्ध कराया जाता है। छूट और एक्सेस कोड, जहाँ दिए जाएँ, उस समय बताई गई शर्तों के अनुसार लागू होते हैं। कोई भी कर, जहाँ लागू हो, दिखाए गए अनुसार होता है। रिफ़ंड, रद्दीकरण और डिलीवरी हमारी रिफ़ंड, रद्दीकरण और डिलीवरी नीति (prastav.app/refunds) के अंतर्गत आते हैं। यदि आपको लगे कि आपसे गलती से शुल्क लिया गया है, तो hello@prastav.app पर संपर्क करें, हम इसकी जाँच करेंगे।",
      "बिना भुगतान वाले ड्राफ़्ट: एक समय में अधिकतम 2 बिना भुगतान वाले ड्राफ़्ट रखे जा सकते हैं, हर एक बनाए जाने के 7 दिन तक गिना जाता है, हटाए गए ड्राफ़्ट भी। बिना भुगतान वाला ड्राफ़्ट 7 दिन तक खुला रहता है; फिर वह समाप्त मानकर लॉक हो जाता है, अगले 30 दिनों में भुगतान करके बहाल किया जा सकता है, और उसके बाद स्थायी रूप से हटा दिया जाता है। यदि कोई ड्राफ़्ट बिना भुगतान के समाप्त होता है, तो अगली बार किसी प्रस्ताव का भुगतान करने तक नए प्रस्तावों का भुगतान बनना शुरू होने से पहले करना होगा। हमारी ओर की खराबी से न बन पाने वाले ड्राफ़्ट नहीं गिने जाते, और असफल प्रस्ताव के लिए किया गया अग्रिम भुगतान आपके अगले प्रस्ताव के लिए क्रेडिट के रूप में रखा जाता है या अनुरोध पर लौटाया जाता है। पूरा विवरण prastav.app/pricing पर है।",
      "ऑफ़र: Prastav समय-समय पर अपने आप लागू होने वाले ऑफ़र चला सकता है, जैसे संस्थापक सदस्य मूल्य, जो अपनी शर्तों और सीमाओं के साथ prastav.app/pricing पर दिखाए जाते हैं और भुगतान के समय बिना कोड के लागू होते हैं। प्रति प्रस्ताव केवल एक छूट लागू होती है; एक से अधिक उपलब्ध होने पर बड़ी छूट लागू होगी। ऑफ़र कभी भी बदले या समाप्त किए जा सकते हैं, इससे पहले किए गए भुगतानों पर कोई असर नहीं पड़ता।",
    ],
  },
  {
    h: "उपलब्धता",
    body: [
      "सेवा \"जैसी है\" और \"जब उपलब्ध हो\" के आधार पर दी जाती है। हम इसे चालू रखने और बेहतर बनाने का प्रयास करते हैं, पर यह वादा नहीं करते कि यह बिना रुकावट या बिना त्रुटि के चलेगी, और हम सुविधाओं को बदल या निलंबित कर सकते हैं।",
    ],
  },
  {
    h: "दायित्व की सीमा",
    body: [
      "कानून द्वारा अनुमत सीमा तक, Prastav और इसके संचालक अप्रत्यक्ष या परिणामी हानि के लिए, या आउटपुट के आधार पर आपके द्वारा लिए गए निर्णयों के लिए उत्तरदायी नहीं हैं। सेवा से संबंधित किसी भी दावे के लिए हमारा कुल दायित्व संबंधित प्रस्ताव के लिए आपके द्वारा चुकाई गई राशि तक सीमित है।",
    ],
  },
  {
    h: "बौद्धिक संपदा",
    body: [
      "Prastav प्लेटफ़ॉर्म, इसका सॉफ़्टवेयर, डिज़ाइन और ब्रांड इसके संचालक के हैं। ये शर्तें प्लेटफ़ॉर्म में कोई अधिकार आपको हस्तांतरित नहीं करतीं। आपकी अपनी सामग्री और आपके लिए तैयार किए गए प्रस्ताव, ऊपर बताए अनुसार, आपके ही रहते हैं।",
    ],
  },
  {
    h: "निलंबन और समाप्ति",
    body: [
      "जो खाता इन शर्तों का उल्लंघन करे या सेवा का ऐसा उपयोग करे जिससे दूसरों या सेवा को नुकसान हो, उसे हम निलंबित या बंद कर सकते हैं। आप कभी भी Prastav का उपयोग बंद कर सकते हैं और हमसे अपना खाता और डेटा हटाने का अनुरोध कर सकते हैं।",
    ],
  },
  {
    h: "इन शर्तों में बदलाव",
    body: [
      "सेवा के विकास के साथ हम इन शर्तों को अपडेट कर सकते हैं। ऐसा होने पर हम प्रभावी तिथि बदल देंगे और, जहाँ उचित हो, आपको सूचित करेंगे। बदलाव के बाद उपयोग जारी रखने का अर्थ है कि आप अपडेट की गई शर्तें स्वीकार करते हैं।",
    ],
  },
  {
    h: "लागू कानून",
    body: [
      "ये शर्तें भारत के कानूनों द्वारा शासित हैं, और रांची, झारखंड के न्यायालयों को क्षेत्राधिकार प्राप्त है, लागू उपभोक्ता कानून के तहत आपके किसी भी अधिकार के अधीन।",
    ],
  },
  {
    h: "संपर्क",
    body: [
      "इन शर्तों के बारे में प्रश्न: प्रकाश कुमार, Prastav — hello@prastav.app।",
    ],
  },
];

export default async function TermsPage() {
  const { locale, t } = await getDict();
  const hi = locale === "hi";
  const SECTIONS = hi ? SECTIONS_HI : SECTIONS_EN;
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-2">{hi ? "सेवा की शर्तें" : "Terms of Service"}</h1>
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
