// lib/run-open.js
// OPEN-mode pipeline split into a reviewable DRAFT (the paid AI stages) and a
// separate RENDER step (free, fast). Lets the user review/edit before files are made.
// Same proven stages as the test-open-* scripts, chained in memory.

const { chromium } = require("playwright");
const { openIntake } = require("./open-intake");
const { research } = require("./research");
const { costResearch } = require("./cost-research");
const { buildSubstance } = require("./build-substance");
const { composeProposal } = require("./compose");
const { renderProposalHTML } = require("./proposal-template");
const { generateDocx } = require("./proposal-docx");
const { generateBudgetXlsx } = require("./budget-xlsx");

function geoLineFrom(s) {
  const g = (s && s.geography) || {};
  return [g.block && g.block + " Block", g.district && g.district + " District", g.state].filter(Boolean).join(", ");
}

function researchBriefFromBrief(b) {
  const g = b.geography || {};
  const where = [g.block, g.district, g.state].filter(Boolean).join(", ");
  return [
    "PROJECT THEME: " + b.theme + ".",
    "WORKING TITLE: " + (b.working_title || "") + ".",
    "CORE IDEA: " + (b.problem_focus || ""),
    "GEOGRAPHY: " + where + ". " + (g.coverage || ""),
    "TARGET GROUP: " + b.target + ".",
    "DURATION: " + b.duration + ".",
    "",
    "PLANNED ACTIVITIES:",
    ...(b.planned_activities || []).map((a) => "- " + a),
    "",
    "Research needs (find authoritative, cited data for each; never invent a figure):",
    ...(b.research_needs || []).map((x) => "- " + x),
  ].join("\n");
}

function costBriefFromBrief(b) {
  const g = b.geography || {};
  const where = [g.block, g.district, g.state].filter(Boolean).join(", ");
  const items = (b.likely_budget_lines || []).map((l) => "- " + l.item + " (unit: " + l.unit + "; funds: " + l.contributes + ")");
  return [
    "STATE: " + (g.state || "") + ".",
    "CONTEXT: " + b.theme + " project. Target: " + b.target + ". Geography: " + where + ". Duration: " + b.duration + ". Indicative budget envelope: " + b.budget_ceiling + " (" + b.budget_basis + ").",
    "",
    "Find authoritative unit costs / rate norms for these budget line items:",
    items.join("\n"),
  ].join("\n");
}

function docDataFrom(substance, composed) {
  const s = substance;
  const c = composed || {};
  const donorAgnostic = !s.donor || /agnostic/i.test(s.donor);
  const contact = (s.org && s.org.contact) || {};
  return {
    lang: s.lang,
    title: c.title || "Project Proposal",
    subtitle: c.subtitle || "",
    geography: geoLineFrom(s),
    duration: s.duration,
    budget: s.budget,
    submittedTo: donorAgnostic ? "" : s.donor,
    submittedBy: s.org.name,
    orgName: s.org.name,
    orgAddress: contact.address || "Ranchi, Jharkhand",
    orgContact: contact.email || "contact@example.org",
    problem: c.problem,
    objective: c.objective,
    strategy: c.strategy,
    activities: c.activities,
    results_narrative: c.results_narrative,
    sustainability: c.sustainability,
    // Donor-prescribed dynamic section list, when present (Scenario B). The
    // renderers drive their layout from this via lib/sections toRenderLayout;
    // for a house-format proposal it is null and the flat fields above are used.
    sections: (c && Array.isArray(c.sections) && c.sections.length) ? c.sections : null,
    matrix: s.matrix,
    sources: s.sources,
    budget_table: s.budget_table,
    risks: s.risks,
    timeline: s.timeline,
  };
}

async function renderProposalFiles(substance, composed) {
  const docData = docDataFrom(substance, composed);
  const html = renderProposalHTML(docData, { template: "institutional", font: "serif-classic", includeToc: true, includeBack: true });
  const browser = await chromium.launch();
  let pdf;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    pdf = await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
  const docx = await generateDocx(docData);
  const xlsx = await generateBudgetXlsx(docData);
  return { pdf, docx, xlsx };
}

function metaFrom(substance, composed, brief) {
  return {
    title: (composed && composed.title) || (brief && brief.working_title) || "Project Proposal",
    subtitle: (composed && composed.subtitle) || "",
    theme: substance.theme,
    geography: geoLineFrom(substance),
    duration: substance.duration,
    budget: substance.budget,
    budget_grand_total: substance.budget_grand_total,
    rates_to_confirm: substance.rates_to_confirm || [],
    flags: substance.flags || [],
  };
}

async function runOpenDraft(answers, orgProfile, opts = {}) {
  const progress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  let brief;
  if (opts.brief && typeof opts.brief === "object") {
    brief = opts.brief;
  } else {
    progress("intake");
    const intake = await openIntake({ orgProfile, answers }, { mode: "direct" });
    if (!intake._parsed) throw new Error("Intake failed to parse (stop=" + intake._stop + ")");
    brief = intake.data;
  }
  progress("research");
  const researchRes = await research(researchBriefFromBrief(brief));
  if (!researchRes._parsed) throw new Error("Research failed to parse (stop=" + researchRes._stop + ")");
  progress("cost");
  const costRes = await costResearch(costBriefFromBrief(brief));
  if (!costRes._parsed) throw new Error("Cost research failed to parse (stop=" + costRes._stop + ")");
  progress("build");
  const built = await buildSubstance({ orgProfile, rfpAnalysis: brief, answers, research: researchRes.data, costNorms: costRes.data, applicantEvidence: opts.applicantEvidence || null, chosenApproach: opts.chosenApproach || (brief && brief.chosen_approach) || null });
  if (!built._parsed) throw new Error("Build substance failed to parse (stop=" + built._stop + ")");
  const substance = built.substance;
  // Output language chosen per proposal (defaults to the interface language on the client).
  if (opts.language === "English" || opts.language === "Hindi") substance.lang = opts.language;
  progress("compose");
  const composeInput = JSON.parse(JSON.stringify(substance));
  delete composeInput.flags;
  delete composeInput.budget_adjustments;
  delete composeInput.rates_to_confirm;
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
  return { meta: metaFrom(substance, composedClean, brief), substance, composed: composedClean, brief };
}

async function runOpenPipeline(answers, orgProfile, opts = {}) {
  const draft = await runOpenDraft(answers, orgProfile, opts);
  const progress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  progress("render");
  const files = await renderProposalFiles(draft.substance, draft.composed);
  progress("done");
  return { ...draft, files };
}

module.exports = { runOpenDraft, renderProposalFiles, runOpenPipeline, docDataFrom, geoLineFrom };
