// lib/sections.js
// Single source of truth for a proposal's narrative section structure.
//
// Backward compatible by design. A proposal whose `composed` object has no
// `sections` array is read through its legacy flat fields (problem, objective,
// strategy, results_narrative, activities, sustainability, plus the title and
// subtitle meta fields). When a `composed.sections` array IS present (used by
// donor-prescribed-format proposals in a later phase), that array is the source
// of truth. This lets the review UI, the file renderers and the revise/section
// routes consume one ordered list regardless of which shape a proposal is in.
//
// A dynamic section entry has the shape:
//   { key: string, heading: string, body: string, single?: boolean, artifact?: string|null }
// where `artifact` (null by default) names a structured block the renderer should
// attach to this section (e.g. "matrix", "budget", "timeline", "risks").

// The house (default) structure: Prastav's standard narrative sections, in order.
// `key` is the stable field name; `labelKey` maps to the dictionary label used by
// the UI and the renderers; `single` marks a one-line field; `meta` marks the
// title/subtitle, which are editable regardless of the body structure.
const HOUSE_SECTIONS = [
  { key: "title",             labelKey: "secTitle",         single: true,  meta: true },
  { key: "subtitle",          labelKey: "secSubtitle",      single: true,  meta: true },
  { key: "problem",           labelKey: "secProblem",       single: false },
  { key: "objective",         labelKey: "secObjective",     single: false },
  { key: "strategy",          labelKey: "secStrategy",      single: false },
  { key: "results_narrative", labelKey: "secResults",       single: false },
  { key: "activities",        labelKey: "secActivities",    single: false },
  { key: "sustainability",    labelKey: "secSustainability",single: false },
];

// Every key a legacy (house) proposal exposes, in house order.
const HOUSE_KEYS = HOUSE_SECTIONS.map((s) => s.key);

// The editable narrative keys only (excludes the title/subtitle meta), house order.
const NARRATIVE_KEYS = HOUSE_SECTIONS.filter((s) => !s.meta).map((s) => s.key);

// True when the proposal carries an explicit, non-empty dynamic section list.
function hasDynamic(composed) {
  return !!(composed && Array.isArray(composed.sections) && composed.sections.length);
}

function keyOf(section, i) {
  return String((section && section.key) || "s" + (i + 1));
}

// Ordered section list: [{ key, heading, body, single, artifact }].
// `headings` (optional) maps a labelKey -> localized label for the house case;
// pass the active dictionary so house headings resolve to the viewer's language.
function toSectionList(composed, headings) {
  const c = composed || {};
  if (hasDynamic(c)) {
    return c.sections.map((s, i) => ({
      key: keyOf(s, i),
      heading: String((s && s.heading) || ""),
      body: s && typeof s.body === "string" ? s.body : "",
      single: !!(s && s.single),
      artifact: (s && s.artifact) || null,
    }));
  }
  const L = headings || {};
  return HOUSE_SECTIONS.map((s) => ({
    key: s.key,
    heading: L[s.labelKey] || "",
    body: typeof c[s.key] === "string" ? c[s.key] : "",
    single: !!s.single,
    artifact: null,
  }));
}

// The keys valid for revise/section on THIS proposal (the server-side gate).
// title/subtitle stay editable whatever the body structure.
function sectionKeys(composed) {
  const c = composed || {};
  if (hasDynamic(c)) {
    const keys = c.sections.map((s, i) => keyOf(s, i));
    return Array.from(new Set(["title", "subtitle"].concat(keys)));
  }
  return HOUSE_KEYS.slice();
}

// Read one section's current text by key. Works for both shapes.
function readSection(composed, key) {
  const c = composed || {};
  if (key === "title" || key === "subtitle") {
    return typeof c[key] === "string" ? c[key] : "";
  }
  if (hasDynamic(c)) {
    for (let i = 0; i < c.sections.length; i++) {
      if (keyOf(c.sections[i], i) === key) {
        const b = c.sections[i] && c.sections[i].body;
        return typeof b === "string" ? b : "";
      }
    }
    return "";
  }
  return typeof c[key] === "string" ? c[key] : "";
}

// The donor heading for a dynamic section key, or "" for a house/meta key (the
// caller then falls back to its own labels). Used to tell the revise engine which
// donor section it is working on.
function sectionHeading(composed, key) {
  const c = composed || {};
  if (hasDynamic(c)) {
    for (let i = 0; i < c.sections.length; i++) {
      if (keyOf(c.sections[i], i) === key) return String((c.sections[i] && c.sections[i].heading) || "");
    }
  }
  return "";
}

