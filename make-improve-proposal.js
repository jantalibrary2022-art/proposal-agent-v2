const fs = require("fs");
const { chromium } = require("playwright");
const { composeProposal } = require("./lib/compose");
const { renderProposalHTML } = require("./lib/proposal-template");
const { generateDocx } = require("./lib/proposal-docx");
const { generateBudgetXlsx } = require("./lib/budget-xlsx");

const clean = x => String(x||"").split("(")[0].trim();

(async () => {
  if(!fs.existsSync("rebuilt-substance.json")){ console.log("Run test-rebuild.js first (need rebuilt-substance.json)."); return; }
  const s = JSON.parse(fs.readFileSync("rebuilt-substance.json","utf8"));
  const composeInput = JSON.parse(JSON.stringify(s));
  ["flags","budget_adjustments","rates_to_confirm","improvements"].forEach(k => delete composeInput[k]);
  console.log("Composing stronger proposal on Opus (~1-2 min)...");
  const c = await composeProposal(composeInput, { lang: s.lang });
  if(c._missing && c._missing.length){
    console.log("WARNING: missing sections: " + c._missing.join(", ") + " (stop=" + c._stop + ")");
    fs.writeFileSync("improve-composed-raw.txt", c._raw);
    return;
  }
  const g = s.geography;
  const docData = {
    lang: s.lang,
    title: c.title || "Project Proposal",
    subtitle: c.subtitle || "",
    geography: clean(g.block) + " Block, " + clean(g.district) + " District, " + g.state,
    duration: "12 months",
    budget: "INR 29,85,675",
    submittedTo: clean(s.donor),
    submittedBy: s.org.name,
    orgName: s.org.name,
    orgAddress: "Ranchi, Jharkhand",
    orgContact: "www.agadhbodhfoundation.in",
    problem: c.problem,
    objective: c.objective,
    strategy: c.strategy,
    activities: c.activities,
    results_narrative: c.results_narrative,
    sustainability: c.sustainability,
    matrix: s.matrix,
    budget_table: s.budget_table,
    timeline: s.timeline,
    risks: s.risks,
    sources: s.sources,
    rates_to_confirm: s.rates_to_confirm
  };
  const html = renderProposalHTML(docData, { template:"institutional", font:"serif-classic", includeToc:true, includeBack:true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:"networkidle" });
  await page.pdf({ path:"IMPROVED-proposal.pdf", format:"A4", printBackground:true });
  await browser.close();
  fs.writeFileSync("IMPROVED-proposal.docx", await generateDocx(docData));
  fs.writeFileSync("IMPROVED-budget.xlsx", await generateBudgetXlsx(docData));
  fs.writeFileSync("improve-composed-content.json", JSON.stringify(c, null, 2));
  console.log("Wrote IMPROVED-proposal.pdf, IMPROVED-proposal.docx and IMPROVED-budget.xlsx");
})();
