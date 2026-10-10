// lib/run-rfp.js
// RFP-mode pipeline → reviewable DRAFT. Reads the donor RFP and the applicant's
// answers, then runs the same research/cost/build/compose stages as open mode.
// Render is done separately by renderProposalFiles (lib/run-open.js), mode-agnostic.

const { analyzeRFP } = require("./rfp-intake");
const { research } = require("./research");
const { costResearch } = require("./cost-research");
const { buildSubstance } = require("./build-substance");
const { composeProposal, composeByFormat } = require("./compose");

function hasPrescribedFormat(substance) {
  const fr = substance && substance.format_requirements;
  return !!(fr && Array.isArray(fr.prescribed_sections) &&
    fr.prescribed_sections.filter((x) => String(x == null ? "" : x).trim()).length > 0);
}

function geoLineFrom(s) {
  const g = (s && s.geography) || {};
  return [g.block && g.block + " Block", g.district && g.district + " District", g.state].filter(Boolean).join(", ");
}

function whereOf(answers) {
  const g = answers.geography;
  if (typeof g === "string") return g;
  return [g && g.block, g && g.district, g && g.state].filter(Boolean).join(", ");
}

function researchBrief(answers, analysis) {
  const themes = (analysis.themes || []).join("; ");
  const tg = answers.target_group || {};
  return [
    "PROJECT THEME: " + (answers.project_idea || "") + (themes ? " (within donor themes: " + themes + ")" : "") + ".",
    "CORE IDEA: " + (answers.project_idea || "") + " for " + (tg.group || "the target group") + ".",
    "GEOGRAPHY: " + whereOf(answers) + ".",
    "TARGET GROUP: " + (tg.group || "") + ", about " + (tg.scale || "") + ".",
    "BUDGET / DURATION: " + (answers.budget || "") + " over " + (answers.duration || "") + ".",
    "",
    "Research needs (find authoritative, cited data for each; never invent a figure):",
    "- Socioeconomic and demographic profile of the district and, if available, the block: population, poverty, literacy, livelihoods and relevant vulnerability.",
    "- Sector evidence relevant to the theme and target group.",
    "- Relevant policy and scheme context for this theme and geography.",
    "- Credible cost norms in the state for likely budget lines: field staff salaries, training, input or material kits, travel, administrative overheads, and the relevant wage rate.",
  ].join("\n");
}

function costBrief(answers) {
  const g = answers.geography;
  const state = typeof g === "string" ? "" : (g && g.state) || "";
  const tg = answers.target_group || {};
  return [
    "STATE: " + state + ".",
    "CONTEXT: " + (answers.project_idea || "project") + " with " + (tg.group || "the target group") + " in " + whereOf(answers) + ". Duration " + (answers.duration || "") + ". Indicative budget: " + (answers.budget || "") + ".",
    "",
    "Find authoritative unit costs / rate norms for the likely budget line items of this kind of project:",
    "- Field and programme staff salaries or honoraria",
    "- Training per participant per day",
    "- Input, seed or material kits per household or unit",
    "- Travel and field operations",
    "- Office and administrative overheads",
    "- The relevant state minimum wage or MGNREGA wage rate",
  ].join("\n");
}

async function runRfpDraft(rfpText, answers, orgProfile, opts = {}) {
  const progress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  let analysis;
  if (opts.analysis && typeof opts.analysis === "object") {
    analysis = opts.analysis;
  } else {
    progress("intake");
    const intake = await analyzeRFP(rfpText, orgProfile, { formatDocText: opts.formatDocText });
    if (!intake._parsed) throw new Error("RFP intake failed to parse (stop=" + intake._stop + ")");
    analysis = intake.analysis;
  }
  progress("research");
  const researchRes = await research(researchBrief(answers, analysis));
  if (!researchRes._parsed) throw new Error("Research failed to parse (stop=" + researchRes._stop + ")");
  progress("cost");
  const costRes = await costResearch(costBrief(answers));
  if (!costRes._parsed) throw new Error("Cost research failed to parse (stop=" + costRes._stop + ")");
  progress("build");
  const built = await buildSubstance({ orgProfile, rfpAnalysis: analysis, answers, research: researchRes.data, costNorms: costRes.data });
  if (!built._parsed) throw new Error("Build substance failed to parse (stop=" + built._stop + ")");
  const substance = built.substance;
  // Output language chosen per proposal (defaults to the interface language on the client).
  if (opts.language === "English" || opts.language === "Hindi") substance.lang = opts.language;
  progress("compose");
  const composeInput = JSON.parse(JSON.stringify(substance));
  delete composeInput.flags;
  delete composeInput.budget_adjustments;
  delete composeInput.rates_to_confirm;

  let composedOut;
  let outTitle = "";
  let outSubtitle = "";
  if (hasPrescribedFormat(substance)) {
    // Scenario B: the donor's sections ARE the document structure.
    const r = await composeByFormat(composeInput, { lang: substance.lang });
    if (!r.sections || !r.sections.length) throw new Error("Compose (format) produced no sections");
    if (r._missing && r._missing.length) throw new Error("Compose (format) missing sections: " + r._missing.join(", "));
    outTitle = r.title || "";
    outSubtitle = r.subtitle || "";
    composedOut = { title: outTitle, subtitle: outSubtitle, sections: r.sections };
  } else {
    // Scenario A: Prastav's standard structure.
    const composed = await composeProposal(composeInput, { lang: substance.lang });
    if (composed._missing && composed._missing.length) throw new Error("Compose missing sections: " + composed._missing.join(", "));
    outTitle = composed.title || "";
    outSubtitle = composed.subtitle || "";
    composedOut = {
      title: outTitle,
      subtitle: outSubtitle,
      problem: composed.problem || "",
      objective: composed.objective || "",
      strategy: composed.strategy || "",
      results_narrative: composed.results_narrative || "",
      activities: composed.activities || "",
      sustainability: composed.sustainability || "",
    };
  }

  progress("draft");
  const meta = {
    title: outTitle || substance.theme || "Project Proposal",
    subtitle: outSubtitle || "",
    theme: substance.theme,
    geography: geoLineFrom(substance),
    duration: substance.duration,
    budget: substance.budget,
    budget_grand_total: substance.budget_grand_total,
    rates_to_confirm: substance.rates_to_confirm || [],
    flags: substance.flags || [],
    donor: substance.donor || analysis.donor || "",
  };
  return { meta, substance, composed: composedOut, analysis };
}

module.exports = { runRfpDraft };
