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

module.exports = {
  HOUSE_SECTIONS,
  HOUSE_KEYS,
  NARRATIVE_KEYS,
  hasDynamic,
  toSectionList,
  sectionKeys,
  readSection,
  writeSection,
};
