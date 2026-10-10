require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.EXTRACT_MODEL || "claude-sonnet-5-5";
const FALLBACK = "claude-opus-5-5";

const MAX_PAGE_BYTES = 600 * 1024;   // per page download cap
const MAX_TOTAL_CHARS = 40000;        // text handed to the model, across all pages
const FETCH_TIMEOUT_MS = 12000;
const EXTRA_PAGES = 2;                 // beyond the homepage

const SYSTEM = `You read the text of an organisation's own website and write a short, factual profile summary of that organisation, to be used as one background source when drafting its funding proposals.

Rules:
- Use ONLY what the website text states. NEVER invent a fact, a figure, a year, a partner, or a programme. If the site does not say something, do not state it.
- Do not include navigation text, menus, cookie notices, contact forms, or boilerplate.
- Do not editorialise or add praise. Report what the organisation says about itself, plainly.
- Write 150–300 words of plain prose (no headings, no bullet points). Cover, only where the site states them: what the organisation is and its mission, its main thematic areas of work, where it works (geography), who it serves, its scale or reach, notable programmes, and named partners or funders.
- If the text is too thin to say anything useful, reply with the single line: INSUFFICIENT`;

function normaliseUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch { return null; }
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "PrastavBot/1.0 (+https://prastav.app)", "Accept": "text/html" },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const ctype = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/i.test(ctype)) return { ok: false, status: 0 };
    const buf = Buffer.from(await res.arrayBuffer());
    const html = buf.slice(0, MAX_PAGE_BYTES).toString("utf8");
    return { ok: true, html };
  } catch (e) {
    return { ok: false, status: 0, error: String(e && e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Find up to EXTRA_PAGES internal links that look like About / Programmes / Our work.
function discoverPages(html, base) {
  const wanted = /(about|who-we-are|our-?work|what-we-do|programme|program|mission|impact|our-?story)/i;
  const out = [];
  const seen = new Set([base.href, base.href.replace(/\/$/, "")]);
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < EXTRA_PAGES) {
    const href = m[1];
    const label = htmlToText(m[2]).slice(0, 80);
    if (!wanted.test(href) && !wanted.test(label)) continue;
    let abs;
    try { abs = new URL(href, base); } catch { continue; }
    if (abs.host !== base.host) continue;                  // same site only
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
    const key = abs.href.replace(/\/$/, "");
    if (seen.has(abs.href) || seen.has(key)) continue;
    seen.add(abs.href); seen.add(key);
    out.push(abs.href);
  }
  return out;
}

async function callModel(model, userMsg) {
  const resp = await client.messages.stream({
    model,
    max_tokens: 1200,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  }).finalMessage();
  const raw = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  return { raw, stop: resp.stop_reason };
}

// Fetch homepage + up to 2 obvious pages, return the combined clean text (no model call).
// Reusable by the website-analysis engine (Change 6c).
async function fetchSiteText(rawUrl) {
  const base = normaliseUrl(rawUrl);
  if (!base) return { ok: false, error: "invalid_url" };

  const home = await fetchText(base.href);
  if (!home.ok) return { ok: false, error: "fetch_failed", status: home.status };

  const pages = [{ url: base.href, text: htmlToText(home.html) }];
  const extra = discoverPages(home.html, base);
  for (const u of extra) {
    const r = await fetchText(u);
    if (r.ok) pages.push({ url: u, text: htmlToText(r.html) });
  }

  let combined = "";
  for (const p of pages) {
    if (combined.length >= MAX_TOTAL_CHARS) break;
    combined += `\n\n[PAGE: ${p.url}]\n` + p.text.slice(0, MAX_TOTAL_CHARS - combined.length);
  }
  combined = combined.trim();
  if (combined.replace(/\s/g, "").length < 200) return { ok: false, error: "too_thin", pages: pages.map(p => p.url) };
  return { ok: true, text: combined, pages: pages.map(p => p.url) };
}

// Fetch the site and produce a short factual profile summary via the model.
async function fetchWebsiteSummary(rawUrl) {
  const site = await fetchSiteText(rawUrl);
  if (!site.ok) return site;

  const userMsg = "ORGANISATION WEBSITE TEXT:\n" + site.text;
  let out;
  try {
    out = await callModel(MODEL, userMsg);
    if (!out.raw) out = await callModel(FALLBACK, userMsg);
  } catch (e) {
    try { out = await callModel(FALLBACK, userMsg); }
    catch (e2) { return { ok: false, error: "model_failed", pages: site.pages }; }
  }

  const summary = (out.raw || "").trim();
  if (!summary || /^INSUFFICIENT$/i.test(summary)) {
    return { ok: false, error: "insufficient", pages: site.pages };
  }
  return { ok: true, summary, pages: site.pages };
}

module.exports = { fetchWebsiteSummary, fetchSiteText, normaliseUrl, htmlToText };
