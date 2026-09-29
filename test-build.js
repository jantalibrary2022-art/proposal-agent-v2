const fs = require("fs");
const { buildSubstance } = require("./lib/build-substance");
const { orgProfile } = require("./sample-org-profile");
const { answers } = require("./sample-rfp-answers");

(async () => {
  if(!fs.existsSync("rfp-intake.json")){ console.log("Run test-rfp-intake.js first (need rfp-intake.json)."); return; }
  if(!fs.existsSync("research.json")){ console.log("Run test-research.js first (need research.json)."); return; }
  const rfpAnalysis = JSON.parse(fs.readFileSync("rfp-intake.json","utf8"));
  const research = JSON.parse(fs.readFileSync("research.json","utf8"));
  console.log("Building substance on Opus (~1-2 min)...");
  const r = await buildSubstance({ orgProfile, rfpAnalysis, answers, research });
  if(!r._parsed){
    console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to substance-raw.txt");
    fs.writeFileSync("substance-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("substance-built.json", JSON.stringify(r.substance, null, 2));
  const s = r.substance;
  console.log("\nTHEME: " + s.theme);
  console.log("TARGET: " + s.target);
  console.log("BUDGET: " + s.budget + "  |  DURATION: " + s.duration);
  console.log("\n=== PROBLEM FACTS (" + (s.problem_facts||[]).length + ") ===");
  (s.problem_facts||[]).forEach((f,i) => console.log("  " + (i+1) + ". " + f));
  console.log("\nOBJECTIVE: " + s.objective);
  console.log("\n=== RESULTS ===");
  console.log("  Impact: " + (s.results && s.results.impact));
  (s.results && s.results.outcomes || []).forEach(o => console.log("  Outcome: " + o));
  (s.results && s.results.outputs || []).forEach(o => console.log("  Output: " + o));
  console.log("\n=== BUDGET ===");
  (s.budget_table && s.budget_table.categories || []).forEach(c => {
    console.log("  [" + c.name + "]");
    (c.lines||[]).forEach(l => console.log("     - " + l.item + ": " + l.unit_cost + " x " + l.quantity + " = " + l.total + "  -> " + l.contributes));
  });
  console.log("\n=== TIMELINE (" + ((s.timeline && s.timeline.rows || []).length) + " rows) ===");
  (s.timeline && s.timeline.rows || []).forEach(t => console.log("  " + t.activity + ": Q" + (t.active||[]).join(", Q")));
  console.log("\n=== SOURCES (" + ((s.sources||[]).length) + ") ===");
  (s.sources||[]).forEach(x => console.log("  [" + x.ref + "] " + x.title));
  console.log("\n=== FLAGS ===");
  (s.flags||[]).forEach(x => console.log("  - " + x));
  console.log("\nFull substance written to substance-built.json");
})();
