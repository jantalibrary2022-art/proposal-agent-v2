const fs = require("fs");
const { openIntake } = require("./lib/open-intake");
const { orgProfile } = require("./sample-org-profile");
const { answers, hints } = require("./sample-open-answers");

(async () => {
  const mode = process.argv[2] === "ideate" ? "ideate" : "direct";
  console.log("Running OPEN intake in " + mode + " mode on Opus...");
  const inputs = mode === "ideate" ? { orgProfile, hints } : { orgProfile, answers };
  const r = await openIntake(inputs, { mode });
  if(!r._parsed){
    console.log("WARNING: parse failed (stop=" + r._stop + "); raw saved to open-intake-raw.txt");
    fs.writeFileSync("open-intake-raw.txt", r._raw);
    return;
  }
  const out = mode === "ideate" ? "open-concepts.json" : "open-brief.json";
  fs.writeFileSync(out, JSON.stringify(r.data, null, 2));
  const d = r.data;
  const where = g => g ? [g.block, g.district, g.state].filter(Boolean).join(", ") : "";
  if(mode === "ideate"){
    console.log("\n=== CONCEPTS (" + (d.concepts||[]).length + ") ===");
    (d.concepts||[]).forEach((c,i) => {
      console.log("\n[" + (i+1) + "] " + c.title);
      console.log("    Theme:   " + c.theme);
      console.log("    Where:   " + where(c.geography));
      console.log("    Target:  " + c.target);
      console.log("    Problem: " + c.core_problem);
      console.log("    Fit:     " + c.why_fit_org);
      console.log("    Rough:   " + c.rough_scale + " | " + c.rough_duration + " | " + c.rough_budget_band);
    });
    if(d.note) console.log("\nNote: " + d.note);
  } else {
    console.log("\nTHEME:    " + d.theme);
    console.log("TITLE:    " + d.working_title);
    console.log("WHERE:    " + where(d.geography) + "  (" + ((d.geography&&d.geography.coverage)||"") + ")");
    console.log("TARGET:   " + d.target);
    console.log("DURATION: " + d.duration);
    console.log("BUDGET:   " + d.budget_ceiling + "  [" + d.budget_basis + "]");
    console.log("DONOR:    " + d.donor + "  [" + d.donor_basis + "]");
    console.log("\nPLANNED ACTIVITIES (" + (d.planned_activities||[]).length + "):");
    (d.planned_activities||[]).forEach(a => console.log("  - " + a));
    console.log("\nLIKELY BUDGET LINES (" + (d.likely_budget_lines||[]).length + "):");
    (d.likely_budget_lines||[]).forEach(l => console.log("  - " + l.item + " (" + l.unit + ") -> " + l.contributes));
    console.log("\nRESEARCH NEEDS (" + (d.research_needs||[]).length + "):");
    (d.research_needs||[]).forEach(x => console.log("  - " + x));
    console.log("\nORG FIT: " + d.org_fit);
    console.log("\nGAPS (" + (d.gaps||[]).length + "):");
    (d.gaps||[]).forEach(x => console.log("  - " + x));
    console.log("\nQUESTIONS FOR USER (" + (d.questions_for_user||[]).length + "):");
    (d.questions_for_user||[]).forEach(x => console.log("  - " + x));
  }
  console.log("\nWritten to " + out);
})();
