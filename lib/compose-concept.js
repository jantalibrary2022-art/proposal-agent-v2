// lib/compose-concept.js
// Composer for the CONCEPT-NOTE engine (Change 6a). Writes a 2-3 page concept
// note as a dynamic section list (composed.sections), so it reuses the existing
// section/render machinery (lib/sections.js toRenderLayout). It composes against
// the concept-note spec (claude/reference/concept-note-spec.md): the Part A quality
// gates are built into the system prompt, and the structure is either the house
// default (Part B) or a donor-prescribed section list detected at intake.
//
// A concept note is short and evidence-sparse, so composition is a SINGLE
// structured call (with one retry), not the per-section fan-out the full-proposal
// donor composer uses. No heavy artifacts (logframe, timeline, risk table,
// line-item budget) are produced; the indicative budget is prose.
require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

// House concept-note structure (Part B, sections 2-9; the identification header is
// rendered from meta, not as a body section). Stable keys for revise/section.
const HOUSE_CONCEPT_SECTIONS = [
  { key: "problem_rationale", heading: "Problem and Rationale" },
  { key: "strategic_fit",     heading: "Strategic Fit and Coherence" },
  { key: "goal_objectives",   heading: "Goal and Objectives" },
  { key: "approach",          heading: "Approach" },
  { key: "expected_results",  heading: "Expected Results" },
  { key: "capacity",          heading: "Organisational Capacity" },
  { key: "budget_indicative", heading: "Indicative Budget and Duration" },
  { key: "sustainability",    heading: "Sustainability and Partnerships" },
];

const SYSTEM = `You are a senior proposal writer for the Indian development sector, with 24 years of field experience, writing a CONCEPT NOTE: a 2 to 3 page screening document whose job is to earn an invitation to submit a full proposal, or to open a funder conversation. It is judged mainly on RELEVANCE and strategic FIT, not implementation detail. You write as an expert who knows the ground, not as a form-filler.

You are given a BRIEF (the fixed frame and plan), grounded RESEARCH (cited evidence), and the ORGANISATION PROFILE. You write the note's sections to the section list given to you.

QUALITY GATES (every concept note must satisfy these):
1. Relevance first. The problem, its significance, and the fit to the funder's priority come in the first section, not built up to.
2. Coherence, stated explicitly. Include a clear sentence positioning the action against what government schemes and other actors already do, complementing not duplicating. Use the coherence angle in the brief, grounded in the research's policy context.
3. RBM results spine. Use output, outcome and impact in their correct senses. Do not call activities results. Keep a legible problem-to-change logic.
4. Theory of change in miniature. Carry the brief's if/then/because and name the single most important assumption. Compressed, not a full ToC.
5. Framework alignment, specific. Name the specific SDG target(s) from the brief (e.g. SDG 3.2), not "contributes to the SDGs", and the funder's own framework where one is named.
6. Evidence density with sourcing. Use a few sharp, cited figures from the RESEARCH only. NEVER invent a figure, source or URL. If the research has a gap, write around it honestly; do not fabricate. Cite inline as (Source Title, Year).
7. Length discipline. Stay within the overall word budget given. A concept note is a screening gate; overrun is a fault.
8. Bounded ask. State the indicative budget band, duration, geography, scale and target group. The budget is an order-of-magnitude band in prose, NOT a line-item budget.
9. Capacity by evidence. Show track record and comparable work from the profile; do not assert being well-placed.
10. Distinctiveness. State the value-add plainly.

STYLE: comma-based prose, no em-dashes as sentence connectors, no editorial adjectives or filler. NO markdown tables, NO pipe layout, NO headings inside a section body (the heading is supplied). Prose and, sparingly, short bullet lists only. Write in the requested OUTPUT LANGUAGE.

Output ONLY a single JSON object:
{ "title": string, "subtitle": string, "sections": [ { "key": string, "heading": string, "body": string } ], "sources": [ { "title": string, "url": string } ] }
- Use EXACTLY the keys and headings from the SECTION LIST given, in that order.
- "sources" lists only the research sources you actually cited, each with its real title and URL from the research. No invented entries.`;

