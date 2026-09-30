const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { rebuildSubstance } = require("./lib/rebuild-substance");

function findDoc(){
  const skip = new Set(["node_modules",".git"]); const hits = [];
  (function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ if(e.isDirectory()){ if(!skip.has(e.name)) walk(path.join(dir,e.name)); } else if(/\.docx$/i.test(e.name)) hits.push(path.join(dir,e.name)); } })(".");
  return hits.find(h=>/saksham/i.test(h)) || hits[0] || null;
}

(async () => {
  for(const f of ["diagnosis.json","improve-research.json","improve-cost.json"]){ if(!fs.existsSync(f)){ console.log("Missing "+f+"; run the earlier steps first."); return; } }
  const file = findDoc();
  if(!file){ console.log("Draft .docx not found."); return; }
  const draftText = (await mammoth.extractRawText({ path: file })).value;
  const diagnosis = JSON.parse(fs.readFileSync("diagnosis.json","utf8"));
  const research = JSON.parse(fs.readFileSync("improve-research.json","utf8"));
  const costNorms = JSON.parse(fs.readFileSync("improve-cost.json","utf8"));
  console.log("Rebuilding stronger substance on Opus (~1-2 min)...");
  const r = await rebuildSubstance({ draftText, diagnosis, research, costNorms });
  if(!r._parsed){ console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to rebuilt-raw.txt"); fs.writeFileSync("rebuilt-raw.txt", r._raw); return; }
  fs.writeFileSync("rebuilt-substance.json", JSON.stringify(r.substance, null, 2));
  const s = r.substance;
  console.log("\nTHEME: " + s.theme);
  console.log("TARGET: " + s.target);
  console.log("BUDGET: " + (s.budget_grand_total || s.budget));
  console.log("\n=== IMPROVEMENTS vs DRAFT (" + (s.improvements||[]).length + ") ===");
  (s.improvements||[]).forEach(x => console.log("  * " + x));
  console.log("\n=== RESULTS ===");
  console.log("  Impact: " + (s.results && s.results.impact));
  (s.results && s.results.outcomes || []).forEach(o => console.log("  Outcome: " + o));
  console.log("  Outputs: " + ((s.results && s.results.outputs || []).length));
  console.log("\n=== MATRIX ROWS: " + ((s.matrix && s.matrix.rows || []).length) + " | PROBLEM FACTS: " + ((s.problem_facts||[]).length) + " | SOURCES: " + ((s.sources||[]).length) + " ===");
  console.log("\n=== BUDGET (grand total row) ===");
  (s.budget_table && s.budget_table.categories || []).forEach(c => console.log("  [" + c.name + "] lines: " + (c.lines||[]).length));
  console.log("\n=== RATES TO CONFIRM: " + ((s.rates_to_confirm||[]).length) + " | FLAGS: " + ((s.flags||[]).length) + " ===");
  (s.flags||[]).forEach(x => console.log("  ! " + x));
  console.log("\nFull stronger substance written to rebuilt-substance.json");
})();
