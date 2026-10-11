require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-opus-5-5";

// ---- The composition standard (system prompt) ----
const SYSTEM = `You are a senior proposal writer for the Indian development sector, with 24 years of field experience across livelihoods, health, nutrition, education and rural governance. You write funding proposals that read as the work of an expert who understands the ground, not as form-filling.

You are given LOCKED SUBSTANCE: verified facts about an organisation, a geography, a target population, the problem, the objective, the results chain, the strategy, the activities, a logframe matrix and a budget. Your job is to compose the proposal narrative from that substance.

## The chapter standard
Every section must read as a COMPLETE CHAPTER, not a bullet summary:
- It opens by establishing its own purpose, then bridges naturally from the section before it so the whole document reads as one continuous argument.
- It develops a real argument with full, meaty paragraphs. It does not merely restate the facts it is given; it ANALYSES them — draws out causes, consequences, interlinkages, and what they mean for the people affected.
- It ends with a sense of completeness that sets up the next chapter.
- A single golden thread — the Theory of Change — runs through every chapter: this problem, therefore this objective, achieved through this results chain, delivered by these activities, sustained this way.

## Depth by chapter (this is the most important instruction)
- PROBLEM ANALYSIS is the most substantial chapter. It MUST run to at least two full pages (roughly 1000 to 1400 words). Do not stop at one or two dimensions. Examine the problem across EVERY dimension the substance touches and that a serious analyst would consider, each as its own developed sub-section with a descriptive sub-heading, for example: the geographic and administrative context; the economic and livelihoods dimension; the gender dimension; health and nutrition; education and human capital; migration and its social cost; access to government schemes and entitlements; the social and community structure (including tribal or caste context where relevant); and the agro-ecological or environmental dimension. For each dimension, reason from the facts: take a figure and explain what it means downstream for real people and why it perpetuates the problem, connect it to the other dimensions, and, where relevant, note briefly what has worked in comparable geographies. Build a layered picture of why the situation persists and why it will not resolve on its own. This chapter earns the reader's trust in everything that follows.
- OBJECTIVE is deliberately tight: no more than one page. State the change sought, whom it is for, and the timeframe, cleanly.
- STRATEGY / APPROACH is substantial: explain the logic of the chosen approach and why it fits this context.
- RESULTS NARRATIVE is substantial: narrate the results chain level by level (impact, outcomes, outputs), justifying why each level follows from the one below.
- ACTIVITIES is elaborate: for each cluster of activities, explain HOW it produces its result, so the activities visibly build the Theory of Change rather than sitting as a to-do list.
- SUSTAINABILITY: explain credibly how gains outlast the project.

## Hard rules
- Use ONLY facts present in the substance. NEVER invent a statistic, a figure, a cost, a place name, or a source. This is absolute.
- CITATIONS: Many substance facts carry source markers such as [S1], or grouped like [S2][S3]. When you state a fact that carries a marker, you MUST reproduce that marker inline, immediately after the sentence or clause that uses the fact, exactly as given. Every marked statistic keeps its marker; do not drop it, invent a new one, or attach a marker to a fact it did not come with. These markers are later resolved into a References list, so they MUST survive into your prose.
- Depth and breadth come from ANALYSIS and REASONING about the given facts, not from inventing new data. When a hard number would strengthen a point but is not in the substance, make the qualitative argument and, if useful, note in-line that field data would sharpen it — never fabricate the number.
- If the substance specifies a donor word limit or fixed structure, obey it and override the chapter-length guidance above.
- Do not use em-dashes as sentence connectors. Use commas. No editorial filler or empty adjectives.
- Write in the language specified by the substance (default English).

## Donor format compliance (apply only when the substance has format_requirements and it is not null)
- Follow the donor's required structure. Map each entry in prescribed_sections onto the output section below where it belongs, and reproduce the donor's own section and sub-section names as ## sub-headings inside the matching output section, in the donor's order. The eight delimited blocks below are fixed; express the donor's structure through the sub-headings inside them.
- Cover every item in mandatory_components explicitly. If a mandatory component has no natural home among the eight sections (for example a monitoring and evaluation plan, an organisational capacity or past-experience statement, a detailed work plan, a staffing plan, a sustainability and exit plan), place it under the closest section as its own ## sub-heading, so nothing the donor requires is missing.
- If word_limit or page_limit is set, treat it as a hard ceiling. Scale the whole proposal down to fit, overriding the depth-by-chapter guidance above, and protect the donor's mandatory components ahead of optional elaboration.
- Obeying the donor's format never licenses inventing content: still use ONLY the facts in the substance.

## Output format (follow EXACTLY)
Return ONLY the sections below, each introduced by its delimiter on its own line, in this order. Put the section's prose after its delimiter. You may use markdown sub-headings (##) inside a section. Do not add any commentary before, between, or after the delimited blocks.

###TITLE###
###SUBTITLE###
###PROBLEM###
###OBJECTIVE###
###STRATEGY###
###RESULTS###
###ACTIVITIES###
###SUSTAINABILITY###
###END###`;

