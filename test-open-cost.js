const fs = require("fs");
const { costResearch } = require("./lib/cost-research");

(async () => {
  if(!fs.existsSync("open-brief.json")){ console.log("Run test-open-intake.js first (need open-brief.json)."); return; }
  const b = JSON.parse(fs.readFileSync("open-brief.json","utf8"));
  const g = b.geography || {};
  const where = [g.block, g.district, g.state].filter(Boolean).join(", ");
  const items = (b.likely_budget_lines || []).map(l => "- " + l.item + " (unit: " + l.unit + "; funds: " + l.contributes + ")");
  const brief = [
    "STATE: " + (g.state || "") + ".",
    "CONTEXT: " + b.theme + " project. Target: " + b.target + ". Geography: " + where + ". Duration: " + b.duration + ". Indicative budget envelope: " + b.budget_ceiling + " (" + b.budget_basis + ").",
    "",
    "Find authoritative unit costs / rate norms for these budget line items:",
    items.join("\n")
  ].join("\n");
  console.log("Cost-researching on Opus with web search (1-3 min)...");
  const r = await costResearch(brief);
  if(!r._parsed){
    console.log("WARNING: could not parse JSON (stop=" + r._stop + "); raw saved to open-cost-raw.txt");
    fs.writeFileSync("open-cost-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("open-cost.json", JSON.stringify(r.data, null, 2));
  const d = r.data;
  console.log("\n=== COST NORMS FOUND (" + (d.cost_norms||[]).length + ") ===");
  (d.cost_norms||[]).forEach(x => console.log("  " + x.item + ": " + x.rate + " per " + x.unit + "  [" + x.basis + "]  -- " + x.source_title));
  console.log("\n=== STILL NEEDS LOCAL QUOTE (" + (d.gaps||[]).length + ") ===");
  (d.gaps||[]).forEach(x => console.log("  - " + x));
  console.log("\nFull cost norms with URLs written to open-cost.json");
})();
