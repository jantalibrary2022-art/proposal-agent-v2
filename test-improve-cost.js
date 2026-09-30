const fs = require("fs");
const { costResearch } = require("./lib/cost-research");

const items = [
  "- Project Coordinator salary (NGO project staff, Jharkhand)",
  "- Field Facilitator salary (NGO field staff, Jharkhand)",
  "- Accounts / Admin support salary (NGO, Jharkhand)",
  "- Backyard poultry unit: 15-20 improved-breed birds (Vanaraja/Kuroiler) + feed + night shelter, per household",
  "- Goat unit: 3-4 Black Bengal goats + veterinary kit, per household",
  "- Oyster mushroom cultivation starter kit (spawn, polythene, inputs), per household",
  "- Kitchen / nutrition garden inputs (raised bed, seeds, organic inputs), per household",
  "- Livelihood skills training, per batch (resource persons, venue, materials)",
  "- Household survey enumerator cost, per interview or per day (Jharkhand)",
  "- Government scheme facilitation camp, per event",
  "- MGNREGA wage rate, Jharkhand (current)"
];

const brief = [
  "STATE: Jharkhand.",
  "CONTEXT: A 12-month NGO project with Persons with Disabilities in Angara block, Ranchi district: homestead livelihoods (backyard poultry, goats, oyster mushroom, kitchen gardens), government-entitlement facilitation, and strengthening a 1,000-member PwD collective. About 150 livelihood households. Total budget about INR 30 lakh.",
  "",
  "Find authoritative unit costs / rate norms for these budget line items:",
  items.join("\n")
].join("\n");

(async () => {
  console.log("Improve cost-research on Opus with web search (1-3 min)...");
  const r = await costResearch(brief, { maxSearches: 12 });
  if(!r._parsed){ console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to improve-cost-raw.txt"); fs.writeFileSync("improve-cost-raw.txt", r._raw); return; }
  fs.writeFileSync("improve-cost.json", JSON.stringify(r.data, null, 2));
  const d = r.data;
  console.log("\n=== COST NORMS FOUND (" + (d.cost_norms||[]).length + ") ===");
  (d.cost_norms||[]).forEach(x => console.log("  " + x.item + ": " + x.rate + " per " + x.unit + "  -- " + x.source_title));
  console.log("\n=== NEEDS LOCAL QUOTE (" + (d.gaps||[]).length + ") ===");
  (d.gaps||[]).forEach(x => console.log("  - " + x));
  console.log("\nWritten to improve-cost.json");
})();
