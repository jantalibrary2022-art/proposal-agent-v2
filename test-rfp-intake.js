const fs = require("fs");
const { analyzeRFP } = require("./lib/rfp-intake");
const { orgProfile } = require("./sample-org-profile");

(async () => {
  const file = process.argv[2] || "rfp-sbi-livelihoods.txt";
  if(!fs.existsSync(file)){ console.log("File not found: " + file); return; }
  const rfp = fs.readFileSync(file, "utf8");
  console.log("Reading RFP: " + file + " with org profile: " + orgProfile.name + " (analysing on Opus, ~30s)");
  const r = await analyzeRFP(rfp, orgProfile);
  if(!r._parsed){
    console.log("WARNING: could not parse JSON (stop=" + r._stop + "); raw saved to rfp-intake-raw.txt");
    fs.writeFileSync("rfp-intake-raw.txt", r._raw);
    return;
  }
  fs.writeFileSync("rfp-intake.json", JSON.stringify(r.analysis, null, 2));
  const a = r.analysis;
  console.log("\n=== ELIGIBILITY CHECK ===");
  (a.eligibility_check || []).forEach(function(e){ console.log("  [" + e.status + "] " + e.requirement + " -- " + e.evidence); });
  console.log("\n=== QUESTIONS FOR USER (" + (a.questions_for_user || []).length + ") ===");
  (a.questions_for_user || []).forEach(function(q){ console.log("  " + q.id + ": " + q.question); });
  console.log("\n=== COMPLIANCE NOTES ===");
  (a.compliance_notes || []).forEach(function(n){ console.log("  - " + n); });
  console.log("\nFull intake written to rfp-intake.json");
})();
