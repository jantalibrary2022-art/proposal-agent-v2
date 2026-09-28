// Configurable proposal template: template style + inclusion toggles + fonts.
function esc(s){ return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function paras(text){ return (text||"").split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join(""); }
function matrixTable(mx){
  if(!mx||!mx.rows||!mx.rows.length) return "";
  const head = `<tr><th>Level</th><th>Result statement</th><th>Indicator</th><th>Baseline</th><th>Target</th><th>Means of verification</th></tr>`;
  const body = mx.rows.map(r=>`<tr><td class="lvl">${esc(r.level)}</td><td>${esc(r.statement)}</td><td>${esc(r.indicator)}</td><td>${esc(r.baseline)}</td><td>${esc(r.target)}</td><td>${esc(r.mov)}</td></tr>`).join("");
  return `<table class="rbm">${head}${body}</table>`;
}
function budgetTable(bd){
  if(!bd||!bd.lines||!bd.lines.length) return "";
  const head = `<tr><th>Item</th><th>Unit</th><th class="num">Unit cost</th><th class="num">Qty</th><th class="num">Total</th><th>Source</th></tr>`;
  const body = bd.lines.map(r=>`<tr><td>${esc(r.item)}</td><td>${esc(r.unit)}</td><td class="num">${esc(r.unit_cost)}</td><td class="num">${esc(r.quantity)}</td><td class="num">${esc(r.total)}</td><td class="src">${esc(r.source)}</td></tr>`).join("");
  return `<table class="budget">${head}${body}</table>`;
}

// Template style presets: colour + fonts only. Structure is shared.
const TEMPLATES = {
  institutional: { accent:"#0f3d34", accent2:"#0f6e5c", fontBody:'"Georgia","Noto Serif",serif', fontHead:'"Helvetica Neue",Arial,sans-serif' },
  contemporary:  { accent:"#1f3a5f", accent2:"#2a6fb0", fontBody:'"Helvetica Neue",Arial,sans-serif', fontHead:'"Helvetica Neue",Arial,sans-serif' },
};

function renderProposalHTML(p, opts){
  const d = p || {};
  const o = opts || {};
  const tpl = TEMPLATES[o.template] || TEMPLATES.institutional;
  const accent = tpl.accent, accent2 = tpl.accent2;
  const fontBody = o.fontBody || tpl.fontBody;
  const fontHead = o.fontHead || tpl.fontHead;
  const fontSize = o.fontSize || "10.7pt";
  const includeToc = o.includeToc !== false;   // default on
  const includeBack = o.includeBack !== false; // default on

  const sections = [];
  const add = (title, html) => { if(html && html.trim()) sections.push({ title, html }); };
  add("Problem Statement", paras(d.problem));
  add("Project Objective", paras(d.objective));
  add("Operational Strategy", paras(d.strategy));
  add("Activities", paras(d.activities));
  add("Results Framework", matrixTable(d.matrix));
  add("Sustainability", paras(d.sustainability));
  add("Budget", budgetTable(d.budget_table));

  const toc = sections.map((s,i)=>`<li><a href="#sec${i}"><span class="toc-title">${esc(s.title)}</span><span class="dots"></span></a></li>`).join("");
  const body = sections.map((s,i)=>`<section id="sec${i}"><h2>${esc(s.title)}</h2>${s.html}</section>`).join("");

  const tocBlock = includeToc ? `<nav class="toc"><h2>Contents</h2><ol>${toc}</ol></nav>` : "";
  const backBlock = includeBack ? `
  <div class="back">
    <div class="rule">
      <div class="big">${esc(d.title || "Project Proposal")}</div>
      ${d.orgName ? `<div><b>${esc(d.orgName)}</b></div>` : ""}
      ${d.orgAddress ? `<div>${esc(d.orgAddress)}</div>` : ""}
      ${d.orgContact ? `<div>${esc(d.orgContact)}</div>` : ""}
      ${d.closing ? `<div style="margin-top:4mm;font-style:italic">${esc(d.closing)}</div>` : ""}
      <div style="margin-top:3mm">Prepared with the Proposal Development Agent · Method by Prakash Kumar</div>
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
    <div class="kicker">Project Proposal</div>
    <h1>${esc(d.title || "Project Proposal")}</h1>
    ${d.subtitle ? `<div class="sub">${esc(d.subtitle)}</div>` : ""}
    <div class="meta">
      ${d.geography ? `<div><b>Location:</b> ${esc(d.geography)}</div>` : ""}
      ${d.duration ? `<div><b>Duration:</b> ${esc(d.duration)}</div>` : ""}
      ${d.budget ? `<div><b>Budget:</b> ${esc(d.budget)}</div>` : ""}
      ${d.submittedTo ? `<div style="margin-top:3mm"><b>Submitted to:</b> ${esc(d.submittedTo)}</div>` : ""}
      ${d.submittedBy ? `<div><b>Submitted by:</b> ${esc(d.submittedBy)}</div>` : ""}
    </div>
  </div>
  ${tocBlock}
  ${body}
  ${backBlock}
</body></html>`;
}
module.exports = { renderProposalHTML, TEMPLATES };
