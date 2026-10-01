require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a senior proposal writer for the Indian development sector, with 24 years of field experience, revising ONE section of an existing funding proposal at the applicant's request.

You are given the SECTION name, the GROUNDING (the decided facts of this proposal), the CURRENT SECTION TEXT, and the APPLICANT'S REQUESTED CHANGE. Produce a revised version of that section that carries out the applicant's intent while protecting the quality and integrity of the proposal.

Hard rules (absolute):
- Use ONLY facts present in the grounding and the current text. NEVER invent a statistic, a figure, a cost, a place name, or a source. If the applicant asks for a fact that is not in the grounding, do not fabricate it; make the qualitative change instead and say in your note that field data would be needed to add that number.
- Preserve every citation marker (such as [S1] or [S2][S3]) exactly, attached to the fact it came with. Do not drop a marker, move it to a different fact, or invent a new one.
- Keep the section's role and the single theory-of-change thread intact.
- Write in the proposal's language. Use comma-based prose, no em-dashes as connectors, no editorial filler or empty adjectives.

Your judgement:
- Carry out the applicant's change. If their instruction, done literally, would weaken the proposal (removing evidence, overclaiming beyond the facts, misfitting the donor, or breaking the argument), still make the change they asked for, but explain the risk clearly in your note so they can decide. You advise, the applicant decides. Do not refuse a stylistic or structural change on your own authority; the only thing you will not do is fabricate facts.
- If the applicant's message is a question rather than a change, answer it in the note and return the section unchanged with changed=false.

Output ONLY a single JSON object, no prose around it:
{ "note": string (what you did, and any caution or advice, in one short paragraph addressed to the applicant), "revised": string (the full revised section text), "changed": boolean (true if you changed the section) }`;

function extractJson(text){ const t=(text||"").trim(); const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null; try{ return JSON.parse(t.slice(a,b+1)); }catch(e){ return null; } }

const SECTION_LABELS = { title:"Title", subtitle:"Subtitle", problem:"Problem analysis", objective:"Objective", strategy:"Strategy / approach", results_narrative:"Results narrative", activities:"Activities", sustainability:"Sustainability" };

async function reviseSection({ section, currentText, comment, grounding }, opts = {}){
  const label = SECTION_LABELS[section] || section;
  const userMsg =
    "SECTION TO REVISE: " + label +
    "\n\nGROUNDING (the decided facts of this proposal; use ONLY these, never invent):\n" + JSON.stringify(grounding || {}, null, 2) +
    "\n\n---\n\nCURRENT SECTION TEXT:\n" + (currentText || "") +
    "\n\n---\n\nAPPLICANT'S REQUESTED CHANGE:\n" + (comment || "");
  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 8000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMsg }]
  }).finalMessage();
  const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const data = extractJson(raw);
  return { data, _raw: raw, _stop: resp.stop_reason, _parsed: !!data };
}

module.exports = { reviseSection };
