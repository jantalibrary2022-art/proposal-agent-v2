const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TableOfContents, Footer, PageNumber, PageBreak } = require("docx");

const LABELS = {
  English: { kicker:"Project Proposal", contents:"Contents", location:"Location", duration:"Duration", budget:"Budget", submittedTo:"Submitted to", submittedBy:"Submitted by", sec_problem:"Problem Statement", sec_objective:"Project Objective", sec_strategy:"Operational Strategy", sec_activities:"Activities", sec_timeline:"Implementation Timeline", sec_results:"Results Framework", sec_risk:"Risk Management", r_risk:"Risk", r_likelihood:"Likelihood", r_impact:"Impact", r_mitigation:"Mitigation", r_intro:"The project's principal risks, their likelihood and impact, and how each is managed:", sec_sustainability:"Sustainability", sec_budget:"Budget", sec_references:"References", th_level:"Level", th_statement:"Result statement", th_indicator:"Indicator", th_baseline:"Baseline", th_target:"Target", th_mov:"Means of verification", b_item:"Item", b_unit:"Unit", b_unitcost:"Unit cost", b_qty:"Qty", b_total:"Total", b_contributes:"Contributes to", b_source:"Source", b_subtotal:"Subtotal —", b_grandtotal:"Grand Total", b_note:"Subtotals and grand total sum only the costed lines; lines marked to confirm are excluded until priced.", g_activity:"Activity", g_legend:"Shaded cells indicate active quarters. Q1–Q2: mobilisation and group formation. Q3–Q6: capacity-building and asset support. Q7–Q8: consolidation, market linkage and transition." },
  Hindi: { kicker:"परियोजना प्रस्ताव", contents:"विषय-सूची", location:"स्थान", duration:"अवधि", budget:"बजट", submittedTo:"प्रस्तुत किया गया", submittedBy:"प्रस्तुतकर्ता", sec_problem:"समस्या विवरण", sec_objective:"परियोजना उद्देश्य", sec_strategy:"संचालन रणनीति", sec_activities:"गतिविधियाँ", sec_timeline:"क्रियान्वयन समय-सारिणी", sec_results:"Results Framework (परिणाम ढाँचा)", sec_risk:"जोखिम प्रबंधन", r_risk:"जोखिम", r_likelihood:"संभावना", r_impact:"प्रभाव", r_mitigation:"शमन", r_intro:"परियोजना के प्रमुख जोखिम, उनकी संभावना एवं प्रभाव, तथा प्रत्येक का प्रबंधन:", sec_sustainability:"स्थिरता", sec_budget:"बजट", sec_references:"संदर्भ", th_level:"स्तर", th_statement:"परिणाम कथन", th_indicator:"संकेतक", th_baseline:"आधार रेखा", th_target:"लक्ष्य", th_mov:"सत्यापन का साधन", b_item:"मद", b_unit:"इकाई", b_unitcost:"इकाई लागत", b_qty:"संख्या", b_total:"कुल", b_contributes:"संबंधित परिणाम", b_source:"स्रोत", b_subtotal:"उप-योग —", b_grandtotal:"कुल योग", b_note:"उप-योग एवं कुल योग केवल मूल्यांकित मदों का योग है; पुष्टि हेतु चिह्नित मदें शामिल नहीं हैं।", g_activity:"गतिविधि", g_legend:"छायांकित कक्ष सक्रिय तिमाहियों को दर्शाते हैं। Q1–Q2: संगठन। Q3–Q6: क्षमता-निर्माण। Q7–Q8: सुदृढ़ीकरण।" },
};
const ACCENT = "0F3D34";
const ACCENT2 = "0F6E5C";

function parseAmt(s){ const n = Number(String(s==null?"":s).replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; }
function fmtIN(n){
  let s = Math.round(n).toString(); const neg = s.startsWith("-"); if(neg) s=s.slice(1);
  const lastThree = s.length>3 ? s.slice(-3) : s;
  let rest = s.length>3 ? s.slice(0, s.length-3) : "";
  if(rest !== ""){ rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ","); s = rest + "," + lastThree; }
  else { s = lastThree; }
  return (neg?"-":"") + s;
}

