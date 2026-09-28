const { chromium } = require("playwright");
const { renderProposalHTML } = require("./lib/proposal-template");

const english = {
  title: "Strengthening Women's Livelihoods and Household Nutrition in Arki Block",
  subtitle: "An integrated economic empowerment and maternal-child nutrition initiative",
  geography: "Arki Block, Khunti District, Jharkhand", duration: "24 months", budget: "INR 60,00,000",
  submittedTo: "Grameen Vikas Foundation", submittedBy: "Prakash Kumar",
  orgName: "EcoKheti Foundation", orgAddress: "Ranchi, Jharkhand", orgContact: "contact@example.org",
  problem: "Scheduled Tribe women of reproductive age in the landless households of Arki block face two intertwined challenges: economic vulnerability and a heavy burden of maternal and child undernutrition. Together these hold households within a cycle of poverty and poor health.\n\nThese women depend on rain-fed agriculture and forest produce, own little land, and have no stable off-farm income. A majority of pregnant women are anaemic, and child stunting ranks among the highest in the country.",
  objective: "To strengthen the economic independence of 800 Scheduled Tribe women in Arki block while improving the maternal and child nutrition of their households over 24 months.",
  matrix: { rows: [
    { level:"Impact", statement:"Reduced poverty and malnutrition among ST households", indicator:"Under-5 stunting prevalence", baseline:"39.6% (NFHS-5)", target:"Below block baseline", mov:"Endline survey" },
    { level:"Outcome 1", statement:"800 women have increased incomes", indicator:"Average annual income", baseline:"To be established", target:"≥50% increase", mov:"Income survey" },
  ]},
};

const hindi = {
  title: "अर्की प्रखंड में महिलाओं की आजीविका और पोषण सुदृढ़ीकरण",
  subtitle: "अनुसूचित जनजाति की महिलाओं के लिए एकीकृत आर्थिक सशक्तिकरण एवं मातृ-शिशु पोषण पहल",
  geography: "अर्की प्रखंड, खूँटी ज़िला, झारखंड", duration: "24 माह", budget: "₹60,00,000",
  submittedTo: "ग्रामीण विकास फाउंडेशन", submittedBy: "प्रकाश कुमार",
  orgName: "इकोखेती फाउंडेशन", orgAddress: "राँची, झारखंड", orgContact: "contact@example.org",
  problem: "अर्की प्रखंड के भूमिहीन परिवारों की प्रजनन आयु वर्ग की अनुसूचित जनजाति महिलाएँ दो परस्पर जुड़ी चुनौतियों का सामना करती हैं: आर्थिक असुरक्षा और मातृ एवं शिशु कुपोषण का भारी बोझ। ये मिलकर परिवारों को गरीबी और खराब स्वास्थ्य के चक्र में बाँधे रखती हैं।\n\nये महिलाएँ वर्षा आधारित कृषि और वनोपज पर निर्भर हैं, उनके पास बहुत कम भूमि है, और कोई स्थिर गैर-कृषि आय नहीं है।",
  objective: "24 माह की अवधि में अर्की प्रखंड की 800 अनुसूचित जनजाति महिलाओं की आर्थिक स्वतंत्रता को सुदृढ़ करना तथा उनके परिवारों के मातृ एवं शिशु पोषण में सुधार लाना।",
  matrix: { rows: [
    { level:"प्रभाव", statement:"अनुसूचित जनजाति परिवारों में गरीबी और कुपोषण में कमी", indicator:"5 वर्ष से कम बच्चों में बौनापन", baseline:"39.6% (एनएफएचएस-5)", target:"प्रखंड आधार रेखा से नीचे", mov:"अंतिम सर्वेक्षण" },
    { level:"परिणाम 1", statement:"800 महिलाओं की आय में वृद्धि", indicator:"औसत वार्षिक आय", baseline:"निर्धारित किया जाना है", target:"≥50% वृद्धि", mov:"आय सर्वेक्षण" },
  ]},
};

const variants = [
  { file:"font-serif-classic-normal.pdf", data:english, opts:{ template:"institutional", font:"serif-classic", size:"normal" } },
  { file:"font-sans-noto-normal.pdf",     data:english, opts:{ template:"contemporary", font:"sans-noto", size:"normal" } },
  { file:"font-serif-noto-large.pdf",     data:english, opts:{ template:"institutional", font:"serif-noto", size:"large" } },
  { file:"font-serif-noto-small.pdf",     data:english, opts:{ template:"institutional", font:"serif-noto", size:"small" } },
  { file:"HINDI-serif-noto.pdf",          data:hindi,   opts:{ template:"institutional", font:"serif-noto", size:"normal" } },
  { file:"HINDI-sans-noto.pdf",           data:hindi,   opts:{ template:"contemporary", font:"sans-noto", size:"normal" } },
];

(async () => {
  const browser = await chromium.launch();
  for (const v of variants) {
    const html = renderProposalHTML(v.data, v.opts);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({ path: v.file, format: "A4", printBackground: true });
    await page.close();
    console.log("Wrote", v.file);
  }
  await browser.close();
  console.log("Done.");
})();