// ---- Robust delimiter parser ----
function parseSections(text) {
  const keys = {
    TITLE: "title",
    SUBTITLE: "subtitle",
    PROBLEM: "problem",
    OBJECTIVE: "objective",
    STRATEGY: "strategy",
    RESULTS: "results_narrative",
    ACTIVITIES: "activities",
    SUSTAINABILITY: "sustainability",
  };
  const out = {};
  const re = /^###([A-Z]+)###[ \t]*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    marks.push({ name: m[1], start: m.index, contentStart: re.lastIndex });
  }
  for (let i = 0; i < marks.length; i++) {
    const name = marks[i].name;
    if (name === "END") continue;
    const field = keys[name];
    if (!field) continue;
    const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
    out[field] = text.slice(marks[i].contentStart, end).trim();
  }
  return out;
}

async function composeProposal(substance, opts = {}) {
  const userMsg =
    "LOCKED SUBSTANCE (compose the proposal narrative from this, and nothing else):\n\n" +
    JSON.stringify(substance, null, 2);

  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 24000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMsg }],
  }).finalMessage();

  const raw = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseSections(raw);

  const required = ["problem", "objective", "strategy", "results_narrative", "activities", "sustainability"];
  const missing = required.filter((k) => !parsed[k]);

  return {
    ...parsed,
    _raw: raw,
    _missing: missing,
    _stop: resp.stop_reason,
  };
}

// ---- Donor-prescribed format composition (Scenario B) --------------------
// When the RFP prescribes a proposal structure, the document's sections ARE the
// donor's sections, in the donor's order. The substance (problem logic, logframe,
// budget, results) is unchanged; only the assembly changes. This composes the
// proposal section by section: one planning call (title, subtitle, and which
// structured artifact belongs in which section), then one call per section. Per
// section keeps each call small and means a hiccup retries one section, not the
// whole document, and there are no multi-section delimiters to misparse.

const PLAN_SYSTEM = `You are planning how a funding proposal's content maps onto a donor's PRESCRIBED section structure. You are given the donor's ordered list of required sections, a summary of the proposal substance, and which structured artifacts are available (logframe matrix, budget table, timeline, risk table). Decide two things:
1. A concise project title and a one-line subtitle.
2. For each donor section, which SINGLE structured artifact (if any) most naturally belongs inside it (for example a logframe inside a results or M&E section, the budget table inside a budget section, the timeline inside a workplan section, the risk table inside a risk section).

Rules: assign each artifact to AT MOST ONE section; a section may host none; if an artifact fits nowhere, leave it out (it will be placed at the end). Use only the given sections; never invent one. Output ONLY a single JSON object, no prose:
{ "title": string, "subtitle": string, "assignments": [ { "index": number, "artifact": "matrix"|"budget"|"timeline"|"risks" } ] }
Include in assignments only the sections that host an artifact (0-based index into the donor section list).`;