function extractJson(text) {
  const t = (text || "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < 0) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
}

function slug(s, i) {
  const base = String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  return base || ("s" + (i + 1));
}

// The ordered section list the composer must write, by mode.
function sectionListFor(brief) {
  const fmt = (brief && brief.format) || {};
  if (fmt.kind === "donor" && Array.isArray(fmt.sections) && fmt.sections.length) {
    return fmt.sections.map((s, i) => ({
      key: slug(s && s.name, i),
      heading: String((s && s.name) || ("Section " + (i + 1))),
      what_it_wants: String((s && s.what_it_wants) || ""),
    }));
  }
  return HOUSE_CONCEPT_SECTIONS.map((s) => ({ key: s.key, heading: s.heading, what_it_wants: "" }));
}

// Overall word budget: a donor limit if given (word limit, else page limit at ~450
// words/page), otherwise a concept-note default of ~1200 words (about 2.5 pages).
function wordBudget(brief) {
  const limits = String((brief && brief.format && brief.format.limits) || "");
  const w = limits.match(/(\d[\d,]{2,})\s*word/i);
  if (w) { const n = parseInt(w[1].replace(/,/g, ""), 10); if (n >= 200 && n <= 4000) return n; }
  const p = limits.match(/(\d{1,2})\s*page/i);
  if (p) { const n = parseInt(p[1], 10); if (n >= 1 && n <= 8) return n * 450; }
  return 1200;
}

async function composeConcept(brief, research, orgProfile, opts = {}) {
  const lang = opts.lang === "Hindi" ? "Hindi" : "English";
  const list = sectionListFor(brief);
  const budget = wordBudget(brief);
  const userMsg = [
    "OUTPUT LANGUAGE: " + lang + ".",
    "OVERALL WORD BUDGET (hard ceiling for the whole note, across all sections): " + budget + " words. Keep well within it.",
    "",
    "SECTION LIST to write (use these keys and headings, in order):",
    JSON.stringify(list, null, 2),
    "",
    "BRIEF:",
    JSON.stringify(brief, null, 2),
    "",
    "GROUNDED RESEARCH (the only source of figures; cite inline as (Title, Year); never invent):",
    JSON.stringify(research || {}, null, 2),
    "",
    "ORGANISATION PROFILE (for the capacity section and applicant framing):",
    JSON.stringify(orgProfile || {}, null, 2),
  ].join("\n");

  async function once() {
    const resp = await client.messages.stream({
      model: opts.model || MODEL,
      max_tokens: opts.maxTokens || 8000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMsg }],
    }).finalMessage();
    const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return { data: extractJson(raw), raw, stop: resp.stop_reason };
  }

  let out = await once();
  if (!out.data || !Array.isArray(out.data.sections) || !out.data.sections.length) {
    out = await once();
  }
  if (!out.data || !Array.isArray(out.data.sections) || !out.data.sections.length) {
    return { _parsed: false, _stop: out.stop, _raw: out.raw };
  }

  // Normalise to the dynamic composed shape used across the renderers/UI.
  const byKey = new Map(list.map((s) => [s.key, s]));
  const sections = out.data.sections
    .map((s, i) => {
      const key = (s && s.key && byKey.has(s.key)) ? s.key : slug(s && s.heading, i);
      const spec = byKey.get(key);
      return {
        key,
        heading: String((s && s.heading) || (spec && spec.heading) || ""),
        body: s && typeof s.body === "string" ? s.body : "",
        artifact: null,
      };
    })
    .filter((s) => s.body.trim());

  const sources = Array.isArray(out.data.sources)
    ? out.data.sources
        .filter((x) => x && x.url && String(x.url).startsWith("http"))
        .map((x) => ({ title: String(x.title || x.url), url: String(x.url) }))
    : [];

  return {
    _parsed: true,
    composed: {
      title: String(out.data.title || (brief && brief.working_title) || "Concept Note"),
      subtitle: String(out.data.subtitle || ""),
      sections,
    },
    sources,
  };
}

module.exports = { composeConcept, HOUSE_CONCEPT_SECTIONS, sectionListFor, wordBudget };
