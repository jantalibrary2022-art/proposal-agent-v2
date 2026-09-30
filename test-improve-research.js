const fs = require("fs");
const { research } = require("./lib/research");

if(!fs.existsSync("diagnosis.json")){ console.log("Run test-diagnose.js first (need diagnosis.json)."); process.exit(0); }
const d = JSON.parse(fs.readFileSync("diagnosis.json","utf8"));
const m = d.meta || {};
const flags = (d.source_authority_flags||[]).map(f => "- Replace/verify: " + f.claim + " (draft used: " + f.source_used + "). Find: " + f.authoritative_source).join("\n");

const brief = [
  "IMPROVE-EXISTING mode research. A draft CSR proposal needs its weak sources replaced and local district data added.",
  "Project: " + (m.title || "PwD livelihoods and entitlements") + ".",
  "Geography: " + (m.geography || "Angara block, Ranchi district, Jharkhand") + ". Target: " + (m.target || "Persons with Disabilities") + ". Donor: " + (m.donor || "Usha Martin Foundation") + ".",
  "",
  "Find authoritative, current figures with real citations for these flagged items:",
  flags,
  "",
  "Also add authoritative local and current data the draft lacks or got wrong:",
  "- Correct Jharkhand disabled population count and percentage (Census 2011 Table C-20); verify the draft's '1.7%' claim.",
  "- Ranchi DISTRICT NFHS-5 (2019-21) factsheet: child stunting, wasting, anaemia, women's schooling and BMI (district level, not only state).",
  "- Ranchi district poverty: NITI Aayog National Multidimensional Poverty Index (2021/2023) district figure; and whether Ranchi is a NITI Aspirational District.",
  "- Current rural electrification (Saubhagya) and tap-water (Jal Jeevan Mission) status for Ranchi/Jharkhand; the draft's 2011 figures (16 of 82 villages electrified, 2 with tap water) are outdated.",
  "- The Government of Jharkhand order abolishing percentage-based disability certification: official notification and its scope.",
  "- Jharkhand disability pension: official scheme name, current monthly rate and eligibility.",
  "- RPwD Act 2016 entitlements; the UDID / Swavlamban process; ALIMCO ADIP assistive-device scheme.",
  "- NSS 76th Round (Report No. 583) disability-certificate coverage, with rural and social-group breakdown."
].join("\n");

(async () => {
  console.log("Improve-research on Opus with web search (1-3 min)...");
  const r = await research(brief, { maxSearches: 14 });
  if(!r._parsed){ console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to improve-research-raw.txt"); fs.writeFileSync("improve-research-raw.txt", r._raw); return; }
  fs.writeFileSync("improve-research.json", JSON.stringify(r.data, null, 2));
  const D = r.data;
  const show = (l,a,f) => { console.log("\n=== " + l + " (" + (a||[]).length + ") ==="); (a||[]).forEach(x => console.log("  " + f(x))); };
  show("CONTEXT FACTS", D.context_facts, x => x.fact + ": " + x.value + " [" + x.geography_level + "] -- " + x.source_title);
  show("POLICY CONTEXT", D.policy_context, x => x.item + " -- " + x.source_title);
  show("SECTOR EVIDENCE", D.sector_evidence, x => x.point + " -- " + x.source_title);
  show("GAPS", D.gaps, x => x);
  console.log("\nWritten to improve-research.json");
})();