// **bold** and [S#] citations -> TextRuns (citations as small superscripts).
function runsFromInline(text, base){
  base = base || {};
  const size = base.size || 22;
  const parts = String(text).split(/(\*\*.+?\*\*|(?:\[S\d+\])+)/g).filter(s => s !== "");
  return parts.map(seg => {
    const m = seg.match(/^\*\*(.+?)\*\*$/);
    if(m) return new TextRun({ text:m[1], bold:true, size, color:base.color });
    if(/^(?:\[S\d+\])+$/.test(seg)) return new TextRun({ text:seg, size:Math.round(size*0.72), color:ACCENT2, superScript:true });
    return new TextRun({ text:seg, size, color:base.color });
  });
}

function mdToParas(text){
  if(!text) return [];
  const lines = String(text).replace(/\r\n/g,"\n").split("\n");
  const out = []; let para = []; let i = 0; let num = 0;
  const flush = () => {
    if(para.length){
      const joined = para.join(" ").trim();
      if(joined) out.push(new Paragraph({ children:runsFromInline(joined,{size:22}), spacing:{after:160}, alignment:AlignmentType.JUSTIFIED }));
      para = [];
    }
  };
  while(i < lines.length){
    const t = lines[i].trim();
    if(t === ""){ flush(); num=0; i++; continue; }
    const h = t.match(/^(#{2,4})\s+(.*)$/);
    if(h){ flush(); num=0; const lvl = h[1].length;
      out.push(new Paragraph({ spacing:{before:200,after:100}, children:[new TextRun({ text:h[2].trim(), bold:true, color: lvl===2?ACCENT2:ACCENT, size: lvl===2?24:22 })] }));
      i++; continue; }
    if(/^[-*]\s+/.test(t)){ flush(); num=0;
      while(i < lines.length && /^\s*[-*]\s+/.test(lines[i])){
        out.push(new Paragraph({ bullet:{level:0}, spacing:{after:60}, children:runsFromInline(lines[i].replace(/^\s*[-*]\s+/,"").trim(),{size:22}) }));
        i++; }
      continue; }
    if(/^\d+\.\s+/.test(t)){ flush();
      while(i < lines.length && /^\s*\d+\.\s+/.test(lines[i])){
        num++; const it = lines[i].replace(/^\s*\d+\.\s+/,"").trim();
        out.push(new Paragraph({ indent:{left:360}, spacing:{after:60}, children:[new TextRun({ text:num+". ", bold:true, size:22 }), ...runsFromInline(it,{size:22})] }));
        i++; }
      continue; }
    para.push(t); i++;
  }
  flush();
  return out;
}

function heading(text, breakBefore){
  return new Paragraph({ heading:HeadingLevel.HEADING_1, pageBreakBefore: breakBefore!==false, spacing:{ before:280, after:140 },
    children:[new TextRun({ text, bold:true, size:30, color:ACCENT })] });
}
function noteParagraph(text){
  return new Paragraph({ spacing:{before:80,after:160}, children:[new TextRun({ text, italics:true, size:16, color:"5A6763" })] });
}
function cell(text, opts){
  const o = opts||{};
  return new TableCell({
    width:{ size:o.w||2000, type:WidthType.DXA },
    columnSpan: o.span || undefined,
    shading: o.fill ? { fill:o.fill } : (o.head ? { fill:ACCENT } : undefined),
    children:[new Paragraph({ children:[new TextRun({ text:String(text||""), bold:!!o.bold||!!o.head, color:o.color||(o.head?"FFFFFF":"000000"), size:o.size||(o.head?16:18) })] })]
  });
}
function matrixTable(mx, L){
  if(!mx||!mx.rows||!mx.rows.length) return null;
  const ws=[1300,2400,2200,1500,1500,2000];
  const header = new TableRow({ children:[L.th_level,L.th_statement,L.th_indicator,L.th_baseline,L.th_target,L.th_mov].map((t,i)=>cell(t,{head:true,w:ws[i]})) });
  const rows = mx.rows.map(r=> new TableRow({ children:[r.level,r.statement,r.indicator,r.baseline,r.target,r.mov].map((v,i)=>cell(v,{w:ws[i]})) }));
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows:[header,...rows] });
}
function budgetTable(bd, L){
  if(!bd) return null;
  const cats = bd.categories || (bd.lines?[{name:"",lines:bd.lines}]:[]);
  if(!cats.length) return null;
  const ws=[2400,1000,1200,700,1500,2000,2600];
  const rows=[ new TableRow({ children:[L.b_item,L.b_unit,L.b_unitcost,L.b_qty,L.b_total,L.b_contributes,L.b_source].map((t,i)=>cell(t,{head:true,w:ws[i]})) }) ];
  let grand=0; let hasPlaceholder=false;
  cats.forEach((c,ci)=>{
    const letter=String.fromCharCode(65+ci);
    const cname = String(c.name||"").replace(/^[A-Za-z]\.\s+/, "");
    if(cname){ rows.push(new TableRow({ children:[ cell(letter+". "+cname, { span:7, fill:ACCENT2, color:"FFFFFF", bold:true, size:18 }) ] })); }
    let sub=0;
    (c.lines||[]).forEach(r=>{
      const amt=parseAmt(r.total); if(amt>0) sub+=amt; else hasPlaceholder=true;
      rows.push(new TableRow({ children:[r.item,r.unit,r.unit_cost,r.quantity,r.total,r.contributes,r.source].map((v,i)=>cell(v,{w:ws[i]})) }));
    });
    grand+=sub;
    const subDisp = sub>0?fmtIN(sub):"—";
    rows.push(new TableRow({ children:[
      cell(L.b_subtotal+" "+cname, { span:4, fill:"EEF2EF", color:ACCENT, bold:true, size:18 }),
      cell(subDisp, { fill:"EEF2EF", color:ACCENT, bold:true, size:18 }),
      cell("", { span:2, fill:"EEF2EF" })
    ] }));
  });
  rows.push(new TableRow({ children:[
    cell(L.b_grandtotal, { span:4, fill:ACCENT, color:"FFFFFF", bold:true, size:19 }),
    cell(fmtIN(grand), { fill:ACCENT, color:"FFFFFF", bold:true, size:19 }),
    cell("", { span:2, fill:ACCENT })
  ] }));
  return { table:new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }), hasPlaceholder };
}
function ganttTable(tl, L){
  if(!tl||!tl.rows||!tl.rows.length) return null;
  const units = tl.units || ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8"];
  const wAct=3400; const wQ=Math.round((11400-wAct)/units.length);
  const header = new TableRow({ children:[ cell(L.g_activity,{head:true,w:wAct}), ...units.map(u=>cell(u,{head:true,w:wQ})) ] });
  const rows = tl.rows.map(r=>{
    const set=new Set(r.active||[]);
    const cells=[ cell(r.activity,{w:wAct,size:16}) ];
    units.forEach((_,idx)=>{
      const on=set.has(idx+1);
      cells.push(new TableCell({ width:{size:wQ,type:WidthType.DXA}, shading: on?{fill:ACCENT2}:undefined, children:[new Paragraph({ children:[new TextRun({ text:"", size:16 })] })] }));
    });
    return new TableRow({ children:cells });
  });
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows:[header,...rows] });
}
function riskLevelColor(v){
  const t = String(v||"").toLowerCase();
  if(t.indexOf("high")===0) return "B3261E";
  if(t.indexOf("med")===0) return "9A6A00";
  if(t.indexOf("low")===0) return ACCENT2;
  return "000000";
}
function riskCellInline(text, w){
  return new TableCell({ width:{ size:w, type:WidthType.DXA },
    children:[new Paragraph({ children:runsFromInline(String(text||""),{size:18}) })] });
}
function riskCellLevel(text, w){
  return new TableCell({ width:{ size:w, type:WidthType.DXA },
    children:[new Paragraph({ children:[new TextRun({ text:String(text||""), bold:true, size:18, color:riskLevelColor(text) })] })] });
}
function riskTable(risks, L){
  if(!risks || !risks.length) return null;
  const ws=[3000,1400,1400,5600];
  const header = new TableRow({ children:[L.r_risk,L.r_likelihood,L.r_impact,L.r_mitigation].map((t,i)=>cell(t,{head:true,w:ws[i]})) });
  const rows = risks.map(r=> new TableRow({ children:[
    riskCellInline(r.risk, ws[0]),
    riskCellLevel(r.likelihood, ws[1]),
    riskCellLevel(r.impact, ws[2]),
    riskCellInline(r.mitigation, ws[3])
  ] }));
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows:[header,...rows] });
}
function referencesSection(sources, L){
  if(!sources || !sources.length) return [];
  const kids = [ heading(L.sec_references) ];
  sources.forEach(s => {
    kids.push(new Paragraph({ spacing:{after:40}, children:[ new TextRun({ text:"["+s.ref+"] ", bold:true, size:18, color:ACCENT }), new TextRun({ text:s.title, size:18 }) ] }));
    if(s.url) kids.push(new Paragraph({ spacing:{after:130}, children:[ new TextRun({ text:s.url, size:16, color:ACCENT2 }) ] }));
  });
  return kids;
}

