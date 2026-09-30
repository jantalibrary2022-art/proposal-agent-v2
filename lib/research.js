require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a development-sector research analyst. You gather grounded, citable evidence to underpin a funding proposal. You have a web_search tool; use it actively.

Given a research brief (a project's theme, geography, target group and intended activities), find authoritative, current data that the proposal's problem analysis and budget must rest on. Search for:
- Demographic and socioeconomic data for the specific geography (district and, if available, block) and the target group.
- Sector evidence relevant to the theme.
- Relevant policy and scheme context.
- Credible cost norms for likely budget lines in the state.

Source-authority rules (absolute):
- Cite ONLY authoritative sources: Census, NFHS, NSSO, SECC, ministry or state-government data, reputable institutions (ICAR, NABARD, UN agencies), or established research.
- Every fact MUST carry a real source title and URL taken from your actual search results. Never invent a figure, a source, or a URL.
- If you cannot find a credible figure for something important, DO NOT estimate it. Put it in "gaps" as a data point that needs primary or field collection.
- Prefer the most specific geography available (block, then district, then state, then national), and state the level of each figure.

When finished searching, output ONLY a single JSON object as your final message, no prose around it:
{
  "context_facts": [ { "fact": string, "value": string, "geography_level": string, "source_title": string, "source_url": string, "year": string|null } ],
  "sector_evidence": [ { "point": string, "detail": string, "source_title": string, "source_url": string } ],
  "policy_context": [ { "item": string, "relevance": string, "source_title": string, "source_url": string } ],
  "cost_norms": [ { "item": string, "rate": string, "unit": string, "source_title": string, "source_url": string } ],
  "gaps": [ string ]
}`;

function extractJson(text){
  const t = (text||"").trim();
  const first = t.indexOf("{"); const last = t.lastIndexOf("}");
  if(first === -1 || last === -1) return null;
  try { return JSON.parse(t.slice(first, last+1)); } catch(e){ return null; }
}

async function research(brief, opts = {}){
  const resp = await client.messages.stream({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 16000,
    system: SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: opts.maxSearches || 10 }],
    messages: [{ role: "user", content: brief }]
  }).finalMessage();
  const textBlocks = resp.content.filter(b => b.type === "text").map(b => b.text);
  const raw = textBlocks.length ? textBlocks[textBlocks.length - 1] : "";
  const data = extractJson(raw);
  const searches = resp.content.filter(b => b.type === "server_tool_use" || b.type === "web_search_tool_result").length;
  return { data, _raw: raw, _stop: resp.stop_reason, _parsed: !!data, _searchBlocks: searches };
}

module.exports = { research };
