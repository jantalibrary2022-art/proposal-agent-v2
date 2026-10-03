import Link from "next/link";
import { getDict } from "../../lib/i18n";
import SiteHeader from "../_components/SiteHeader";

export const metadata = { title: "Privacy Policy · Prastav" };

const EFFECTIVE_HI = "3 अक्टूबर 2026";
const EFFECTIVE = "3 October 2026";

const SECTIONS_EN: { h: string; body: string[] }[] = [
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
      "We use trusted providers who process data on our behalf: Supabase (database, sign-in and file storage), Render (website hosting), Anthropic (AI processing), Razorpay (payments) and Zoho ZeptoMail (sending account and service emails, such as sign-up confirmation and proposal notifications). They may process data only to provide these services to us.",
      "Voice input is optional. When you use the Speak button, your speech is converted to text by your browser's own speech service (for example Google in Chrome, Apple in Safari, Microsoft in Edge), under that provider's terms. Prastav receives only the resulting text, never the audio.",
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

const SECTIONS_HI: { h: string; body: string[] }[] = [
  {
    h: "हम कौन हैं",
    body: [
      "Prastav एक AI वर्कबेंच है जो विकास क्षेत्र की संस्थाओं को परियोजना प्रस्ताव तैयार करने में मदद करता है। Prastav का संचालन प्रकाश कुमार करते हैं, जो रांची, झारखंड, भारत में स्थित एक स्वतंत्र विकास-क्षेत्र सलाहकार हैं (\"Prastav\", \"हम\")।",
      "गोपनीयता से जुड़े किसी भी प्रश्न या अनुरोध के लिए hello@prastav.app पर संपर्क करें।",
    ],
  },
  {
    h: "हम क्या एकत्र करते हैं",
    body: [
      "आपके द्वारा दिए गए खाते के विवरण: आपका नाम और ईमेल पता, और आपके द्वारा बनाया गया पासवर्ड (जिसे हमारा प्रमाणीकरण प्रदाता हैश रूप में संग्रहीत करता है)।",
      "आपके द्वारा बनाई गई संस्था प्रोफ़ाइल: संस्था के विवरण, अनुभव और वे दस्तावेज़ जिन्हें आप जोड़ना चुनते हैं।",
      "प्रस्ताव की सामग्री: आपके द्वारा जमा किए गए विचार, RFP, ड्राफ़्ट, उत्तर और फ़ाइलें, और उनसे तैयार किए गए प्रस्ताव।",
      "भुगतान विवरण: जब आप भुगतान करते हैं, तो लेन-देन हमारे भुगतान प्रदाता द्वारा संभाला जाता है। हमें भुगतान का रिकॉर्ड मिलता है, पर हम आपके पूरे कार्ड या बैंक विवरण संग्रहीत नहीं करते।",
      "उपयोग डेटा: पेज विज़िट जैसे बुनियादी विश्लेषण, और आपके द्वारा भेजी गई कोई भी प्रतिक्रिया या संदेश।",
    ],
  },
  {
    h: "हम आपकी जानकारी का उपयोग कैसे करते हैं",
    body: [
      "सेवा प्रदान करने के लिए: प्रस्ताव की प्रक्रिया चलाने, आपके दस्तावेज़ तैयार करने और आपको उनकी समीक्षा, संशोधन और डाउनलोड करने देने के लिए।",
      "विशेषज्ञ समीक्षा और गुणवत्ता: Prastav, जिसमें प्रकाश कुमार शामिल हैं, सेवा प्रदान करने, समीक्षा करने, सहायता देने और उसे बेहतर बनाने के लिए आपके द्वारा बनाए गए प्रस्तावों और जानकारी को देख सकता है। आउटपुट की विशेषज्ञ समीक्षा Prastav की सेवा का मूल हिस्सा है।",
      "बिलिंग: भुगतान संसाधित करने, चालान जारी करने और खरीद का रिकॉर्ड रखने के लिए।",
      "सुधार और सहायता: समस्याओं को समझने, त्रुटियाँ ठीक करने, उत्पाद को बेहतर बनाने और आपको उत्तर देने के लिए।",
    ],
  },
  {
    h: "AI प्रसंस्करण",
    body: [
      "आपका प्रस्ताव तैयार करने के लिए आपकी जानकारी और आपके द्वारा बनाए गए प्रस्ताव हमारे AI प्रदाता (Anthropic) द्वारा संसाधित किए जाते हैं। इस सामग्री का उपयोग आपका आउटपुट बनाने के लिए होता है, और इसका उपयोग AI मॉडल को प्रशिक्षित करने के लिए नहीं किया जाता।",
    ],
  },
  {
    h: "हम जानकारी कैसे साझा करते हैं",
    body: [
      "हम आपका व्यक्तिगत डेटा नहीं बेचते, और आपके प्रस्ताव अन्य उपयोगकर्ताओं के साथ साझा नहीं करते।",
      "हम विश्वसनीय प्रदाताओं का उपयोग करते हैं जो हमारी ओर से डेटा संसाधित करते हैं: Supabase (डेटाबेस, साइन-इन और फ़ाइल संग्रहण), Render (वेबसाइट होस्टिंग), Anthropic (AI प्रसंस्करण), Razorpay (भुगतान) और Zoho ZeptoMail (खाते और सेवा से जुड़े ईमेल भेजना, जैसे साइन-अप पुष्टि और प्रस्ताव सूचनाएँ)। वे डेटा को केवल हमें ये सेवाएँ देने के लिए संसाधित कर सकते हैं।",
      "आवाज़ से लिखना वैकल्पिक है। जब आप 'बोलें' बटन का उपयोग करते हैं, तो आपकी आवाज़ को आपके ब्राउज़र की अपनी स्पीच सेवा (जैसे Chrome में Google, Safari में Apple, Edge में Microsoft) उस प्रदाता की शर्तों के तहत टेक्स्ट में बदलती है। Prastav को केवल बना हुआ टेक्स्ट मिलता है, ऑडियो कभी नहीं।",
      "यदि कानून, विनियमन या वैध कानूनी प्रक्रिया के तहत आवश्यक हो, या हमारे अधिकारों और उपयोगकर्ताओं की सुरक्षा के लिए, तो हम जानकारी प्रकट कर सकते हैं।",
    ],
  },
  {
    h: "आपका डेटा कहाँ संसाधित होता है",
    body: [
      "Prastav विश्व स्तर पर उपलब्ध है, और हमारे होस्टिंग और AI प्रदाता आपके देश के बाहर, भारत के बाहर सहित, सर्वरों पर डेटा संसाधित कर सकते हैं। ऐसे में हम इन प्रदाताओं के अनुबंध-संबंधी और तकनीकी सुरक्षा उपायों पर निर्भर करते हैं।",
    ],
  },
  {
    h: "हम इसे कितने समय तक रखते हैं",
    body: [
      "जब तक आपका खाता सक्रिय है, या सेवा प्रदान करने और कानूनी व लेखा दायित्वों को पूरा करने के लिए जितना आवश्यक हो, हम आपका खाता और सामग्री रखते हैं। आप अलग-अलग प्रस्ताव हटा सकते हैं, और हमसे अपना खाता और उससे जुड़ा डेटा हटाने का अनुरोध कर सकते हैं।",
    ],
  },
  {
    h: "आपके अधिकार",
    body: [
      "लागू कानून के अधीन, जिसमें भारत का डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 और जहाँ लागू हो वहाँ EU GDPR शामिल हैं, आप अपने व्यक्तिगत डेटा तक पहुँच, उसमें सुधार या उसे हटाने का अनुरोध कर सकते हैं, और दी गई सहमति वापस ले सकते हैं। इनमें से किसी के लिए, या शिकायत दर्ज करने के लिए, hello@prastav.app पर संपर्क करें; हम कानून द्वारा निर्धारित समय के भीतर उत्तर देंगे।",
    ],
  },
  {
    h: "आपकी ज़िम्मेदारियाँ",
    body: [
      "कृपया पहचाने जा सकने वाले व्यक्तियों (जैसे नामित लाभार्थियों) के बारे में व्यक्तिगत या संवेदनशील जानकारी तब तक अपलोड न करें जब तक वह आपके प्रस्ताव के लिए आवश्यक न हो और आपको उसे साझा करने का अधिकार न हो। आपके द्वारा जमा की गई सामग्री और उसके वैध उपयोग की ज़िम्मेदारी आपकी है।",
    ],
  },
  {
    h: "सुरक्षा",
    body: [
      "हम पहुँच नियंत्रण (जिसमें डेटाबेस की row-level सुरक्षा शामिल है, ताकि उपयोगकर्ता केवल अपने रिकॉर्ड तक पहुँचें) और डेटा भेजते समय एन्क्रिप्शन से आपके डेटा की रक्षा करते हैं। संग्रहण या प्रेषण का कोई भी तरीका पूरी तरह सुरक्षित नहीं होता, पर हम आपकी जानकारी की रक्षा करने और समस्याओं को तुरंत दूर करने के लिए काम करते हैं।",
    ],
  },
  {
    h: "बच्चे",
    body: [
      "Prastav संस्थाओं और उनकी ओर से कार्य करने वाले वयस्कों के लिए है। यह 18 वर्ष से कम आयु के बच्चों के लिए नहीं है।",
    ],
  },
  {
    h: "इस नीति में बदलाव",
    body: [
      "सेवा के विकास के साथ हम इस नीति को अपडेट कर सकते हैं। ऐसा होने पर हम प्रभावी तिथि बदल देंगे और, जहाँ उचित हो, आपको सूचित करेंगे।",
    ],
  },
  {
    h: "संपर्क",
    body: [
      "शिकायतें और गोपनीयता अनुरोध: प्रकाश कुमार, Prastav — hello@prastav.app।",
    ],
  },
];

export default async function PrivacyPage() {
  const { locale, t } = await getDict();
  const hi = locale === "hi";
  const SECTIONS = hi ? SECTIONS_HI : SECTIONS_EN;
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-grow px-6 sm:px-11 py-14 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(28px,5vw,40px)] tracking-[-0.02em] leading-[1.08] mb-2">{hi ? "गोपनीयता नीति" : "Privacy Policy"}</h1>
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
