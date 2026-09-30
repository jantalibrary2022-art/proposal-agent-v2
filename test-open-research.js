const fs = require("fs");
const { research } = require("./lib/research");

(async () => {
  if(!fs.existsSync("open-brief.json")){ console.log("Run test-open-intake.js first (need open-brief.json)."); return; }
  const b = JSON.parse(fs.readFileSync("open-brief.json","utf8"));
  const g = b.geography || {};
  const where = [g.block, g.district, g.state].filter(Boolean).join(", ");
  const brief = [
    "PROJECT THEME: " + b.theme + ".",
    "WORKING TITLE: " + (b.working_title || "") + ".",
    "CORE IDEA: " + (b.problem_focus || ""),
    "GEOGRAPHY: " + where + ". " + (g.coverage || ""),
    "TARGET GROUP: " + b.target + ".",
    "DURATION: " + b.duration + ".",
    "",
    "PLANNED ACTIVITIES:",
    ...(b.planned_activities || []).map(a => "- " + a),
    "",
    "Research needs (find authoritative, cited data for each; never invent a figure):",
    ...(b.research_needs || []).map(x => "- " + x)
  ].join("\n");
  console.log("Researching on Opus with web search (1-3 min)...");
  const r = await research(brief);
  if(!r._parsed){
    console.log("WARNING: could not parse JSON (stop=" + r._stop + ", search blocks=" + r._searchBlocks + "); raw saved to open-research-raw.txt");
    fs.writeFileSync("open-research-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("open-research.json", JSON.stringify(r.data, null, 2));
  const d = r.data;
  const show = (label, arr, fmt) => { console.log("\n=== " + label + " (" + (arr||[]).length + ") ==="); (arr||[]).forEach(x => console.log("  " + fmt(x))); };
  show("CONTEXT FACTS", d.context_facts, x => x.fact + ": " + x.value + " [" + x.geography_level + ", " + (x.year||"n.d.") + "] -- " + x.source_title);
  show("SECTOR EVIDENCE", d.sector_evidence, x => x.point + " -- " + x.source_title);
  show("POLICY CONTEXT", d.policy_context, x => x.item + " -- " + x.source_title);
  show("COST NORMS", d.cost_norms, x => x.item + ": " + x.rate + " per " + x.unit + " -- " + x.source_title);
  show("GAPS", d.gaps, x => x);
  console.log("\nFull research with URLs written to open-research.json");
})();
