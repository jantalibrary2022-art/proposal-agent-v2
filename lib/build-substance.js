require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are the analytical engine of a proposal-writing system, applying a rigorous method used by an expert with 24 years in the Indian development sector. You are given four inputs: the applicant ORGANISATION PROFILE, the RFP INTAKE (what the donor fixes and leaves open, plus eligibility and constraints), the applicant's ANSWERS (their project intent), and grounded RESEARCH (cited facts plus a list of gaps).

Your job is to construct a complete, defensible SUBSTANCE object: the decided facts and logic of the proposal, not prose. A separate composition step turns it into chapters, so write substance, not paragraphs. Keep each fact and line compact.

Method and depth:
- PROBLEM: build a layered, evidence-based problem analysis. Use ONLY facts from RESEARCH and the answers. Reason across the dimensions the evidence supports (demographic, economic and livelihoods, tribal and PVTG context, agriculture, forest and FRA, nutrition and health, climate). Each problem_fact that carries a figure must trace to a research source; name the source briefly in the fact and list it in sources. Where a needed figure is a GAP, do not invent it; frame it as something the baseline survey will establish.
- OBJECTIVE: one tight objective, the change sought, for whom, over the duration.
- RESULTS: a coherent chain, one impact, one to three outcomes, and the outputs beneath them, each following from the problem.
- STRATEGY: the logic of the approach (natural farming on FRA land with PVTG households) and genuine convergence with the policy scaffolding the research surfaced (NMNF, FRA, PM-JANMAN) where it truly fits. Treat scheme benefits such as the NMNF farmer incentive as convergence and leverage, not as project cost.
- ACTIVITIES: concrete clusters that build the results, grounded in the strategy.
- MATRIX (logframe): rows for impact, each outcome and each output, with indicator, baseline, target, means of verification. Where a baseline is unknown, write 'To be established by baseline survey'. Targets must be realistic for the scale and the budget.
- BUDGET: grouped by cost category (Personnel & Salaries; Capital Expenditure only if genuinely needed; Programme / Activity Costs; Administrative / Overheads). Each line has item, unit, unit_cost, quantity, total, contributes (the result it funds), source. Use unit costs from RESEARCH cost_norms where available and cite them. Where a rate is a GAP, set unit_cost to '[rate — confirm locally]' and total to '[to confirm]'; never invent a precise rate. The total of costed lines must not exceed the requested budget.
- TIMELINE: phase the activities across the duration in quarters.

Hard rules (absolute):
- Use ONLY the research, answers and profile. NEVER invent a statistic, a place fact, a source or a cost.
- Obey the RFP constraints: the theme, the requested budget and its ceiling, the duration, and any prescribed format.
- If the intake or research flags the target as unverifiable, frame it honestly: state that exact PVTG household numbers require PM-JANMAN and field verification, and allow 'PVTG and other Scheduled Tribe households' if the block's PVTG count is smaller. Record this in flags.
- Evidence from other regions (e.g., APCNF in Andhra Pradesh) may be used as demonstrated potential, clearly labelled as external evidence, never as local fact.

Output ONLY a single JSON object, no prose around it, with this exact shape:
{
  "lang": "English",
  "org": { "name": string, "experience": string, "values": string },
  "theme": string,
  "geography": { "state": string, "district": string, "block": string, "coverage": string },
  "target": string,
  "duration": string,
  "budget": string,
  "donor": string,
  "problem_facts": [ string ],
  "objective": string,
  "results": { "impact": string, "outcomes": [ string ], "outputs": [ string ] },
  "strategy_facts": [ string ],
  "activities_facts": [ string ],
  "matrix": { "rows": [ { "level": string, "statement": string, "indicator": string, "baseline": string, "target": string, "mov": string } ] },
  "budget_table": { "categories": [ { "name": string, "lines": [ { "item": string, "unit": string, "unit_cost": string, "quantity": string, "total": string, "contributes": string, "source": string } ] } ] },
  "timeline": { "units": [ string ], "rows": [ { "activity": string, "active": [ number ] } ] },
  "sources": [ { "ref": string, "title": string, "url": string } ],
  "flags": [ string ]
}`;

function extractJson(text){
  const t = (text||"").trim();
  const first = t.indexOf("{"); const last = t.lastIndexOf("}");
  if(first === -1 || last === -1) return null;
  try { return JSON.parse(t.slice(first, last+1)); } catch(e){ return null; }
}

async function buildSubstance(inputs, opts = {}){
  const userMsg =
    "ORGANISATION PROFILE:\n" + JSON.stringify(inputs.orgProfile, null, 2) +
    "\n\n---\n\nRFP INTAKE:\n" + JSON.stringify(inputs.rfpAnalysis, null, 2) +
    "\n\n---\n\nAPPLICANT ANSWERS:\n" + JSON.stringify(inputs.answers, null, 2) +
    "\n\n---\n\nRESEARCH (cited facts and gaps):\n" + JSON.stringify(inputs.research, null, 2);
  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 32000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }]
  }).finalMessage();
  const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const substance = extractJson(raw);
  return { substance, _raw: raw, _stop: resp.stop_reason, _parsed: !!substance };
}

module.exports = { buildSubstance };
