require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a senior proposal reviewer with 24 years in the Indian development sector. You are given the full text of a DRAFT project proposal an applicant has already written. Diagnose it rigorously against the standard of a sound, fundable proposal, as an expert reviewer would before the applicant submits it.

The standard you judge against:
- A clear Theory of Change: problem -> what must change -> objective -> results (impact, outcomes, outputs) -> activities, each following from the last, stated explicitly, not just implied.
- A substantial, evidence-based PROBLEM analysis, with authoritative data AND the specific local situation, not only national figures.
- OUTCOME vs OUTPUT discipline: outcomes are changes in people's lives or systems; outputs are what the project delivers. A count of cards issued or units distributed is an output, not an outcome.
- A LOGFRAME / results framework: each result with an indicator, a baseline, a target, and a means of verification.
- RISKS and ASSUMPTIONS made explicit.
- SOURCE AUTHORITY: statistics cited only from authoritative sources (Census, NFHS, NSS/NSSO, ministry and government data, recognised institutions, peer-reviewed research). Flag any figure that rests on a weak source (aggregator sites, blogs, general press used as the origin of a statistic, unrefereed uploads) and name the authoritative origin that should replace it.
- A credible, itemised BUDGET tied to activities, with defensible rates.
- A SUSTAINABILITY case, and donor-fit.

Be honest and specific. Name real strengths (do not invent weaknesses to seem rigorous), and name real weaknesses precisely (where, what, why it matters). Keep each entry compact. Do not rewrite the proposal here; this is the diagnosis that a stronger version will act on.

Output ONLY a single JSON object:
{
  "meta": { "title": string|null, "org": string|null, "donor": string|null, "geography": string|null, "target": string|null, "duration": string|null, "budget": string|null },
  "extracted": { "problem": string, "objectives": [string], "results_present": string, "activities": string, "budget_present": string, "logframe_present": boolean, "toc_explicit": boolean, "risks_present": boolean },
  "strengths": [ string ],
  "weaknesses": [ { "area": string, "issue": string, "why_it_matters": string } ],
  "source_authority_flags": [ { "claim": string, "source_used": string, "problem": string, "authoritative_source": string } ],
  "improvement_plan": [ string ],
  "questions_for_user": [ { "id": string, "question": string, "why": string } ]
}`;

function extractJson(text){ const t=(text||"").trim(); const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null; try{ return JSON.parse(t.slice(a,b+1)); }catch(e){ return null; } }

async function readDoc(filePath){
  if(/\.docx$/i.test(filePath)){
    const mammoth = require("mammoth");
    const r = await mammoth.extractRawText({ path: filePath });
    return r.value;
  }
  return fs.readFileSync(filePath, "utf8");
}

async function diagnoseText(text, opts = {}){
  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 24000,
    system: SYSTEM,
    messages: [{ role:"user", content: "DRAFT PROPOSAL TEXT:\n\n" + text }]
  }).finalMessage();
  const raw = resp.content.filter(b=>b.type==="text").map(b=>b.text).join("\n");
  const diagnosis = extractJson(raw);
  return { diagnosis, text, _raw: raw, _stop: resp.stop_reason, _parsed: !!diagnosis };
}

async function diagnoseDraft(filePath, opts = {}){
  const text = await readDoc(filePath);
  return diagnoseText(text, opts);
}

module.exports = { diagnoseDraft, diagnoseText };
