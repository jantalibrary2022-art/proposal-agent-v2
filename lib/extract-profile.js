require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.EXTRACT_MODEL || "claude-sonnet-5-5";
const FALLBACK = "claude-opus-5-5";

const SYSTEM = `You read an applicant's profile document (an NGO capability statement, an organisation profile, or an individual's CV or bio) and extract a structured profile. Extract ONLY what the document states. NEVER invent a fact, a figure, a year, or a project. If something is absent, leave it empty ("" or [] or null). Do not guess or infer beyond what is written.

Output ONLY a single JSON object, no prose around it, with this exact shape:
{
  "type": "organisation" | "individual",
  "name": string,
  "legal_status": string,
  "registration_year": number|null,
  "states_present": [string],
  "annual_revenue": string,
  "board_members": number|null,
  "permanent_staff": number|null,
  "affiliations": string,
  "values": string,
  "experience_summary": string,
  "contact": { "address": string, "email": string },
  "thematic_experience": [ { "theme": string, "years": number|null } ],
  "past_projects": [ { "title": string, "funder": string, "funder_type": string, "location": string, "scale": string, "outcomes": string } ]
}`;

function extractJson(text){ const t=(text||"").trim(); const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null; try{ return JSON.parse(t.slice(a,b+1)); }catch(e){ return null; } }

async function callModel(model, userMsg){
  const resp = await client.messages.stream({
    model,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }]
  }).finalMessage();
  const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  return { data: extractJson(raw), raw, stop: resp.stop_reason };
}

async function extractProfile(text, opts = {}){
  const userMsg = "PROFILE DOCUMENT TEXT:\n\n" + String(text || "").slice(0, 40000);
  let r;
  try { r = await callModel(opts.model || MODEL, userMsg); }
  catch (e) { r = await callModel(FALLBACK, userMsg); }
  return { data: r.data, _raw: r.raw, _stop: r.stop, _parsed: !!r.data };
}

module.exports = { extractProfile };
