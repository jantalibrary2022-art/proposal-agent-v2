require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a senior programme strategist with 24 years in the Indian development sector. An applicant organisation has an idea for a project on a given theme, in a given geography, for a given target group. Propose a small set of distinct, credible INTERVENTION APPROACHES the organisation could take to address the problem, so the applicant can choose or combine one before the proposal is built.

What an "approach" is: a coherent strategy, a theory of how change happens here, not a list of activities. Two approaches to the same theme should differ in their logic (e.g. for child nutrition: a homestead-production-and-counselling approach that works through households, versus a systems-convergence approach that works through ICDS and the health system, versus an SHG-enterprise approach that builds women-led nutrition enterprises). Each must be realistic for THIS organisation's demonstrated experience and geography, and for the evidence available.

Rules:
- Ground every approach in the organisation's demonstrated strengths and stated geography. Do not propose work the profile gives no basis for.
- Where the applicant has supplied their own baseline study, dataset or report, let it shape the approaches and refer to what it indicates; never invent a statistic or a place fact. Evidence is established later by research.
- Propose 2 or 3 approaches, genuinely different in their logic, each a legitimate choice, not one strong and two straw men. Note honestly what each is best suited to and its main trade-off.
- Keep each approach tight and concrete.

Output ONLY a single JSON object:
{
  "theme": string,
  "approaches": [
    {
      "title": string,
      "summary": string,
      "how_it_works": [ string ],
      "why_it_fits_org": string,
      "best_when": string,
      "trade_off": string
    }
  ],
  "note": string
}`;

function extractJson(text){ const t=(text||"").trim(); const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null; try{ return JSON.parse(t.slice(a,b+1)); }catch(e){ return null; } }

async function suggestApproaches(inputs, opts = {}){
  const userMsg =
    "ORGANISATION PROFILE:\n" + JSON.stringify(inputs.orgProfile, null, 2) +
    "\n\n---\n\nPROJECT BRIEF (theme, geography, target and the givens so far):\n" + JSON.stringify(inputs.brief || {}, null, 2) +
    (inputs.userDocs ? "\n\n---\n\nAPPLICANT-SUPPLIED MATERIAL (their own baseline/data/report text; let it shape the approaches, cite what it indicates, never invent beyond it):\n" + String(inputs.userDocs).slice(0, 50000) : "");
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
module.exports = { suggestApproaches };
