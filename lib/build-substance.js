require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are the analytical engine of a proposal-writing system, applying a rigorous method used by an expert with 24 years in the Indian development sector. You are given five inputs: the applicant ORGANISATION PROFILE, the RFP INTAKE, the applicant's ANSWERS, grounded RESEARCH (cited facts plus gaps), and COST NORMS (authoritative rates found for budget lines, with applicability notes).

Your job is to construct a complete, defensible SUBSTANCE object: the decided facts and logic of the proposal, not prose. A separate composition step turns it into chapters, so write substance, not paragraphs. Keep each fact and line compact.

Method and depth:
- PROBLEM: a layered, evidence-based analysis using ONLY facts from RESEARCH and the answers. Reason across the dimensions the evidence supports. Each problem_fact with a figure must trace to a research source; name it briefly and list it in sources. Where a figure is a GAP, frame it as something the baseline survey will establish.
- OBJECTIVE: one tight objective, the change sought, for whom, over the duration.
- RESULTS: one impact, one to three outcomes, and the outputs beneath them, each following from the problem.
- STRATEGY: the logic of the approach and genuine convergence with the policy scaffolding the research surfaced. Treat scheme benefits such as a government scheme incentive as convergence, not project cost.
- ACTIVITIES: concrete clusters that build the results.
- MATRIX (logframe): rows for impact, each outcome and each output, with indicator, baseline, target, means of verification. Unknown baselines are 'To be established by baseline survey'.
- TIMELINE: phase the activities across the duration in quarters.
- RISKS: identify the principal risks to delivery, each with likelihood (High, Medium or Low), impact (High, Medium or Low) and a concrete mitigation, in the structured risks array.

BUDGET (grouped: Personnel & Salaries; Capital Expenditure only if genuinely needed; Programme / Activity Costs; Administrative / Overheads). Every line MUST be fully costed with a numeric unit_cost and total (= unit_cost × quantity). Assign each unit_cost like this:
- If a COST NORM maps directly to the line, use it, set rate_basis to 'sourced', and put the citation in source.
- If a norm exists only as a floor, ceiling or indirect reference (read its applicability note), or if no norm exists, set a REASONABLE ESTIMATE from Indian development-sector experience for this context (for the stated project geography and setting), set rate_basis to 'estimate', put a one-line basis in source, and add the line to rates_to_confirm with a short prompt asking the user to confirm or supply their own rate. Never present an estimate as sourced.
- The grand total of all lines must be at or just below the stated budget ceiling. If a coherent budget would exceed it, trim estimated discretionary lines or scale while keeping the core delivery model intact, and record each change in budget_adjustments.
- Compute a subtotal per category and a grand total. Use Indian digit grouping in totals (e.g., 12,00,000). For a '% of direct costs' overhead line, compute it after direct costs and keep the grand total within the ceiling.

Hard rules (absolute):
- Use ONLY the research, answers, profile and cost norms. NEVER invent a statistic, a place fact, a source, or an authoritative-looking citation.
- The estimate-and-flag rule is for BUDGET RATES ONLY. NEVER estimate a demographic or outcome statistic in the problem analysis or logframe; those stay sourced or 'to be established by baseline'.
- Obey the RFP constraints: theme, the requested budget and its ceiling, duration, and any prescribed format.
- If the intake or research flags the target as unverifiable, frame it honestly and record it in flags.
- Evidence from other regions may be used as demonstrated potential, clearly labelled as external, never as local fact.

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
  "risks": [ { "risk": string, "likelihood": "High"|"Medium"|"Low", "impact": "High"|"Medium"|"Low", "mitigation": string } ],
  "activities_facts": [ string ],
  "matrix": { "rows": [ { "level": string, "statement": string, "indicator": string, "baseline": string, "target": string, "mov": string } ] },
  "budget_table": { "categories": [ { "name": string, "lines": [ { "item": string, "unit": string, "unit_cost": string, "quantity": string, "total": string, "rate_basis": "sourced"|"estimate", "contributes": string, "source": string } ] } ] },
  "budget_grand_total": string,
  "rates_to_confirm": [ { "item": string, "estimated_rate": string, "prompt": string } ],
  "budget_adjustments": [ string ],
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
    "\n\n---\n\nRESEARCH (cited facts and gaps):\n" + JSON.stringify(inputs.research, null, 2) +
    "\n\n---\n\nCOST NORMS (authoritative rates found, with applicability):\n" + JSON.stringify(inputs.costNorms || {}, null, 2);
  const COMPACT = "\n\nIMPORTANT OUTPUT-SIZE RULE: Keep the JSON as compact as possible. Every required field must be present and complete, but write each fact, budget line, matrix row, risk and narrative value in the fewest words that preserve meaning. Never drop budget lines, matrix rows or risks to save space; shorten their wording instead. The complete JSON object must be fully closed.";
  async function attempt(maxTokens, extra){
    const resp = await client.messages.stream({
      model: opts.model || MODEL,
      max_tokens: maxTokens,
      system: [{ type: "text", text: extra ? SYSTEM + extra : SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMsg }]
    }).finalMessage();
    const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return { substance: extractJson(raw), raw, stop: resp.stop_reason };
  }
  const HIGH = opts.maxTokens || 48000;
  const SAFE = 32000;
  let ceil = HIGH;
  let r;
  try { r = await attempt(ceil); }
  catch (e) { ceil = SAFE; r = await attempt(ceil); }
  if (!r.substance && r.stop === "max_tokens") {
    r = await attempt(ceil, COMPACT);
  }
  return { substance: r.substance, _raw: r.raw, _stop: r.stop, _parsed: !!r.substance };
}

module.exports = { buildSubstance };
