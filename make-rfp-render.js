const fs = require("fs");
const { chromium } = require("playwright");
const { renderProposalHTML } = require("./lib/proposal-template");
const { generateDocx } = require("./lib/proposal-docx");
const { generateBudgetXlsx } = require("./lib/budget-xlsx");

(async () => {
  if(!fs.existsSync("substance-built.json") || !fs.existsSync("rfp-composed-content.json")){
    console.log("Need substance-built.json and rfp-composed-content.json (run make-rfp-proposal.js once first).");
    return;
  }
  const s = JSON.parse(fs.readFileSync("substance-built.json","utf8"));
  const c = JSON.parse(fs.readFileSync("rfp-composed-content.json","utf8"));
  const g = s.geography;
  const docData = {
    lang: s.lang,
    title: c.title || "Project Proposal",
    subtitle: c.subtitle || "",
    geography: g.block + " Block, " + g.district + " District, " + g.state,
    duration: "3 years",
    budget: "INR 99,00,000",
    submittedTo: s.donor,
    submittedBy: s.org.name,
    orgName: s.org.name,
    orgAddress: "Ranchi, Jharkhand",
    orgContact: "contact@example.org",
    problem: c.problem,
    objective: c.objective,
    strategy: c.strategy,
    activities: c.activities,
    results_narrative: c.results_narrative,
    sustainability: c.sustainability,
    matrix: s.matrix,
    sources: s.sources,
    budget_table: s.budget_table,
    rates_to_confirm: s.rates_to_confirm,
    risks: s.risks,
    timeline: s.timeline
  };
  const html = renderProposalHTML(docData, { template:"institutional", font:"serif-classic", includeToc:true, includeBack:true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:"networkidle" });
  await page.pdf({ path:"RFP-proposal.pdf", format:"A4", printBackground:true });
  await browser.close();
  fs.writeFileSync("RFP-proposal.docx", await generateDocx(docData));
  fs.writeFileSync("RFP-budget.xlsx", await generateBudgetXlsx(docData));
  console.log("Re-rendered RFP-proposal.pdf, .docx and .xlsx (no API call)");
})();