const SECTION_SYSTEM = `You are a senior proposal writer for the Indian development sector, with 24 years of field experience, composing ONE section of a funding proposal that must follow a donor's PRESCRIBED structure. You are given LOCKED SUBSTANCE (verified facts: organisation, problem, objective, results chain, strategy, activities, a logframe matrix, a budget, a timeline and risks), the donor's full ordered list of sections so you know what is covered elsewhere, and the ONE section to write now.

Write only that one section's prose, to a professional standard:
- Develop a real, well-argued section for this heading, drawing on the substance relevant to it. Do NOT re-tell the whole project or write what plainly belongs to other sections in the list; assume the reader reads the others. A problem or background section is substantial; a short administrative section stays short. Do not pad.
- Use ONLY facts present in the substance. NEVER invent a statistic, figure, cost, place name or source. This is absolute.
- CITATIONS: many substance facts carry markers such as [S1] or [S2][S3]. When you state such a fact, reproduce its marker inline exactly; never drop one or invent one.
- If this section HOSTS a structured artifact (you will be told which), write prose that introduces and frames it (the logframe, the budget, the timeline or the risk table shown with this section). Do not reproduce the table itself in prose.
- CROSS-REFERENCES: when you point to a structured artifact (logframe, budget, timeline or risk table) that appears in a DIFFERENT section, refer to it by that section's NAME, using the ARTIFACT LOCATIONS you are given. Never refer to it by a section number, and never guess where it appears.
- LENGTH: if a target length for this section is given, treat it as a ceiling. Keep the section at or under it; a short administrative section may be well under. This keeps the whole proposal within the donor's overall word or page limit. Favour tight, substantive writing over padding.
- Do not use em-dashes as sentence connectors; use commas. No editorial filler or empty adjectives. Write in the language specified by the substance (default English).

Output ONLY the section's prose. You may use markdown sub-headings (##), bullet or numbered lists, and **bold**. Do NOT use markdown tables, or pipe characters (|) to lay out rows and columns: the renderer does not convert them, so they would print as raw text. Present any tabular or multi-field information as short prose or a bullet list instead; the proposal's real tables (logframe, budget, timeline, risk matrix) are rendered separately as structured artifacts. Do NOT output the section's own heading line, any delimiter, or any commentary before or after.`;

function extractPlanJson(text) {
  const t = (text || "").trim();
  const first = t.indexOf("{"); const last = t.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  try { return JSON.parse(t.slice(first, last + 1)); } catch (e) { return null; }
}

const ARTIFACT_LABEL = { matrix: "logframe matrix", budget: "budget table", timeline: "implementation timeline", risks: "risk table" };

function availableArtifacts(s) {
  const out = [];
  if (s && s.matrix && Array.isArray(s.matrix.rows) && s.matrix.rows.length) out.push("matrix");
  const bt = s && s.budget_table;
  if (bt && ((Array.isArray(bt.categories) && bt.categories.length) || (Array.isArray(bt.lines) && bt.lines.length))) out.push("budget");
  if (s && s.timeline && Array.isArray(s.timeline.rows) && s.timeline.rows.length) out.push("timeline");
  if (s && Array.isArray(s.risks) && s.risks.length) out.push("risks");
  return out;
}

