// Configurable proposal template: template style + inclusion toggles + fonts.

const fs = require("fs");
const path = require("path");
// Embed an image file (svg/png/jpg) as a data URI so it always renders in the PDF.
function embedImage(file){
  try {
    if(!file) return "";
    const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    if(!fs.existsSync(abs)) return "";
    const ext = path.extname(abs).slice(1).toLowerCase();
    const mime = ext === "svg" ? "image/svg+xml" : (ext === "jpg" ? "image/jpeg" : "image/"+ext);
    const data = fs.readFileSync(abs).toString("base64");
    return `data:${mime};base64,${data}`;
  } catch(e){ return ""; }
}
function logoRow(orgSrc, donorSrc){
  const imgs = [];
  if(orgSrc)   imgs.push(`<img class="logo" src="${orgSrc}">`);
  if(donorSrc) imgs.push(`<img class="logo" src="${donorSrc}">`);
  if(!imgs.length) return "";
  return `<div class="logos">${imgs.join("")}</div>`;
}

function esc(s){ return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function paras(text){ return (text||"").split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join(""); }
function matrixTable(mx, L){
  if(!mx||!mx.rows||!mx.rows.length) return "";
  const head = `<tr><th>${esc(L.th_level)}</th><th>${esc(L.th_statement)}</th><th>${esc(L.th_indicator)}</th><th>${esc(L.th_baseline)}</th><th>${esc(L.th_target)}</th><th>${esc(L.th_mov)}</th></tr>`;
  const body = mx.rows.map(r=>`<tr><td class="lvl">${esc(r.level)}</td><td>${esc(r.statement)}</td><td>${esc(r.indicator)}</td><td>${esc(r.baseline)}</td><td>${esc(r.target)}</td><td>${esc(r.mov)}</td></tr>`).join("");
  return `<table class="rbm">${head}${body}</table>`;
}
function budgetTable(bd, L){
  if(!bd||!bd.lines||!bd.lines.length) return "";
  const head = `<tr><th>${esc(L.b_item)}</th><th>${esc(L.b_unit)}</th><th class="num">${esc(L.b_unitcost)}</th><th class="num">${esc(L.b_qty)}</th><th class="num">${esc(L.b_total)}</th><th>${esc(L.b_source)}</th></tr>`;
  const body = bd.lines.map(r=>`<tr><td>${esc(r.item)}</td><td>${esc(r.unit)}</td><td class="num">${esc(r.unit_cost)}</td><td class="num">${esc(r.quantity)}</td><td class="num">${esc(r.total)}</td><td class="src">${esc(r.source)}</td></tr>`).join("");
  return `<table class="budget">${head}${body}</table>`;
}

// Template style presets: colour + fonts only. Structure is shared.
const TEMPLATES = {
  institutional: { accent:"#0f3d34", accent2:"#0f6e5c", fontBody:'"Georgia","Noto Serif",serif', fontHead:'"Helvetica Neue",Arial,sans-serif' },
  contemporary:  { accent:"#1f3a5f", accent2:"#2a6fb0", fontBody:'"Helvetica Neue",Arial,sans-serif', fontHead:'"Helvetica Neue",Arial,sans-serif' },
};


// Curated fonts — all render Latin + Indian scripts (Devanagari/Bengali/Odia) via Noto fallback.
const FONTS = {
  "serif-classic":   '"Georgia","Noto Serif","Noto Serif Devanagari","Noto Serif Bengali","Noto Serif Oriya",serif',
  "serif-noto":      '"Noto Serif","Noto Serif Devanagari","Noto Serif Bengali","Noto Serif Oriya",serif',
  "sans-noto":       '"Noto Sans","Noto Sans Devanagari","Noto Sans Bengali","Noto Sans Oriya",sans-serif',
  "sans-helvetica":  '"Helvetica Neue",Arial,"Noto Sans Devanagari","Noto Sans Bengali","Noto Sans Oriya",sans-serif',
};
const FONT_SIZES = { small:"9.8pt", normal:"10.7pt", large:"11.6pt" };
function resolveFont(key, fallback){ return FONTS[key] || fallback; }


// Per-language fixed labels. Content is generated in the proposal language;
// these are the fixed document furniture. Hindi keeps established English technical terms.
// NOTE: Hindi labels are a FIRST DRAFT for Prakash to refine to sector convention.
const LABELS = {
  English: {
    kicker:"Project Proposal", contents:"Contents",
    location:"Location", duration:"Duration", budget:"Budget",
    submittedTo:"Submitted to", submittedBy:"Submitted by",
    sec_problem:"Problem Statement", sec_objective:"Project Objective",
    sec_strategy:"Operational Strategy", sec_activities:"Activities",
    sec_results:"Results Framework", sec_sustainability:"Sustainability", sec_budget:"Budget",
    th_level:"Level", th_statement:"Result statement", th_indicator:"Indicator",
    th_baseline:"Baseline", th_target:"Target", th_mov:"Means of verification",
    b_item:"Item", b_unit:"Unit", b_unitcost:"Unit cost", b_qty:"Qty", b_total:"Total", b_source:"Source",
    preparedWith:"Prepared with the Proposal Development Agent"
  },
  Hindi: {
    kicker:"परियोजना प्रस्ताव", contents:"विषय-सूची",
    location:"स्थान", duration:"अवधि", budget:"बजट",
    submittedTo:"प्रस्तुत किया गया", submittedBy:"प्रस्तुतकर्ता",
    sec_problem:"समस्या विवरण", sec_objective:"परियोजना उद्देश्य",
    sec_strategy:"संचालन रणनीति", sec_activities:"गतिविधियाँ",
    sec_results:"Results Framework (परिणाम ढाँचा)", sec_sustainability:"स्थिरता", sec_budget:"बजट",
    th_level:"स्तर", th_statement:"परिणाम कथन", th_indicator:"संकेतक",
    th_baseline:"आधार रेखा", th_target:"लक्ष्य", th_mov:"सत्यापन का साधन",
    b_item:"मद", b_unit:"इकाई", b_unitcost:"इकाई लागत", b_qty:"संख्या", b_total:"कुल", b_source:"स्रोत",
    preparedWith:"Proposal Development Agent द्वारा तैयार"
  },
};
function getLabels(lang){ return LABELS[lang] || LABELS.English; }

function renderProposalHTML(p, opts){
  const d = p || {};
  const o = opts || {};
  const tpl = TEMPLATES[o.template] || TEMPLATES.institutional;
  const accent = tpl.accent, accent2 = tpl.accent2;
  const fontBody = o.font ? resolveFont(o.font, tpl.fontBody) : (o.fontBody || tpl.fontBody);
  const fontHead = o.fontHead || tpl.fontHead;
  const fontSize = (o.size && FONT_SIZES[o.size]) ? FONT_SIZES[o.size] : (o.fontSize || "10.7pt");
  const includeToc = o.includeToc !== false;   // default on
  const includeBack = o.includeBack !== false; // default on
  const L = getLabels(d.lang || o.lang || "English");
  const orgLogo = embedImage(d.orgLogo);
  const donorLogo = embedImage(d.donorLogo);

  const sections = [];
  const add = (title, html) => { if(html && html.trim()) sections.push({ title, html }); };
  add(L.sec_problem, paras(d.problem));
  add(L.sec_objective, paras(d.objective));
  add(L.sec_strategy, paras(d.strategy));
  add(L.sec_activities, paras(d.activities));
  add(L.sec_results, matrixTable(d.matrix, L));
  add(L.sec_sustainability, paras(d.sustainability));
  add(L.sec_budget, budgetTable(d.budget_table, L));

  const toc = sections.map((s,i)=>`<li><a href="#sec${i}"><span class="toc-title">${esc(s.title)}</span><span class="dots"></span></a></li>`).join("");
  const body = sections.map((s,i)=>`<section id="sec${i}"><h2>${esc(s.title)}</h2>${s.html}</section>`).join("");

  const tocBlock = includeToc ? `<nav class="toc"><h2>${esc(L.contents)}</h2><ol>${toc}</ol></nav>` : "";
  const backBlock = includeBack ? `
  <div class="back">
    ${orgLogo ? `<img class="logo" src="${orgLogo}">` : ""}
    <div class="rule">
      <div class="big">${esc(d.title || "Project Proposal")}</div>
      ${d.orgName ? `<div><b>${esc(d.orgName)}</b></div>` : ""}
      ${d.orgAddress ? `<div>${esc(d.orgAddress)}</div>` : ""}
      ${d.orgContact ? `<div>${esc(d.orgContact)}</div>` : ""}
      ${d.closing ? `<div style="margin-top:4mm;font-style:italic">${esc(d.closing)}</div>` : ""}
      <div style="margin-top:3mm">${esc(L.preparedWith)} · Method by Prakash Kumar</div>
    </div>
  </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size:A4; margin:22mm 20mm 20mm 20mm; @bottom-center { content: counter(page); font-family:${fontHead}; font-size:8.5pt; color:#5a6763; } }
  @page cover { @bottom-center { content:""; } }
  * { box-sizing:border-box; } html,body { margin:0; padding:0; }
  body { font-family:${fontBody}; color:#1a2b2b; font-size:${fontSize}; line-height:1.55; -webkit-font-smoothing:antialiased; }
  h1,h2,h3 { font-family:${fontHead}; color:${accent}; letter-spacing:-.01em; }
  .cover { page:cover; height:247mm; display:flex; flex-direction:column; justify-content:center; page-break-after:always; }
  .cover .logos { display:flex; gap:10mm; align-items:center; margin-bottom:14mm; }
  .cover .logo { height:20mm; width:auto; max-width:60mm; object-fit:contain; }
  .back .logo { height:16mm; width:auto; margin-bottom:5mm; }
  .cover .kicker { font-family:${fontHead}; font-size:9.5pt; letter-spacing:.22em; text-transform:uppercase; color:${accent2}; margin-bottom:18mm; }
  .cover h1 { font-size:30pt; line-height:1.15; margin:0 0 10mm; max-width:150mm; }
  .cover .sub { font-size:12pt; color:#3a4a47; margin-bottom:4mm; font-style:italic; }
  .cover .meta { margin-top:auto; border-top:2px solid ${accent2}; padding-top:6mm; font-family:${fontHead}; font-size:9.5pt; color:#3a4a47; }
  .cover .meta b { color:${accent}; }
  .toc { page-break-after:always; }
  .toc h2 { font-size:16pt; margin:0 0 6mm; padding-bottom:2mm; border-bottom:1px solid #d9d2c2; }
  .toc ol { list-style:none; counter-reset:toc; padding:0; margin:0; }
  .toc li { counter-increment:toc; margin:0 0 3mm; font-family:${fontHead}; font-size:10.5pt; }
  .toc li a { color:#1a2b2b; text-decoration:none; display:flex; align-items:baseline; }
  .toc .toc-title::before { content:counter(toc) ".  "; color:${accent2}; font-weight:700; }
  .toc .dots { flex:1; border-bottom:1px dotted #cfc8b8; margin:0 2mm 1mm; }
  .toc a::after { content:target-counter(attr(href), page); padding-left:3mm; color:#5a6763; }
  section { page-break-before:always; margin-bottom:6mm; }
  h2 { font-size:15pt; margin:0 0 4mm; padding-bottom:2mm; border-bottom:1px solid #d9d2c2; }
  p { margin:0 0 3.2mm; text-align:justify; }
  table { width:100%; border-collapse:collapse; margin:3mm 0 5mm; font-family:${fontHead}; font-size:8.7pt; }
  th { background:${accent}; color:#fff; text-align:left; padding:2.4mm 2.6mm; font-weight:600; font-size:8pt; }
  td { border:.4pt solid #cfc8b8; padding:2.2mm 2.6mm; vertical-align:top; }
  tr:nth-child(even) td { background:#f7f5ef; }
  td.lvl { font-weight:700; color:${accent}; white-space:nowrap; }
  td.num, th.num { text-align:right; white-space:nowrap; }
  td.src { font-size:7.6pt; color:#5a6763; }
  tr { page-break-inside:avoid; }
  .back { page-break-before:always; height:247mm; display:flex; flex-direction:column; justify-content:flex-end; }
  .back .rule { border-top:2px solid ${accent2}; padding-top:6mm; font-family:${fontHead}; font-size:9.5pt; color:#3a4a47; }
  .back .big { font-family:${fontHead}; font-size:13pt; color:${accent}; margin-bottom:3mm; }
</style></head>
<body>
  <div class="cover">
    ${logoRow(orgLogo, donorLogo)}
    <div class="kicker">${esc(L.kicker)}</div>
    <h1>${esc(d.title || "Project Proposal")}</h1>
    ${d.subtitle ? `<div class="sub">${esc(d.subtitle)}</div>` : ""}
    <div class="meta">
      ${d.geography ? `<div><b>${esc(L.location)}:</b> ${esc(d.geography)}</div>` : ""}
      ${d.duration ? `<div><b>${esc(L.duration)}:</b> ${esc(d.duration)}</div>` : ""}
      ${d.budget ? `<div><b>${esc(L.budget)}:</b> ${esc(d.budget)}</div>` : ""}
      ${d.submittedTo ? `<div style="margin-top:3mm"><b>${esc(L.submittedTo)}:</b> ${esc(d.submittedTo)}</div>` : ""}
      ${d.submittedBy ? `<div><b>${esc(L.submittedBy)}:</b> ${esc(d.submittedBy)}</div>` : ""}
    </div>
  </div>
  ${tocBlock}
  ${body}
  ${backBlock}
</body></html>`;
}
module.exports = { renderProposalHTML, TEMPLATES, FONTS, FONT_SIZES };
