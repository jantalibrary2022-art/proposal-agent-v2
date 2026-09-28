const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TableOfContents, Footer, PageNumber, PageBreak } = require("docx");

const LABELS = {
  English: { kicker:"Project Proposal", contents:"Contents", location:"Location", duration:"Duration", budget:"Budget", submittedTo:"Submitted to", submittedBy:"Submitted by", sec_problem:"Problem Statement", sec_objective:"Project Objective", sec_strategy:"Operational Strategy", sec_activities:"Activities", sec_results:"Results Framework", sec_sustainability:"Sustainability", sec_budget:"Budget", th_level:"Level", th_statement:"Result statement", th_indicator:"Indicator", th_baseline:"Baseline", th_target:"Target", th_mov:"Means of verification", b_item:"Item", b_unit:"Unit", b_unitcost:"Unit cost", b_qty:"Qty", b_total:"Total", b_source:"Source" },
  Hindi: { kicker:"परियोजना प्रस्ताव", contents:"विषय-सूची", location:"स्थान", duration:"अवधि", budget:"बजट", submittedTo:"प्रस्तुत किया गया", submittedBy:"प्रस्तुतकर्ता", sec_problem:"समस्या विवरण", sec_objective:"परियोजना उद्देश्य", sec_strategy:"संचालन रणनीति", sec_activities:"गतिविधियाँ", sec_results:"Results Framework (परिणाम ढाँचा)", sec_sustainability:"स्थिरता", sec_budget:"बजट", th_level:"स्तर", th_statement:"परिणाम कथन", th_indicator:"संकेतक", th_baseline:"आधार रेखा", th_target:"लक्ष्य", th_mov:"सत्यापन का साधन", b_item:"मद", b_unit:"इकाई", b_unitcost:"इकाई लागत", b_qty:"संख्या", b_total:"कुल", b_source:"स्रोत" },
};
const ACCENT = "0F3D34";

function bodyParas(text){
  if(!text) return [];
  return String(text).split(/\n\s*\n/).map(p => new Paragraph({
    children:[new TextRun({ text:p.replace(/\n/g," "), size:22 })],
    spacing:{ after:160 }, alignment:AlignmentType.JUSTIFIED
  }));
}
function heading(text, breakBefore){
  return new Paragraph({ heading:HeadingLevel.HEADING_1, pageBreakBefore: breakBefore!==false, spacing:{ before:280, after:140 },
    children:[new TextRun({ text, bold:true, size:30, color:ACCENT })] });
}
function cell(text, opts){
  const o = opts||{};
  return new TableCell({
    width:{ size:o.w||2000, type:WidthType.DXA },
    shading: o.head ? { fill:ACCENT } : undefined,
    children:[new Paragraph({ children:[new TextRun({ text:String(text||""), bold:!!o.head, color:o.head?"FFFFFF":"000000", size:o.head?16:18 })] })]
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
  if(!bd||!bd.lines||!bd.lines.length) return null;
  const ws=[3000,1400,1600,1000,1800,2600];
  const header = new TableRow({ children:[L.b_item,L.b_unit,L.b_unitcost,L.b_qty,L.b_total,L.b_source].map((t,i)=>cell(t,{head:true,w:ws[i]})) });
  const rows = bd.lines.map(r=> new TableRow({ children:[r.item,r.unit,r.unit_cost,r.quantity,r.total,r.source].map((v,i)=>cell(v,{w:ws[i]})) }));
  return new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows:[header,...rows] });
}

async function generateDocx(d){
  const L = LABELS[d.lang] || LABELS.English;
  const kids = [];
  // Cover
  kids.push(new Paragraph({ spacing:{ before:2400 } }));
  kids.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:120 }, children:[new TextRun({ text:L.kicker.toUpperCase(), color:"0F6E5C", size:20, bold:true })] }));
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

  const section=(title,text)=>{ if(text&&text.trim()){ kids.push(heading(title)); bodyParas(text).forEach(p=>kids.push(p)); } };
  section(L.sec_problem, d.problem);
  section(L.sec_objective, d.objective);
  section(L.sec_strategy, d.strategy);
  section(L.sec_activities, d.activities);
  const mt=matrixTable(d.matrix,L); if(mt){ kids.push(heading(L.sec_results)); kids.push(mt); }
  section(L.sec_sustainability, d.sustainability);
  const bt=budgetTable(d.budget_table,L); if(bt){ kids.push(heading(L.sec_budget)); kids.push(bt); }

  const footer = new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[ new TextRun({ children:[PageNumber.CURRENT], size:18, color:"5A6763" }) ] }) ] });
  const doc = new Document({
    features:{ updateFields:true },
    styles:{ default:{ document:{ run:{ font:"Calibri", size:22 } } } },
    sections:[{ properties:{}, footers:{ default: footer }, children:kids }],
  });
  return await Packer.toBuffer(doc);
}
module.exports = { generateDocx };
