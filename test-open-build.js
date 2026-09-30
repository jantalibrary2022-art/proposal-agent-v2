const fs = require("fs");
const { buildSubstance } = require("./lib/build-substance");
const { orgProfile } = require("./sample-org-profile");
const { answers } = require("./sample-open-answers");

(async () => {
  if(!fs.existsSync("open-brief.json")){ console.log("Run test-open-intake.js first."); return; }
  if(!fs.existsSync("open-research.json")){ console.log("Run test-open-research.js first."); return; }
  if(!fs.existsSync("open-cost.json")){ console.log("Run test-open-cost.js first."); return; }
  const rfpAnalysis = JSON.parse(fs.readFileSync("open-brief.json","utf8"));
  const research = JSON.parse(fs.readFileSync("open-research.json","utf8"));
  const costNorms = JSON.parse(fs.readFileSync("open-cost.json","utf8"));
  console.log("Building substance on Opus (~1-2 min)...");
  const r = await buildSubstance({ orgProfile, rfpAnalysis, answers, research, costNorms });
  if(!r._parsed){
    console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to open-substance-raw.txt");
    fs.writeFileSync("open-substance-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("open-substance.json", JSON.stringify(r.substance, null, 2));
  const s = r.substance;
  console.log("\nTHEME: " + s.theme);
  console.log("TARGET: " + s.target);
  console.log("BUDGET: " + s.budget + "  |  GRAND TOTAL: " + s.budget_grand_total);
  console.log("\n=== BUDGET LINES ===");
  (s.budget_table && s.budget_table.categories || []).forEach(c => {
    console.log("  [" + c.name + "]");
    (c.lines||[]).forEach(l => console.log("     " + (l.rate_basis === "sourced" ? "[SRC]" : "[EST]") + " " + l.item + ": " + l.unit_cost + " x " + l.quantity + " = " + l.total));
  });
  console.log("\n=== RATES TO CONFIRM (" + ((s.rates_to_confirm||[]).length) + ") ===");
  (s.rates_to_confirm||[]).forEach(x => console.log("  - " + x.item + " (est. " + x.estimated_rate + "): " + x.prompt));
  console.log("\n=== RISKS (" + ((s.risks||[]).length) + ") ===");
  (s.risks||[]).forEach(x => console.log("  - " + x.risk + " [" + x.likelihood + "/" + x.impact + "]"));
  console.log("\nProblem facts: " + (s.problem_facts||[]).length + " | Matrix rows: " + ((s.matrix&&s.matrix.rows||[]).length) + " | Sources: " + ((s.sources||[]).length) + " | Flags: " + ((s.flags||[]).length));
  console.log("Full substance written to open-substance.json");
})();
