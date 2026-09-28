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

// Inline markdown on an ALREADY-escaped string: **bold** -> <strong>.
function inlineMd(s){ return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }

// Convert a markdown-ish section body into HTML: ## / ### headings, - bullets,
// 1. numbered lists, **bold**, and blank-line-separated paragraphs.
function mdToHtml(text){
  if(!text) return "";
  const lines = String(text).replace(/\r\n/g,"\n").split("\n");
  const out = [];
  let para = [];
  let i = 0;
  const flush = () => {
    if(para.length){
      const joined = para.join(" ").trim();
      if(joined) out.push(`<p>${inlineMd(esc(joined))}</p>`);
      para = [];
    }
  };
  while(i < lines.length){
    const t = lines[i].trim();
    if(t === ""){ flush(); i++; continue; }
    const h = t.match(/^(#{2,4})\s+(.*)$/);
    if(h){ flush(); const tag = h[1].length===2 ? "h3" : "h4";
      out.push(`<${tag}>${inlineMd(esc(h[2].trim()))}</${tag}>`); i++; continue; }
    if(/^[-*]\s+/.test(t)){ flush(); const items=[];
      while(i < lines.length && /^\s*[-*]\s+/.test(lines[i])){
        items.push(`<li>${inlineMd(esc(lines[i].replace(/^\s*[-*]\s+/,"").trim()))}</li>`); i++; }
      out.push(`<ul>${items.join("")}</ul>`); continue; }
    if(/^\d+\.\s+/.test(t)){ flush(); const items=[];
      while(i < lines.length && /^\s*\d+\.\s+/.test(lines[i])){
        items.push(`<li>${inlineMd(esc(lines[i].replace(/^\s*\d+\.\s+/,"").trim()))}</li>`); i++; }
      out.push(`<ol>${items.join("")}</ol>`); continue; }
    para.push(t); i++;
  }
  flush();
  return out.join("");
}

// Kept for compatibility; plain paragraphs only.
function paras(text){ return (text||"").split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join(""); }

// Indian-format amount helpers.
function parseAmt(s){ const n = Number(String(s==null?"":s).replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; }
function fmtIN(n){
  let s = Math.round(n).toString(); const neg = s.startsWith("-"); if(neg) s=s.slice(1);
  const lastThree = s.length>3 ? s.slice(-3) : s;
  let rest = s.length>3 ? s.slice(0, s.length-3) : "";
  if(rest !== ""){ rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ","); s = rest + "," + lastThree; }
  else { s = lastThree; }
  return (neg?"-":"") + s;
}

function matrixTable(mx, L){
  if(!mx||!mx.rows||!mx.rows.length) return "";
  const head = `<tr><th>${esc(L.th_level)}</th><th>${esc(L.th_statement)}</th><th>${esc(L.th_indicator)}</th><th>${esc(L.th_baseline)}</th><th>${esc(L.th_target)}</th><th>${esc(L.th_mov)}</th></tr>`;
  const body = mx.rows.map(r=>`<tr><td class="lvl">${esc(r.level)}</td><td>${esc(r.statement)}</td><td>${esc(r.indicator)}</td><td>${esc(r.baseline)}</td><td>${esc(r.target)}</td><td>${esc(r.mov)}</td></tr>`).join("");
  return `<table class="rbm">${head}${body}</table>`;
}

// Budget grouped by cost category, each with a subtotal, plus a "Contributes to"
// result-linkage column and a grand total. Accepts the new {categories:[...]}
// shape, or falls back to the old flat {lines:[...]} shape.
function budgetTable(bd, L){
  if(!bd) return "";
  const cats = bd.categories || (bd.lines ? [{ name:"", lines:bd.lines }] : []);
  if(!cats.length) return "";
  const COLS = 7;
  const head = `<tr><th>${esc(L.b_item)}</th><th>${esc(L.b_unit)}</th><th class="num">${esc(L.b_unitcost)}</th><th class="num">${esc(L.b_qty)}</th><th class="num">${esc(L.b_total)}</th><th>${esc(L.b_contributes)}</th><th>${esc(L.b_source)}</th></tr>`;
  let grand = 0; let hasPlaceholder = false;
  const blocks = cats.map((c, ci) => {
    const letter = String.fromCharCode(65+ci);
    let sub = 0;
    const rows = (c.lines||[]).map(r=>{
      const amt = parseAmt(r.total);
      if(amt>0) sub += amt; else hasPlaceholder = true;
      return `<tr><td>${esc(r.item)}</td><td>${esc(r.unit)}</td><td class="num">${esc(r.unit_cost)}</td><td class="num">${esc(r.quantity)}</td><td class="num">${esc(r.total)}</td><td class="link">${esc(r.contributes||"")}</td><td class="src">${esc(r.source)}</td></tr>`;
    }).join("");
    grand += sub;
    const catRow = c.name ? `<tr class="cat"><td colspan="${COLS}">${esc(letter)}. ${esc(c.name)}</td></tr>` : "";
    const subDisp = sub>0 ? fmtIN(sub) : "—";
    const subRow = `<tr class="sub"><td colspan="4">${esc(L.b_subtotal)} ${esc(c.name||"")}</td><td class="num">${subDisp}</td><td></td><td></td></tr>`;
    return catRow + rows + subRow;
  }).join("");
  const grandRow = `<tr class="grand"><td colspan="4">${esc(L.b_grandtotal)}</td><td class="num">${fmtIN(grand)}</td><td></td><td></td></tr>`;
  const note = hasPlaceholder ? `<p class="note">${esc(L.b_note)}</p>` : "";
  return `<table class="budget">${head}${blocks}${grandRow}</table>${note}`;
}

// Quarterly Gantt: activity clusters down the side, 8 quarters across the top,
// shaded cells for active quarters. Grounded in the phasing set in the substance.
function ganttTable(tl, L){
  if(!tl||!tl.rows||!tl.rows.length) return "";
  const units = tl.units || ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8"];
  const head = `<tr><th class="gact">${esc(L.g_activity)}</th>${units.map(u=>`<th class="gq">${esc(u)}</th>`).join("")}</tr>`;
  const body = tl.rows.map(r=>{
    const set = new Set(r.active||[]);
    const cells = units.map((_,idx)=> set.has(idx+1) ? `<td class="on"></td>` : `<td class="off"></td>`).join("");
    return `<tr><td class="gact">${esc(r.activity)}</td>${cells}</tr>`;
  }).join("");
  const legend = L.g_legend ? `<p class="note">${esc(L.g_legend)}</p>` : "";
  return `<table class="gantt">${head}${body}</table>${legend}`;
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
    sec_timeline:"Implementation Timeline",
    sec_results:"Results Framework", sec_sustainability:"Sustainability", sec_budget:"Budget",
    th_level:"Level", th_statement:"Result statement", th_indicator:"Indicator",
    th_baseline:"Baseline", th_target:"Target", th_mov:"Means of verification",
    b_item:"Item", b_unit:"Unit", b_unitcost:"Unit cost", b_qty:"Qty", b_total:"Total",
    b_contributes:"Contributes to", b_source:"Source",
    b_subtotal:"Subtotal —", b_grandtotal:"Grand Total",
    b_note:"Subtotals and grand total sum only the costed lines; lines marked to confirm are excluded until priced.",
    g_activity:"Activity",
    g_legend:"Shaded cells indicate active quarters. Q1–Q2: mobilisation and group formation. Q3–Q6: capacity-building and asset support. Q7–Q8: consolidation, market linkage and transition.",
    preparedWith:"Prepared with the Proposal Development Agent"
  },
  Hindi: {
    kicker:"परियोजना प्रस्ताव", contents:"विषय-सूची",
    location:"स्थान", duration:"अवधि", budget:"बजट",
    submittedTo:"प्रस्तुत किया गया", submittedBy:"प्रस्तुतकर्ता",
    sec_problem:"समस्या विवरण", sec_objective:"परियोजना उद्देश्य",
    sec_strategy:"संचालन रणनीति", sec_activities:"गतिविधियाँ",
    sec_timeline:"क्रियान्वयन समय-सारिणी",
    sec_results:"Results Framework (परिणाम ढाँचा)", sec_sustainability:"स्थिरता", sec_budget:"बजट",
    th_level:"स्तर", th_statement:"परिणाम कथन", th_indicator:"संकेतक",
    th_baseline:"आधार रेखा", th_target:"लक्ष्य", th_mov:"सत्यापन का साधन",
    b_item:"मद", b_unit:"इकाई", b_unitcost:"इकाई लागत", b_qty:"संख्या", b_total:"कुल",
    b_contributes:"संबंधित परिणाम", b_source:"स्रोत",
    b_subtotal:"उप-योग —", b_grandtotal:"कुल योग",
    b_note:"उप-योग एवं कुल योग केवल मूल्यांकित मदों का योग है; पुष्टि हेतु चिह्नित मदें मूल्य निर्धारण तक शामिल नहीं हैं।",
    g_activity:"गतिविधि",
    g_legend:"छायांकित कक्ष सक्रिय तिमाहियों को दर्शाते हैं। Q1–Q2: संगठन एवं समूह गठन। Q3–Q6: क्षमता-निर्माण एवं परिसंपत्ति सहयोग। Q7–Q8: सुदृढ़ीकरण, बाज़ार संपर्क एवं संक्रमण।",
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
  add(L.sec_problem, mdToHtml(d.problem));
  add(L.sec_objective, mdToHtml(d.objective));
  add(L.sec_strategy, mdToHtml(d.strategy));
  add(L.sec_activities, mdToHtml(d.activities));
  add(L.sec_timeline, ganttTable(d.timeline, L));
  add(L.sec_results, mdToHtml(d.results_narrative) + matrixTable(d.matrix, L));
  add(L.sec_sustainability, mdToHtml(d.sustainability));
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
  section h3 { font-size:11.5pt; margin:5.5mm 0 2mm; color:${accent2}; }
  section h4 { font-family:${fontHead}; font-size:10.3pt; margin:4mm 0 1.5mm; color:${accent}; }
  section ul, section ol { margin:0 0 3.4mm; padding-left:6.5mm; }
  section li { margin:0 0 1.8mm; text-align:justify; }
  section strong { font-weight:700; color:#12312b; }
  tr.cat td { background:${accent2}; color:#fff; font-weight:700; font-size:8pt; letter-spacing:.02em; }
  tr.sub td { background:#eef2ef; font-weight:700; color:${accent}; }
  tr.grand td { background:${accent}; color:#fff; font-weight:700; font-size:8.7pt; }
  td.link { font-size:7.8pt; color:#3a4a47; }
  p.note { font-size:7.6pt; color:#5a6763; font-style:italic; margin:1.5mm 0 4mm; text-align:left; }
  table.gantt { font-size:8pt; }
  .gantt th.gact, .gantt td.gact { width:30%; text-align:left; font-family:${fontHead}; }
  .gantt th.gq { text-align:center; width:8.75%; }
  .gantt td.on, .gantt td.off { text-align:center; }
  .gantt td.on { background:${accent2}; }
  .gantt td.off { background:#fff; }
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
