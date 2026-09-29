const fs = require("fs");
const path = require("path");
const { diagnoseDraft } = require("./lib/diagnose");

function findDoc(arg){
  if(arg && fs.existsSync(arg)) return arg;
  const skip = new Set(["node_modules",".git"]);
  const hits = [];
  (function walk(dir){
    for(const e of fs.readdirSync(dir, { withFileTypes:true })){
      if(e.isDirectory()){ if(!skip.has(e.name)) walk(path.join(dir, e.name)); }
      else if(/\.docx$/i.test(e.name)) hits.push(path.join(dir, e.name));
    }
  })(".");
  if(arg){ const m = hits.find(h => h.toLowerCase().includes(String(arg).toLowerCase())); if(m) return m; }
  const s = hits.find(h => /saksham/i.test(h));
  return s || hits[0] || null;
}

(async () => {
  const file = findDoc(process.argv[2]);
  if(!file){ console.log("No .docx found under the project. Drag the draft into the Codespace, then re-run."); return; }
  console.log("Diagnosing: " + file + " (on Opus, ~1 min)...");
  const r = await diagnoseDraft(file);
  if(!r._parsed){ console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to diagnosis-raw.txt"); fs.writeFileSync("diagnosis-raw.txt", r._raw); return; }
  fs.writeFileSync("diagnosis.json", JSON.stringify(r.diagnosis, null, 2));
  const d = r.diagnosis;
  console.log("\nTITLE: " + (d.meta && d.meta.title));
  console.log("DONOR: " + (d.meta && d.meta.donor) + " | BUDGET: " + (d.meta && d.meta.budget) + " | DURATION: " + (d.meta && d.meta.duration));
  console.log("\nlogframe_present: " + (d.extracted && d.extracted.logframe_present) + " | toc_explicit: " + (d.extracted && d.extracted.toc_explicit) + " | risks_present: " + (d.extracted && d.extracted.risks_present));
  console.log("\n=== STRENGTHS (" + (d.strengths||[]).length + ") ===");
  (d.strengths||[]).forEach(x => console.log("  + " + x));
  console.log("\n=== WEAKNESSES (" + (d.weaknesses||[]).length + ") ===");
  (d.weaknesses||[]).forEach(x => console.log("  - [" + x.area + "] " + x.issue));
  console.log("\n=== SOURCE-AUTHORITY FLAGS (" + (d.source_authority_flags||[]).length + ") ===");
  (d.source_authority_flags||[]).forEach(x => console.log("  ! " + x.source_used + "  ->  " + x.authoritative_source));
  console.log("\n=== IMPROVEMENT PLAN (" + (d.improvement_plan||[]).length + ") ===");
  (d.improvement_plan||[]).forEach(x => console.log("  * " + x));
  console.log("\n=== QUESTIONS FOR USER (" + (d.questions_for_user||[]).length + ") ===");
  (d.questions_for_user||[]).forEach(x => console.log("  " + x.id + ": " + x.question));
  console.log("\nFull diagnosis written to diagnosis.json");
})();
