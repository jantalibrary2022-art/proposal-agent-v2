const { chromium } = require("playwright");
const { renderProposalHTML } = require("./lib/proposal-template");

const base = {
  lang:"English",
  title:"Strengthening Women's Livelihoods and Household Nutrition in Arki Block",
  subtitle:"An integrated economic empowerment and maternal-child nutrition initiative",
  geography:"Arki Block, Khunti District, Jharkhand", duration:"24 months", budget:"INR 60,00,000",
  submittedTo:"Grameen Vikas Foundation", submittedBy:"Prakash Kumar",
  orgName:"EcoKheti Foundation", orgAddress:"Ranchi, Jharkhand", orgContact:"contact@example.org",
  closing:"We look forward to partnering with you to build lasting change.",
  problem:"Scheduled Tribe women in the landless households of Arki block face economic vulnerability and a heavy burden of maternal and child undernutrition, conditions that reinforce one another and hold households in poverty.",
  objective:"To strengthen the economic independence of 800 Scheduled Tribe women in Arki block while improving maternal and child nutrition over 24 months.",
};

const variants = [
  { file:"logo-BOTH.pdf",  data:{ ...base, orgLogo:"logo-org.svg", donorLogo:"logo-donor.svg" } },
  { file:"logo-ORGONLY.pdf", data:{ ...base, orgLogo:"logo-org.svg" } },
  { file:"logo-NONE.pdf",  data:{ ...base } },
];

(async () => {
  const browser = await chromium.launch();
  for (const v of variants) {
    const html = renderProposalHTML(v.data, { template:"institutional", font:"serif-noto", includeBack:true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil:"networkidle" });
    await page.pdf({ path:v.file, format:"A4", printBackground:true });
    await page.close();
    console.log("Wrote", v.file);
  }
  await browser.close();
  console.log("Done.");
})();
