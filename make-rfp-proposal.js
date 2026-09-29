const fs = require("fs");
const { chromium } = require("playwright");
const { composeProposal } = require("./lib/compose");
const { renderProposalHTML } = require("./lib/proposal-template");
const { generateDocx } = require("./lib/proposal-docx");
const { generateBudgetXlsx } = require("./lib/budget-xlsx");

(async () => {
  if(!fs.existsSync("substance-built.json")){ console.log("Run test-build.js first (need substance-built.json)."); return; }
  const s = JSON.parse(fs.readFileSync("substance-built.json","utf8"));
  console.log("Composing proposal from built substance on Opus (~1-2 min)...");
  const c = await composeProposal(s, { lang: s.lang });
  if(c._missing && c._missing.length){
    console.log("WARNING: missing sections: " + c._missing.join(", ") + " (stop=" + c._stop + ")");
    fs.writeFileSync("rfp-composed-raw.txt", c._raw);
    return;
  }
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
    budget_table: s.budget_table,
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
  fs.writeFileSync("rfp-composed-content.json", JSON.stringify(c, null, 2));
  console.log("Wrote RFP-proposal.pdf, RFP-proposal.docx and RFP-budget.xlsx");
})();
