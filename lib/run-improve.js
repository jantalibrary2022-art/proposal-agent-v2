// lib/run-improve.js
// IMPROVE-EXISTING pipeline → reviewable DRAFT. Diagnoses an applicant's existing
// draft, corrects its evidence and costs, and rebuilds a stronger substance.
// Render is done separately by renderProposalFiles (lib/run-open.js), mode-agnostic.

const { diagnoseText } = require("./diagnose");
const { research } = require("./research");
const { costResearch } = require("./cost-research");
const { rebuildSubstance } = require("./rebuild-substance");
const { composeProposal } = require("./compose");

function geoLineFrom(s) {
  const g = (s && s.geography) || {};
  const block = String(g.block || "").split("(")[0].trim();
  const district = String(g.district || "").split("(")[0].trim();
  return [block && block + " Block", district && district + " District", g.state].filter(Boolean).join(", ");
}

function researchBrief(diagnosis) {
  const m = diagnosis.meta || {};
  const flags = (diagnosis.source_authority_flags || [])
    .map((f) => "- Replace/verify: " + f.claim + " (draft used: " + (f.source_used || "a weak source") + "). Find the authoritative origin: " + (f.authoritative_source || "the recognised source for this figure") + ".")
    .join("\n");
  return [
    "IMPROVE-EXISTING mode research. A draft proposal needs its weak or wrong sources replaced and authoritative local data added. Never invent a figure; every value must carry a real citation, or be left as a gap.",
    "PROJECT: " + (m.title || "the proposed project") + ".",
    "GEOGRAPHY: " + (m.geography || "as stated in the draft") + ". TARGET: " + (m.target || "as stated in the draft") + ". DONOR: " + (m.donor || "as stated in the draft") + ".",
    "",
    flags ? "Find authoritative, current figures with real citations for these flagged items:\n" + flags : "Find authoritative, current figures with real citations for every statistic the draft relies on.",
    "",
    "Also add the authoritative local and current data the draft lacks or got wrong:",
    "- District-level demographic and socioeconomic profile for this geography (Census, NFHS district factsheet, NSS, NITI Aayog MPI), not only state or national figures.",
    "- Current status of the public schemes and entitlements this project depends on (correct scheme names, current rates, eligibility, and whether any cited scheme is discontinued or renamed).",
    "- Sector evidence relevant to the theme and target group from recognised institutions or peer-reviewed research.",
    "- Any infrastructure or coverage figures the draft cites that may be outdated (electrification, water, connectivity); find the current official figure.",
  ].join("\n");
}

function costBrief(diagnosis) {
  const m = diagnosis.meta || {};
  const ex = diagnosis.extracted || {};
  return [
    "REGION: " + (m.geography || "as stated in the draft") + ".",
    "CONTEXT: " + (m.title || "the proposed project") + " with " + (m.target || "the target group") + " in " + (m.geography || "the stated geography") + ". Duration: " + (m.duration || "as stated") + ". Indicative total budget: " + (m.budget || "as stated in the draft") + ".",
    ex.budget_present ? "THE DRAFT'S CURRENT BUDGET (as written, to be corrected and completed): " + ex.budget_present : "",
    "",
    "Find authoritative unit costs / rate norms for the likely budget line items of this project:",
    "- Programme and field staff salaries or honoraria (NGO staff in this state)",
    "- Training or capacity-building per participant per day",
    "- Input, material, livelihood or asset kits per household or unit, as the project's activities imply",
    "- Household survey or enumeration cost",
    "- Government-scheme facilitation camps or events",
    "- Travel and field operations",
    "- Office and administrative overheads",
    "- The relevant state minimum wage or MGNREGA wage rate",
  ].filter(Boolean).join("\n");
}

async function runImproveDraft(draftText, answers, opts = {}) {
  const progress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  let diagnosis;
  if (opts.diagnosis && typeof opts.diagnosis === "object") {
    diagnosis = opts.diagnosis;
  } else {
    progress("diagnose");
    const d = await diagnoseText(draftText);
    if (!d._parsed) throw new Error("Diagnosis failed to parse (stop=" + d._stop + ")");
    diagnosis = d.diagnosis;
  }
  progress("research");
  const researchRes = await research(researchBrief(diagnosis), { maxSearches: 14 });
  if (!researchRes._parsed) throw new Error("Research failed to parse (stop=" + researchRes._stop + ")");
  progress("cost");
  const costRes = await costResearch(costBrief(diagnosis), { maxSearches: 12 });
  if (!costRes._parsed) throw new Error("Cost research failed to parse (stop=" + costRes._stop + ")");
  progress("rebuild");
  const built = await rebuildSubstance({ draftText, diagnosis, research: researchRes.data, costNorms: costRes.data, answers: answers || null });
  if (!built._parsed) throw new Error("Rebuild substance failed to parse (stop=" + built._stop + ")");
  const substance = built.substance;
  // Output language chosen per proposal (defaults to the interface language on the client).
  if (opts.language === "English" || opts.language === "Hindi") substance.lang = opts.language;
  progress("compose");
  const composeInput = JSON.parse(JSON.stringify(substance));
  ["flags", "budget_adjustments", "rates_to_confirm", "improvements"].forEach((k) => delete composeInput[k]);
  const composed = await composeProposal(composeInput, { lang: substance.lang });
  if (composed._missing && composed._missing.length) throw new Error("Compose missing sections: " + composed._missing.join(", "));
  const composedClean = {
    title: composed.title || "",
    subtitle: composed.subtitle || "",
    problem: composed.problem || "",
    objective: composed.objective || "",
    strategy: composed.strategy || "",
    results_narrative: composed.results_narrative || "",
    activities: composed.activities || "",
    sustainability: composed.sustainability || "",
  };
  progress("draft");
  const meta = {
    title: composedClean.title || substance.theme || "Project Proposal",
    subtitle: composedClean.subtitle || "",
    theme: substance.theme,
    geography: geoLineFrom(substance),
    duration: substance.duration,
    budget: substance.budget,
    budget_grand_total: substance.budget_grand_total,
    rates_to_confirm: substance.rates_to_confirm || [],
    flags: substance.flags || [],
    donor: substance.donor || "",
    improvements: substance.improvements || [],
  };
  return { meta, substance, composed: composedClean, diagnosis };
}

module.exports = { runImproveDraft };
