const fs = require("fs");
const { generateDocx } = require("./lib/proposal-docx");

const english = {
  lang:"English",
  title:"Strengthening Women's Livelihoods and Household Nutrition in Arki Block",
  subtitle:"An integrated economic empowerment and maternal-child nutrition initiative",
  geography:"Arki Block, Khunti District, Jharkhand", duration:"24 months", budget:"INR 60,00,000",
  submittedTo:"Grameen Vikas Foundation", submittedBy:"Prakash Kumar",
  problem:"Scheduled Tribe women of reproductive age in the landless households of Arki block face two intertwined challenges: economic vulnerability and a heavy burden of maternal and child undernutrition. Together these hold households within a cycle of poverty and poor health.\n\nThese women depend on rain-fed agriculture and forest produce, own little land, and have no stable off-farm income. A majority of pregnant women are anaemic, and child stunting ranks among the highest in the country.",
  objective:"To strengthen the economic independence of 800 Scheduled Tribe women in Arki block while improving maternal and child nutrition over 24 months.",
  strategy:"The project adopts an integrated, community-platform approach anchored in women's Self-Help Groups, sequenced across three phases and converging with government systems including NRLM, MGNREGA, ICDS and NHM.",
  activities:"Activities are grouped by output and every activity traces to a defined result: mobilisation across 16 Gram Panchayats, SHG formation, skills training, asset support, kitchen gardens, and convergence with frontline health and nutrition services.",
  sustainability:"Sustainability rests on federated SHGs, retained access to capital, changed practices within the community, and handover to established public programmes.",
  matrix:{ rows:[
    { level:"Impact", statement:"Reduced poverty and malnutrition among ST households", indicator:"Under-5 stunting prevalence", baseline:"39.6% (NFHS-5)", target:"Below block baseline", mov:"Endline survey" },
    { level:"Outcome 1", statement:"800 women have increased incomes", indicator:"Average annual income", baseline:"To be established", target:"≥50% increase", mov:"Income survey" },
    { level:"Output 1.1", statement:"Women trained in livelihood skills", indicator:"Women completing training", baseline:"0", target:"800 women", mov:"Attendance registers" },
  ]},
  budget_table:{ lines:[
    { item:"Project Coordinator", unit:"month", unit_cost:"35,000", quantity:"24", total:"8,40,000", source:"NRLM norms" },
    { item:"Community Mobilisers (5)", unit:"month", unit_cost:"15,000", quantity:"24", total:"18,00,000", source:"Field-staff rates" },
    { item:"Livelihood skills training", unit:"batch of 40", unit_cost:"30,000", quantity:"20", total:"6,00,000", source:"NRLM norms" },
  ]},
};

const hindi = {
  ...english, lang:"Hindi",
  title:"अर्की प्रखंड में महिलाओं की आजीविका और पोषण सुदृढ़ीकरण",
  subtitle:"अनुसूचित जनजाति की महिलाओं के लिए एकीकृत आर्थिक सशक्तिकरण एवं मातृ-शिशु पोषण पहल",
  geography:"अर्की प्रखंड, खूँटी ज़िला, झारखंड", duration:"24 माह", budget:"₹60,00,000",
  submittedTo:"ग्रामीण विकास फाउंडेशन", submittedBy:"प्रकाश कुमार",
  problem:"अर्की प्रखंड के भूमिहीन परिवारों की प्रजनन आयु वर्ग की अनुसूचित जनजाति महिलाएँ दो परस्पर जुड़ी चुनौतियों का सामना करती हैं: आर्थिक असुरक्षा और मातृ एवं शिशु कुपोषण का भारी बोझ।",
  objective:"24 माह की अवधि में अर्की प्रखंड की 800 अनुसूचित जनजाति महिलाओं की आर्थिक स्वतंत्रता को सुदृढ़ करना तथा उनके परिवारों के मातृ एवं शिशु पोषण में सुधार लाना।",
  strategy:"परियोजना महिला स्वयं सहायता समूहों पर केंद्रित एकीकृत सामुदायिक-मंच दृष्टिकोण अपनाती है।",
  activities:"गतिविधियाँ आउटपुट के अनुसार समूहित हैं और प्रत्येक गतिविधि एक निर्धारित परिणाम से जुड़ी है।",
  sustainability:"स्थिरता महासंघित स्वयं सहायता समूहों और सरकारी कार्यक्रमों के साथ अभिसरण पर आधारित है।",
  matrix:{ rows:[
    { level:"प्रभाव", statement:"अनुसूचित जनजाति परिवारों में गरीबी और कुपोषण में कमी", indicator:"5 वर्ष से कम बच्चों में बौनापन", baseline:"39.6% (एनएफएचएस-5)", target:"प्रखंड आधार रेखा से नीचे", mov:"अंतिम सर्वेक्षण" },
  ]},
};

(async () => {
  fs.writeFileSync("sample-english.docx", await generateDocx(english));
  fs.writeFileSync("sample-hindi.docx", await generateDocx(hindi));
  console.log("Wrote sample-english.docx and sample-hindi.docx");
})();
