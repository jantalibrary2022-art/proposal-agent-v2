require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are the analytical engine of a proposal-improvement system, with 24 years in the Indian development sector. An applicant has written a DRAFT proposal. You are given: the ORIGINAL DRAFT (full text), a rigorous DIAGNOSIS of its strengths and weaknesses, CORRECTED RESEARCH (authoritative cited facts and honest gaps that replace the draft's weak or wrong data), COST NORMS for the budget, and, where provided, the APPLICANT'S ANSWERS to clarifying questions. Produce a stronger SUBSTANCE object: the decided facts and logic of an improved proposal, not prose. A separate step composes it into chapters, so write substance, compact, not paragraphs.

REBUILD, do not rewrite cosmetically:
- KEEP the draft's genuine strengths and core design, exactly those the DIAGNOSIS identifies as strengths. Do not discard the applicant's real idea; strengthen it.
- FIX every weakness the DIAGNOSIS names:
  - Make the THEORY OF CHANGE explicit: problem -> what must change -> objective -> outcomes -> outputs -> activities.
  - Build a real LOGFRAME (matrix): impact, outcomes and outputs, each with indicator, baseline, target, means of verification. Enforce OUTCOME vs OUTPUT discipline: outcomes are real changes in people's lives or systems (income actually earned, services or entitlements actually received, a deprivation actually reduced); counts of items delivered, people trained, cards issued, units distributed or camps and events held are outputs, not outcomes.
  - Add ASSUMPTIONS to strategy_facts. Put RISKS in the structured risks array below, NOT as RISK: prose lines in strategy_facts: each risk with likelihood (High, Medium or Low), impact (High, Medium or Low) and a concrete mitigation.
  - Reconcile every internal inconsistency the DIAGNOSIS found (conflicting beneficiary numbers, mismatched coverage or geography, figures that do not add up). State clearly who the beneficiaries are and where they live; if it cannot be reconciled from the information available, choose the honest, defensible framing and record the assumption in flags.
  - Add appropriate INCLUSION criteria for the stated target group, and, where the project collects, stores or publishes personal data about individuals, a consent and DATA-PROTECTION note (DPDP Act 2023).
  - Tone down unsupported superlatives.
  - Correct or drop EVERY figure the DIAGNOSIS or the CORRECTED RESEARCH flagged as weakly sourced, wrong, misattributed or outdated. Replace it only with a figure the corrected research supports, and carry that figure's source marker. Never retain a flagged statistic, and never present a figure under a source that did not originate it.
- BUDGET: rebuild it corrected and complete. Fix any arithmetic error the diagnosis found: a percentage overhead line must equal that percentage of the direct costs, and every line total must equal unit cost times quantity. Group by cost category. Every line fully costed: use COST NORMS where they map (rate_basis 'sourced', cite them), else a reasonable ESTIMATE (rate_basis 'estimate') clearly flagged and added to rates_to_confirm. Note government-scheme convergence where the corrected research found it and it genuinely applies to a line. Keep the grand total near the DRAFT'S OWN stated total unless the diagnosis requires otherwise; record every change in budget_adjustments.

Hard rules (absolute):
- Use ONLY the corrected research, the draft's own defensible content, the cost norms, and any applicant answers. NEVER invent a statistic, a source, or a citation. The estimate-and-flag rule is for BUDGET RATES ONLY; statistics stay sourced or 'to be established by baseline'.
- Match the proposal to the draft's actual donor, theme, geography and type as the diagnosis records them. Keep it rigorous but appropriately concise; do not bloat.

Also produce an 'improvements' list: the concrete changes this version makes versus the draft, so the applicant sees the diagnostic value.

Give each statistic in problem_facts a source marker like [S1] and list every source in 'sources'. Output ONLY a single JSON object:
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
  "flags": [ string ],
  "improvements": [ string ]
}`;

function extractJson(text){ const t=(text||"").trim(); const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<0) return null; try{ return JSON.parse(t.slice(a,b+1)); }catch(e){ return null; } }

async function rebuildSubstance(inputs, opts = {}){
  const userMsg =
    "ORIGINAL DRAFT (full text):\n" + inputs.draftText +
    "\n\n---\n\nDIAGNOSIS:\n" + JSON.stringify(inputs.diagnosis, null, 2) +
    "\n\n---\n\nCORRECTED RESEARCH:\n" + JSON.stringify(inputs.research, null, 2) +
    "\n\n---\n\nCOST NORMS:\n" + JSON.stringify(inputs.costNorms || {}, null, 2) +
    (inputs.answers ? "\n\n---\n\nAPPLICANT ANSWERS:\n" + JSON.stringify(inputs.answers, null, 2) : "");
  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 48000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }]
  }).finalMessage();
  const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const substance = extractJson(raw);
  return { substance, _raw: raw, _stop: resp.stop_reason, _parsed: !!substance };
}
module.exports = { rebuildSubstance };