// Return a NEW composed object with one section's text updated. Never mutates the
// input. For a dynamic proposal it updates the matching array entry's body; for a
// legacy proposal it sets the flat field, exactly as before.
function writeSection(composed, key, text) {
  const c = Object.assign({}, composed || {});
  const val = typeof text === "string" ? text : "";
  if (key === "title" || key === "subtitle") {
    c[key] = val;
    return c;
  }
  if (hasDynamic(c)) {
    c.sections = c.sections.map((s, i) =>
      keyOf(s, i) === key ? Object.assign({}, s, { body: val }) : s
    );
    return c;
  }
  c[key] = val;
  return c;
}

// ---- Render layout -------------------------------------------------------
// The file renderers (PDF, Word) assemble a document from an ordered list of
// blocks, each a prose section, a structured artifact, or both. This returns
// that ordered list so both renderers drive off one structure.
//
// A block: { labelKey?, heading?, body?, artifact? }
//   labelKey  resolve the heading from the renderer's own LABELS (house case)
//   heading   a literal heading (donor-format case)
//   body      prose for the section (may be empty)
//   artifact  one of "timeline" | "matrix" | "risks" | "budget" | "references"
//             | null — a structured block the renderer attaches here.
// A renderer resolves the title as `heading || LABELS[labelKey]`, renders the
// prose if `body` is non-empty, then the artifact if present, and skips a block
// that would produce nothing (matches the previous skip-empty behaviour).

// The house document order, exactly as the renderers produced it before the
// dynamic-section work: four prose chapters, the timeline, results prose with
// the logframe matrix, the risk table, sustainability, the budget, references.
const HOUSE_LAYOUT = [
  { labelKey: "sec_problem",        field: "problem",           artifact: null },
  { labelKey: "sec_objective",      field: "objective",         artifact: null },
  { labelKey: "sec_strategy",       field: "strategy",          artifact: null },
  { labelKey: "sec_activities",     field: "activities",        artifact: null },
  { labelKey: "sec_timeline",       field: null,                artifact: "timeline" },
  { labelKey: "sec_results",        field: "results_narrative", artifact: "matrix" },
  { labelKey: "sec_risk",           field: null,                artifact: "risks" },
  { labelKey: "sec_sustainability", field: "sustainability",    artifact: null },
  { labelKey: "sec_budget",         field: null,                artifact: "budget" },
  { labelKey: "sec_references",     field: null,                artifact: "references" },
];

// Artifacts appended after a donor's own sections (when the composer did not
// place them), in a sensible default order, so the logframe, timeline, risks
// and budget are never lost. References always close the document.
const APPEND_ARTIFACTS = [
  { artifact: "timeline",   labelKey: "sec_timeline" },
  { artifact: "matrix",     labelKey: "sec_results" },
  { artifact: "risks",      labelKey: "sec_risk" },
  { artifact: "budget",     labelKey: "sec_budget" },
];

// `src` is the renderer's doc-data object: for the house case it carries the flat
// fields (problem, objective, ...); for a donor-format proposal it carries a
// `sections` array (set by docDataFrom from composed.sections).
function toRenderLayout(src) {
  const s = src || {};
  if (Array.isArray(s.sections) && s.sections.length) {
    const blocks = s.sections.map((sec, i) => ({
      heading: String((sec && sec.heading) || ""),
      body: sec && typeof sec.body === "string" ? sec.body : "",
      artifact: (sec && sec.artifact) || null,
    }));
    const placed = new Set(blocks.map((b) => b.artifact).filter(Boolean));
    APPEND_ARTIFACTS.forEach((a) => {
      if (!placed.has(a.artifact)) blocks.push({ labelKey: a.labelKey, body: "", artifact: a.artifact });
    });
    blocks.push({ labelKey: "sec_references", body: "", artifact: "references" });
    return blocks;
  }
  return HOUSE_LAYOUT.map((b) => ({
    labelKey: b.labelKey,
    body: b.field ? (typeof s[b.field] === "string" ? s[b.field] : "") : "",
    artifact: b.artifact,
  }));
}

module.exports = {
  HOUSE_SECTIONS,
  HOUSE_KEYS,
  NARRATIVE_KEYS,
  hasDynamic,
  toSectionList,
  sectionKeys,
  readSection,
  writeSection,
  sectionHeading,
  toRenderLayout,
};
