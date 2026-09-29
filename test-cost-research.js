const fs = require("fs");
const { costResearch } = require("./lib/cost-research");

(async () => {
  if(!fs.existsSync("substance-built.json")){ console.log("Run test-build.js first (need substance-built.json)."); return; }
  const s = JSON.parse(fs.readFileSync("substance-built.json","utf8"));
  const items = [];
  (s.budget_table && s.budget_table.categories || []).forEach(c => {
    (c.lines||[]).forEach(l => items.push("- " + l.item + " (unit: " + l.unit + "; funds: " + l.contributes + ")"));
  });
  const brief = [
    "STATE: Chhattisgarh.",
    "CONTEXT: A 3-year NGO project on natural farming with PVTG and Scheduled Tribe households in Durgakondal block, Kanker district. Remote, forested, low-cash farming. Budget ceiling INR 99,00,000.",
    "",
    "Find authoritative unit costs / rate norms for these budget line items:",
    items.join("\n")
  ].join("\n");
  console.log("Cost-researching on Opus with web search (1-3 min)...");
  const r = await costResearch(brief);
  if(!r._parsed){
    console.log("WARNING: could not parse JSON (stop=" + r._stop + "); raw saved to cost-norms-raw.txt");
    fs.writeFileSync("cost-norms-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("cost-norms.json", JSON.stringify(r.data, null, 2));
  const d = r.data;
  console.log("\n=== COST NORMS FOUND (" + (d.cost_norms||[]).length + ") ===");
  (d.cost_norms||[]).forEach(x => console.log("  " + x.item + ": " + x.rate + " per " + x.unit + "  [" + x.basis + "]  -- " + x.source_title));
  console.log("\n=== STILL NEEDS LOCAL QUOTE (" + (d.gaps||[]).length + ") ===");
  (d.gaps||[]).forEach(x => console.log("  - " + x));
  console.log("\nFull cost norms with URLs written to cost-norms.json");
})();
