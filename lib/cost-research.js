require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a costing analyst pricing an NGO project budget. You have a web_search tool; use it actively and repeatedly.

You are given the STATE, the project CONTEXT, and a LIST of budget line items that need unit costs. For each item, find the most authoritative published rate or norm that a proposal reviewer would accept, and map it to the item.

Where to look (prefer these):
- Staff salaries: State Rural Livelihoods Mission (in Chhattisgarh, 'Bihan') project-staff salary norms; NRLM contractual staff norms; state government contractual/outsourced pay schedules.
- Community Resource Person / Krishi Sakhi honoraria: NRLM/SRLM CRP honorarium; NMNF Krishi Sakhi honorarium.
- Wage rates: Chhattisgarh minimum wage notification (Labour Department); MGNREGA wage rate for Chhattisgarh (Ministry of Rural Development notification).
- Training: ATMA / MANAGE / NMNF training cost norms (per participant per day, residential and non-residential).
- Inputs, nursery, seeds, kitchen gardens: MIDH / National Horticulture Mission unit-cost schedules; state agriculture/horticulture department cost norms; NMNF bio-input norms.
- FPO / producer group support: the central 'Formation and Promotion of 10,000 FPOs' scheme norms (management cost, equity grant, CBBO fees).
- Office rent, audit, travel, overheads: state or scheme norms if any; otherwise mark as needing local quotes.

Rules (absolute):
- Cite ONLY authoritative sources (government notifications, scheme operational guidelines, official cost schedules). Every rate MUST carry a real source_title and source_url from your actual search results. Never invent a rate, a source or a URL.
- State the 'basis' (what the rate is officially for) and an 'applicability' note (how directly it maps to the item, and any adjustment needed).
- If no authoritative rate exists for an item, do NOT estimate it; put the item in gaps as 'needs local quote or field rate'.
- Prefer Chhattisgarh-specific figures; use national scheme norms where state figures are absent, and say so.

When finished searching, output ONLY a single JSON object as your final message:
{
  "cost_norms": [ { "item": string, "rate": string, "unit": string, "basis": string, "applicability": string, "source_title": string, "source_url": string, "year": string|null } ],
  "gaps": [ string ]
}`;

function extractJson(text){
  const t = (text||"").trim();
  const first = t.indexOf("{"); const last = t.lastIndexOf("}");
  if(first === -1 || last === -1) return null;
  try { return JSON.parse(t.slice(first, last+1)); } catch(e){ return null; }
}

async function costResearch(brief, opts = {}){
  const resp = await client.messages.create({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 10000,
    system: SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: opts.maxSearches || 12 }],
    messages: [{ role: "user", content: brief }]
  });
  const textBlocks = resp.content.filter(b => b.type === "text").map(b => b.text);
  const raw = textBlocks.length ? textBlocks[textBlocks.length - 1] : "";
  const data = extractJson(raw);
  return { data, _raw: raw, _stop: resp.stop_reason, _parsed: !!data };
}

module.exports = { costResearch };