async function generateDocx(d){
  const L = LABELS[d.lang] || LABELS.English;
  const kids = [];
  kids.push(new Paragraph({ spacing:{ before:2400 } }));
  kids.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:120 }, children:[new TextRun({ text:L.kicker.toUpperCase(), color:ACCENT2, size:20, bold:true })] }));
  kids.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:200 }, children:[new TextRun({ text:d.title||"Project Proposal", bold:true, size:44, color:ACCENT })] }));
  if(d.subtitle) kids.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:300 }, children:[new TextRun({ text:d.subtitle, italics:true, size:24, color:"3A4A47" })] }));
  const metaLine=(lbl,val)=> new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:60}, children:[new TextRun({text:lbl+": ",bold:true,size:20}),new TextRun({text:String(val),size:20})] });
  if(d.geography) kids.push(metaLine(L.location,d.geography));
  if(d.duration) kids.push(metaLine(L.duration,d.duration));
  if(d.budget) kids.push(metaLine(L.budget,d.budget));
  if(d.submittedTo) kids.push(metaLine(L.submittedTo,d.submittedTo));
  if(d.submittedBy) kids.push(metaLine(L.submittedBy,d.submittedBy));
  kids.push(new Paragraph({ pageBreakBefore:true }));
  kids.push(new Paragraph({ spacing:{after:160}, children:[new TextRun({ text:L.contents, bold:true, size:32, color:ACCENT })] }));
  kids.push(new TableOfContents("Contents", { hyperlink:true, headingStyleRange:"1-1" }));

  const section=(title,text)=>{ if(text&&text.trim()){ kids.push(heading(title)); mdToParas(text).forEach(p=>kids.push(p)); } };
  section(L.sec_problem, d.problem);
  section(L.sec_objective, d.objective);
  section(L.sec_strategy, d.strategy);
  section(L.sec_activities, d.activities);
  const gt=ganttTable(d.timeline,L); if(gt){ kids.push(heading(L.sec_timeline)); kids.push(gt); if(L.g_legend) kids.push(noteParagraph(L.g_legend)); }
  const mt=matrixTable(d.matrix,L);
  if((d.results_narrative&&d.results_narrative.trim())||mt){ kids.push(heading(L.sec_results)); mdToParas(d.results_narrative).forEach(p=>kids.push(p)); if(mt) kids.push(mt); }
  const rkt=riskTable(d.risks,L); if(rkt){ kids.push(heading(L.sec_risk)); kids.push(new Paragraph({ spacing:{after:140}, children:runsFromInline(L.r_intro,{size:22}) })); kids.push(rkt); }
  section(L.sec_sustainability, d.sustainability);
  const btr=budgetTable(d.budget_table,L); if(btr){ kids.push(heading(L.sec_budget)); kids.push(btr.table); if(btr.hasPlaceholder) kids.push(noteParagraph(L.b_note)); }
  referencesSection(d.sources, L).forEach(p => kids.push(p));

  const footer = new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[ new TextRun({ children:[PageNumber.CURRENT], size:18, color:"5A6763" }) ] }) ] });
  const doc = new Document({
    features:{ updateFields:true },
    styles:{ default:{ document:{ run:{ font:"Calibri", size:22 } } } },
    sections:[{ properties:{}, footers:{ default: footer }, children:kids }],
  });
  return await Packer.toBuffer(doc);
}
module.exports = { generateDocx };
