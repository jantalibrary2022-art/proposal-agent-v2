const fs = require("fs");
const { chromium } = require("playwright");
const { composeProposal } = require("./lib/compose");
const { renderProposalHTML } = require("./lib/proposal-template");
const { generateDocx } = require("./lib/proposal-docx");
const { generateBudgetXlsx } = require("./lib/budget-xlsx");

(async () => {
  if(!fs.existsSync("open-substance.json")){ console.log("Run test-open-build.js first (need open-substance.json)."); return; }
  const s = JSON.parse(fs.readFileSync("open-substance.json","utf8"));
  const composeInput = JSON.parse(JSON.stringify(s));
  delete composeInput.flags;
  delete composeInput.budget_adjustments;
  delete composeInput.rates_to_confirm;
  console.log("Composing proposal from built substance on Opus (~1-2 min)...");
  const c = await composeProposal(composeInput, { lang: s.lang });
  if(c._missing && c._missing.length){
    console.log("WARNING: missing sections: " + c._missing.join(", ") + " (stop=" + c._stop + ")");
    fs.writeFileSync("open-composed-raw.txt", c._raw);
    return;
  }
  const g = s.geography || {};
  const geoLine = [g.block && (g.block + " Block"), g.district && (g.district + " District"), g.state].filter(Boolean).join(", ");
  const donorAgnostic = !s.donor || /agnostic/i.test(s.donor);
  const docData = {
    lang: s.lang,
    title: c.title || "Project Proposal",
    subtitle: c.subtitle || "",
    geography: geoLine,
    duration: s.duration,
    budget: s.budget,
    submittedTo: donorAgnostic ? "" : s.donor,
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
    risks: s.risks,
    timeline: s.timeline
  };
  const html = renderProposalHTML(docData, { template:"institutional", font:"serif-classic", includeToc:true, includeBack:true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:"networkidle" });
  await page.pdf({ path:"OPEN-proposal.pdf", format:"A4", printBackground:true });
  await browser.close();
  fs.writeFileSync("OPEN-proposal.docx", await generateDocx(docData));
  fs.writeFileSync("OPEN-budget.xlsx", await generateBudgetXlsx(docData));
  fs.writeFileSync("open-composed-content.json", JSON.stringify(c, null, 2));
  console.log("Wrote OPEN-proposal.pdf, OPEN-proposal.docx and OPEN-budget.xlsx");
})();
