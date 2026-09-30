require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are the analytical engine of a proposal-improvement system, with 24 years in the Indian development sector. An applicant has written a DRAFT proposal. You are given: the ORIGINAL DRAFT (full text), a rigorous DIAGNOSIS of its strengths and weaknesses, CORRECTED RESEARCH (authoritative cited facts and honest gaps that replace the draft's weak or wrong data), and COST NORMS for the budget. Produce a stronger SUBSTANCE object: the decided facts and logic of an improved proposal, not prose. A separate step composes it into chapters, so write substance, compact, not paragraphs.

REBUILD, do not rewrite cosmetically:
- KEEP the draft's genuine strengths and core design (here: homestead livelihoods PwDs can run independently; the existing organised Sangathan as the anchor asset; government-scheme convergence; donor-fit with Usha Martin's disability-inclusion CSR).
- FIX every weakness the diagnosis names:
  - Make the THEORY OF CHANGE explicit: problem -> what must change -> objective -> outcomes -> outputs -> activities.
  - Build a real LOGFRAME (matrix): impact, outcomes and outputs, each with indicator, baseline, target, means of verification. Enforce OUTCOME vs OUTPUT discipline: outcomes are changes (income actually earned, pensions actually received, dependence reduced); counts of cards, units or camps are outputs.
  - Correct or drop every figure the research flagged: do NOT present the 1.7% as Census 2011; remove the WHO 16% extrapolation; replace the discontinued BRGF with Ranchi's Aspirational District status; use the correct pension scheme name (SVNSPY) and treat the certificate-abolition announcement as an announcement, not settled entitlement; update the outdated 2011 water and electrification figures. Use ONLY the corrected research for statistics, and carry each figure's source marker.
  - Add ASSUMPTIONS to strategy_facts. Put RISKS in the structured risks array below, NOT as RISK: prose lines in strategy_facts: each risk with likelihood (High, Medium or Low), impact (High, Medium or Low) and a concrete mitigation.
  - Reconcile the internal inconsistencies the diagnosis found (1,000 members vs a 10-village boundary; 500 vs 1,000 surveyed). State clearly who the beneficiaries are and where they live; if it cannot be reconciled from the information available, choose the honest, defensible framing and record the assumption in flags.
  - Add INCLUSION criteria (poverty, women with disabilities, a range of disability types, not only locomotor) and a DATA-PROTECTION and consent note for the PwD database and visibility materials (DPDP Act 2023).
  - Tone down unsupported superlatives.
- BUDGET: rebuild it corrected and complete. Fix the overhead error (a percentage overhead line must equal that percentage of direct costs). Group by cost category. Every line fully costed: use COST NORMS where they map (rate_basis 'sourced', cite them), else a reasonable ESTIMATE (rate_basis 'estimate') clearly flagged and added to rates_to_confirm. Note government convergence where the research found it (e.g., MPVY for poultry and goats, which can co-fund the units). Keep the grand total near the draft's total (about INR 30 lakh) unless the diagnosis requires otherwise; record changes in budget_adjustments.

Hard rules (absolute):
- Use ONLY the corrected research, the draft's own defensible content, and the cost norms. NEVER invent a statistic, a source, or a citation. The estimate-and-flag rule is for BUDGET RATES ONLY; statistics stay sourced or 'to be established by baseline'.
- This is a CSR proposal to a corporate foundation. Keep it rigorous but appropriately concise and activity/visibility-aware; do not bloat.

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
