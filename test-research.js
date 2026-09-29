const fs = require("fs");
const { research } = require("./lib/research");
const { answers } = require("./sample-rfp-answers");

const g = answers.geography;
const brief = [
  "PROJECT THEME: Climate smart livelihoods through natural farming.",
  "CORE IDEA: " + answers.project_idea + " for tribal households, building climate-resilient food and income on their FRA lands.",
  "GEOGRAPHY: " + g.block + " block, " + g.district + " district, " + g.state + ". " + g.note,
  "TARGET GROUP: " + answers.target_group.group + ", about " + answers.target_group.scale + ".",
  "BUDGET / DURATION: " + answers.budget + " over " + answers.duration + ".",
  "",
  "Research needs:",
  "- Socioeconomic and demographic profile of " + g.district + " district and, if available, " + g.block + " block: tribal and PVTG population, literacy, poverty, agriculture, forest dependence.",
  "- The specific PVTG(s) in this area and their situation.",
  "- Natural farming evidence relevant here: practices, yields, input-cost savings, climate resilience, adoption in Chhattisgarh and India; the National Mission on Natural Farming and any state programme.",
  "- Forest Rights Act context for land-based livelihoods of PVTG and forest dwellers.",
  "- Credible cost norms in Chhattisgarh for likely budget lines: NGO field-staff salaries, training costs, bio-input and seed kits, nursery, collective or FPO support, and the MGNREGA wage rate."
].join("\n");

(async () => {
  console.log("Researching on Opus with web search (this can take 1-3 minutes)...");
  const r = await research(brief);
  if(!r._parsed){
    console.log("WARNING: could not parse JSON (stop=" + r._stop + ", search blocks=" + r._searchBlocks + "); raw saved to research-raw.txt");
    fs.writeFileSync("research-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("research.json", JSON.stringify(r.data, null, 2));
  const d = r.data;
  const show = (label, arr, fmt) => { console.log("\n=== " + label + " (" + (arr||[]).length + ") ==="); (arr||[]).forEach(x => console.log("  " + fmt(x))); };
  show("CONTEXT FACTS", d.context_facts, x => x.fact + ": " + x.value + " [" + x.geography_level + ", " + (x.year||"n.d.") + "] -- " + x.source_title);
  show("SECTOR EVIDENCE", d.sector_evidence, x => x.point + " -- " + x.source_title);
  show("POLICY CONTEXT", d.policy_context, x => x.item + " -- " + x.source_title);
  show("COST NORMS", d.cost_norms, x => x.item + ": " + x.rate + " per " + x.unit + " -- " + x.source_title);
  show("GAPS", d.gaps, x => x);
  console.log("\nFull research with URLs written to research.json");
})();
