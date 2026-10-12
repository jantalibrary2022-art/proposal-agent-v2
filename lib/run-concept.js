// lib/run-concept.js
// CONCEPT-NOTE pipeline (Change 6a). A trimmed version of the open/RFP pipeline:
// intake -> light grounded research -> concept composition. It deliberately does
// NOT run cost-research or build the heavy substance artifacts (logframe, timeline,
// risk table, line-item budget); a concept note carries only an indicative budget
// band in prose and a short source list. Split into a reviewable DRAFT (the paid
// AI stages) and a separate, free RENDER step, like run-open. Output is stored as
// a dynamic composed.sections object so the existing section/render machinery and
// the review UI handle it unchanged.
const { conceptIntake } = require("./concept-intake");
const { research } = require("./research");
const { composeConcept } = require("./compose-concept");
const { renderProposalHTML } = require("./proposal-template");
const { generateDocx } = require("./proposal-docx");

function geoLineFrom(s) {
  const g = (s && s.geography) || {};
  return [g.block && g.block + " Block", g.district && g.district + " District", g.state].filter(Boolean).join(", ");
}

function researchBriefFromConcept(b) {
  const g = b.geography || {};
  const where = [g.block, g.district, g.state].filter(Boolean).join(", ");
  return [
    "CONCEPT NOTE research, 2-3 page note. Keep it tight: find only the few sharpest, most authoritative figures and the key policy/scheme context. Do not over-research.",
    "THEME: " + b.theme + ".",
    "WORKING TITLE: " + (b.working_title || "") + ".",
    "PROBLEM FOCUS: " + (b.problem_focus || ""),
    "GEOGRAPHY: " + where + ". " + (g.coverage || ""),
    "TARGET GROUP: " + b.target + ".",
    "CANDIDATE SDG TARGETS (confirm relevance): " + ((b.sdg_targets || []).join(", ") || "none stated"),
    "COHERENCE ANGLE (find the real schemes/programmes/actors to position against): " + (b.coherence_angle || ""),
    "",
    "Evidence needed (find authoritative, cited data for each; never invent a figure; if not found, say so in gaps):",
    ...(b.research_needs || []).map((x) => "- " + x),
  ].join("\n");
}

function substanceFrom(brief, orgProfile, sources, lang) {
  const contact = (orgProfile && orgProfile.contact) || {};
  const donorAgnostic = !brief.donor || /agnostic/i.test(brief.donor);
  return {
    kind: "concept",
    lang,
    org: { name: (orgProfile && orgProfile.name) || "The applicant organisation", contact },
    geography: brief.geography || {},
    duration: brief.duration || "",
    budget: brief.budget_band || "",
    donor: donorAgnostic ? "Donor-agnostic" : brief.donor,
    sources: sources || [],
    // No matrix / timeline / risks / budget_table: a concept note has none, and
    // the renderers skip those (empty) artifacts automatically.
  };
}

function metaFrom(substance, composed, brief) {
  return {
    kind: "concept",
    title: (composed && composed.title) || (brief && brief.working_title) || "Concept Note",
    subtitle: (composed && composed.subtitle) || "",
    theme: brief.theme,
    geography: geoLineFrom(substance),
    duration: substance.duration,
    budget: substance.budget,
    budget_basis: brief.budget_basis || "",
    donor: substance.donor,
    sdg_targets: brief.sdg_targets || [],
    flags: brief.budget_basis === "estimated-to-confirm" ? ["Indicative budget band, applicant to confirm."] : [],
  };
}

function docDataFrom(substance, composed) {
  const s = substance;
  const c = composed || {};
  const donorAgnostic = !s.donor || /agnostic/i.test(s.donor);
  const contact = (s.org && s.org.contact) || {};
  return {
    lang: s.lang,
    title: c.title || "Concept Note",
    subtitle: c.subtitle || "",
    geography: geoLineFrom(s),
    duration: s.duration,
    budget: s.budget,
    submittedTo: donorAgnostic ? "" : s.donor,
    submittedBy: s.org.name,
    orgName: s.org.name,
    orgAddress: contact.address || "Ranchi, Jharkhand",
    orgContact: contact.email || "contact@example.org",
    // Dynamic section list drives the layout; empty heavy artifacts are skipped.
    sections: (c && Array.isArray(c.sections) && c.sections.length) ? c.sections : null,
    sources: s.sources,
  };
}

async function runConceptDraft(answers, orgProfile, opts = {}) {
  const progress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  let brief;
  if (opts.brief && typeof opts.brief === "object") {
    brief = opts.brief;
  } else {
    progress("intake");
    const intake = await conceptIntake(
      { orgProfile, answers, formatDoc: opts.formatDoc || null, userDocs: opts.applicantEvidence || null },
      {}
    );
    if (!intake._parsed) throw new Error("Concept intake failed to parse (stop=" + intake._stop + ")");
    brief = intake.data;
  }
  const lang = opts.language === "Hindi" ? "Hindi" : "English";

  progress("research");
  const researchRes = await research(researchBriefFromConcept(brief), { maxSearches: opts.maxSearches || 6 });
  // Research is best-effort for a concept note: if it fails to parse, proceed with
  // an empty evidence set rather than failing the whole note (the composer then
  // writes honestly around the gap).
  const researchData = researchRes._parsed ? researchRes.data : {};

  progress("compose");
  const composedRes = await composeConcept(brief, researchData, orgProfile, { lang });
  if (!composedRes._parsed) throw new Error("Concept compose failed to parse");

  const substance = substanceFrom(brief, orgProfile, composedRes.sources, lang);
  const composed = composedRes.composed;
  progress("draft");
  return { meta: metaFrom(substance, composed, brief), substance, composed, brief };
}

async function renderConceptFiles(substance, composed) {
  const { chromium } = require("playwright");
  const docData = docDataFrom(substance, composed);
  // Concept-note render: no table of contents, no back page. The cover + short body
  // keep it to a few pages. No Excel (indicative budget only, no line-item sheet).
  const html = renderProposalHTML(docData, { template: "institutional", font: "serif-classic", includeToc: false, includeBack: false });
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
  return { pdf, docx };
}

async function runConceptPipeline(answers, orgProfile, opts = {}) {
  const draft = await runConceptDraft(answers, orgProfile, opts);
  const progress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  progress("render");
  const files = await renderConceptFiles(draft.substance, draft.composed);
  progress("done");
  return { ...draft, files };
}

module.exports = { runConceptDraft, renderConceptFiles, runConceptPipeline, docDataFrom, geoLineFrom };
