const fs = require("fs");
const { buildSubstance } = require("./lib/build-substance");
const { orgProfile } = require("./sample-org-profile");
const { answers } = require("./sample-rfp-answers");

(async () => {
  if(!fs.existsSync("rfp-intake.json")){ console.log("Run test-rfp-intake.js first."); return; }
  if(!fs.existsSync("research.json")){ console.log("Run test-research.js first."); return; }
  if(!fs.existsSync("cost-norms.json")){ console.log("Run test-cost-research.js first."); return; }
  const rfpAnalysis = JSON.parse(fs.readFileSync("rfp-intake.json","utf8"));
  const research = JSON.parse(fs.readFileSync("research.json","utf8"));
  const costNorms = JSON.parse(fs.readFileSync("cost-norms.json","utf8"));
  console.log("Building substance on Opus (~1-2 min)...");
  const r = await buildSubstance({ orgProfile, rfpAnalysis, answers, research, costNorms });
  if(!r._parsed){
    console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to substance-raw.txt");
    fs.writeFileSync("substance-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("substance-built.json", JSON.stringify(r.substance, null, 2));
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
  console.log("\n=== BUDGET ADJUSTMENTS ===");
  (s.budget_adjustments||[]).forEach(x => console.log("  - " + x));
  console.log("\nProblem facts: " + (s.problem_facts||[]).length + " | Matrix rows: " + ((s.matrix&&s.matrix.rows||[]).length) + " | Sources: " + ((s.sources||[]).length) + " | Flags: " + ((s.flags||[]).length));
  console.log("Full substance written to substance-built.json");
})();