// Extract a whole-proposal word budget from the donor's format requirements. Uses
// word_limit directly; falls back to page_limit converted at ~450 words/page for a
// dense, formatted proposal. Returns null when the donor set no length limit.
function limitToWords(fr) {
  if (!fr) return null;
  const num = (v) => { const m = String(v == null ? "" : v).replace(/,/g, "").match(/(\d+)/); return m ? Number(m[1]) : null; };
  const w = num(fr.word_limit);
  if (w && w > 0) return w;
  const p = num(fr.page_limit);
  if (p && p > 0) return p * 450;
  return null;
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

async function composeOneSection(substance, sectionList, index, artifact, fr, opts, extras = {}) {
  const heading = sectionList[index];
  const limits = [];
  if (fr && fr.word_limit) limits.push("Whole-proposal word limit: " + fr.word_limit + ".");
  if (fr && fr.page_limit) limits.push("Whole-proposal page limit: " + fr.page_limit + ".");
  if (fr && fr.notes) limits.push("Donor structural notes: " + fr.notes);
  const mandatory = fr && Array.isArray(fr.mandatory_components) && fr.mandatory_components.length
    ? "\n\nMANDATORY COMPONENTS the proposal as a whole must cover (include the ones that belong in THIS section): " + fr.mandatory_components.join("; ")
    : "";
  const artifactLine = artifact
    ? "\n\nTHIS SECTION HOSTS a structured artifact: the " +
      (ARTIFACT_LABEL[artifact] || artifact) +
      " will be rendered inside this section after your prose. Introduce and frame it; do not reproduce it in prose."
    : "";
  const locationsLine = extras.artifactLocations
    ? "\n\nARTIFACT LOCATIONS (where each structured table appears in the final document; refer to one in another section by that section's name):\n" + extras.artifactLocations
    : "";
  const targetLine = extras.perSectionWords
    ? "\n\nTARGET LENGTH for THIS section: about " + extras.perSectionWords + " words maximum (a short administrative section may be well under)."
    : "";
  const userMsg =
    "LOCKED SUBSTANCE (write from this, and nothing else):\n\n" + JSON.stringify(substance, null, 2) +
    "\n\n---\n\nDONOR'S FULL SECTION LIST (in order):\n" + sectionList.map((h, i) => (i + 1) + ". " + h).join("\n") +
    "\n\n---\n\nWRITE THIS SECTION NOW: section " + (index + 1) + ", heading: \"" + heading + "\"." +
    artifactLine + locationsLine + mandatory +
    (limits.length ? "\n\n" + limits.join(" ") : "") +
    targetLine;
  async function attempt() {
    const resp = await client.messages.stream({
      model: opts.model || MODEL,
      max_tokens: opts.maxTokens || 16000,
      system: [{ type: "text", text: SECTION_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMsg }],
    }).finalMessage();
    return resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  }
  let body = "";
  try { body = await attempt(); } catch (e) { body = ""; }
  if (!body) { try { body = await attempt(); } catch (e) { body = ""; } }
  return body;
}

async function composeByFormat(substance, opts = {}) {
  const fr = substance && substance.format_requirements;
  const sectionList = (fr && Array.isArray(fr.prescribed_sections) ? fr.prescribed_sections : [])
    .map((x) => String(x == null ? "" : x).trim())
    .filter(Boolean);
  if (!sectionList.length) return { title: "", subtitle: "", sections: [], _missing: ["prescribed_sections"] };

  const avail = availableArtifacts(substance);

  // 1) Plan: title, subtitle, artifact assignment.
  let plan = null;
  try {
    const planMsg =
      "DONOR SECTION LIST (in order):\n" + sectionList.map((h, i) => i + ": " + h).join("\n") +
      "\n\n---\n\nAVAILABLE ARTIFACTS: " + (avail.length ? avail.join(", ") : "(none)") +
      "\n\n---\n\nSUBSTANCE SUMMARY:\n" + JSON.stringify({
        org: substance.org, theme: substance.theme, geography: substance.geography,
        target: substance.target, duration: substance.duration, budget: substance.budget,
        objective: substance.objective, results: substance.results,
      }, null, 2);
    const resp = await client.messages.create({
      model: opts.model || MODEL,
      max_tokens: 2000,
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: planMsg }],
    });
    plan = extractPlanJson(resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n"));
  } catch (e) { plan = null; }

  // Resolve artifact assignment per section index, each artifact used once.
  const assignment = {};
  const used = new Set();
  if (plan && Array.isArray(plan.assignments)) {
    for (const a of plan.assignments) {
      const idx = Number(a && a.index);
      const art = a && a.artifact;
      if (Number.isInteger(idx) && idx >= 0 && idx < sectionList.length &&
          avail.includes(art) && !used.has(art) && assignment[idx] == null) {
        assignment[idx] = art;
        used.add(art);
      }
    }
  }

  // Describe where each structured artifact ends up, so a section that refers to
  // one in another section names that section correctly (an assigned artifact sits
  // in its section; an unassigned one is appended after the prescribed sections).
  const assignedIdxFor = (art) => Object.keys(assignment).find((k) => assignment[k] === art);
  const artifactLocations = avail.map((art) => {
    const k = assignedIdxFor(art);
    return k != null
      ? "- The " + ARTIFACT_LABEL[art] + " appears in the section titled \"" + sectionList[k] + "\"."
      : "- The " + ARTIFACT_LABEL[art] + " appears at the end of the document, after the prescribed sections.";
  }).join("\n");

  // Per-section word ceiling from the donor's total limit (soft target the writer
  // keeps under), so independently written sections do not overshoot the whole.
  const totalWords = limitToWords(fr);
  const perSectionWords = totalWords ? Math.max(120, Math.round(totalWords / sectionList.length)) : null;

  // 2) Write each section (bounded concurrency).
  const bodies = await mapConcurrent(sectionList, 3, (heading, i) =>
    composeOneSection(substance, sectionList, i, assignment[i] || null, fr, opts, { artifactLocations, perSectionWords })
  );

  const missing = [];
  const sections = sectionList.map((heading, i) => {
    if (!bodies[i]) missing.push(heading);
    return { key: "s" + (i + 1), heading, body: bodies[i] || "", artifact: assignment[i] || null };
  });

  const title = (plan && typeof plan.title === "string" && plan.title.trim()) ? plan.title.trim() : (substance.theme || "Project Proposal");
  const subtitle = (plan && typeof plan.subtitle === "string") ? plan.subtitle.trim() : "";
  return { title, subtitle, sections, _missing: missing };
}

module.exports = { composeProposal, composeByFormat };
