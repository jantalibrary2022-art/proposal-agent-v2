require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const { stripCitations } = require("./clean-citations");
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a costing analyst pricing an NGO project budget. You have a web_search tool; use it actively and repeatedly.

You are given the STATE, the project CONTEXT, and a LIST of budget line items that need unit costs. For each item, find the most authoritative published rate or norm that a proposal reviewer would accept, and map it to the item.

Where to look (prefer these):
- Staff salaries and CRP honoraria: State Rural Livelihoods Mission (Jharkhand: JSLPS / 'Bihan') norms; NRLM contractual staff norms; state contractual pay schedules.
- Wage rates: state minimum wage notification (Labour Department); MGNREGA wage rate for the state (Ministry of Rural Development notification).
- Livestock and poultry: State Animal Husbandry Department / National Livestock Mission unit-cost norms; ATMA; local market rates where an official norm names them.
- Agriculture, mushroom, nursery, kitchen garden: MIDH / National Horticulture Mission unit-cost schedules; state agriculture/horticulture cost norms; ATMA.
- Training: ATMA / MANAGE training cost norms (per participant per day).
- Disability-specific: ADIP scheme norms; ALIMCO device rates.
- Office, audit, travel, overhead: state or scheme norms if any; otherwise mark as needing local quotes.

Rules (absolute):
- Cite ONLY authoritative sources (government notifications, scheme operational guidelines, official cost schedules). Every rate MUST carry a real source_title and source_url from your actual search results. Never invent a rate, a source or a URL.
- State the 'basis' (what the rate is officially for) and an 'applicability' note (how directly it maps, and any adjustment needed).
- If no authoritative rate exists for an item, do NOT estimate it; put the item in gaps as 'needs local quote or field rate'.
- Prefer state-specific figures; use national scheme norms where state figures are absent, and say so.

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
  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 16000,
    system: SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: opts.maxSearches || 12 }],
    messages: [{ role: "user", content: brief }]
  }).finalMessage();
  const textBlocks = resp.content.filter(b => b.type === "text").map(b => b.text);
  const raw = textBlocks.length ? textBlocks[textBlocks.length - 1] : "";
  const data = extractJson(raw);
  return { data, _raw: raw, _stop: resp.stop_reason, _parsed: !!data };
}

module.exports = { costResearch };
