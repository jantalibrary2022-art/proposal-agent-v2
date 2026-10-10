const ExcelJS = require("exceljs");

const LABELS = {
  English: { title:"Project Budget", item:"Item", unit:"Unit", unitcost:"Unit cost (₹)", qty:"Quantity", total:"Total (₹)", contributes:"Contributes to", source:"Source / note", subtotal:"Subtotal", grand:"GRAND TOTAL", timeline_title:"Implementation Timeline", g_activity:"Activity", g_legend:"Shaded cells = active quarters. Q1–Q2 mobilisation; Q3–Q6 capacity-building & assets; Q7–Q8 consolidation & transition.", est_note:"Amber cells are estimated rates. Confirm or replace them; see the 'Rates to Confirm' sheet. Totals recalculate automatically.", rates_title:"Rates to Confirm", rates_item:"Item", rates_est:"Estimated rate", rates_action:"What to confirm or supply" },
  Hindi:   { title:"परियोजना बजट", item:"मद", unit:"इकाई", unitcost:"इकाई लागत (₹)", qty:"संख्या", total:"कुल (₹)", contributes:"संबंधित परिणाम", source:"स्रोत / टिप्पणी", subtotal:"उप-योग", grand:"कुल योग", timeline_title:"क्रियान्वयन समय-सारिणी", g_activity:"गतिविधि", g_legend:"छायांकित कक्ष = सक्रिय तिमाही। Q1–Q2 संगठन; Q3–Q6 क्षमता-निर्माण; Q7–Q8 सुदृढ़ीकरण।", est_note:"अंबर रंग के कक्ष अनुमानित दरें हैं। इन्हें पुष्टि/प्रतिस्थापित करें; 'Rates to Confirm' शीट देखें। कुल स्वतः पुनर्गणना होंगे।", rates_title:"पुष्टि हेतु दरें", rates_item:"मद", rates_est:"अनुमानित दर", rates_action:"क्या पुष्टि/उपलब्ध कराना है" },
};

const EST_FILL = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFCE8CC" } };

// Parse "8,40,000" -> 840000; null if not a plain number.
function toNumber(v){
  if(v == null) return null;
  const cleaned = String(v).replace(/[,₹\s]/g, "");
  if(cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

async function generateBudgetXlsx(d){
  const L = LABELS[d.lang] || LABELS.English;
  const bd = d.budget_table || {};
  const cats = bd.categories || (bd.lines ? [{ name:"", lines:bd.lines }] : []);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Budget";
  const ws = wb.addWorksheet("Budget");

  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = d.title ? `${L.title} — ${d.title}` : L.title;
  ws.getCell("A1").font = { bold:true, size:14, color:{ argb:"FF0F3D34" } };
  ws.getCell("A1").alignment = { vertical:"middle" };
  ws.getRow(1).height = 24;

  ws.mergeCells("A2:G2");
  ws.getCell("A2").value = L.est_note;
  ws.getCell("A2").font = { italic:true, size:9, color:{ argb:"FF8A5A00" } };

  const headers = [L.item, L.unit, L.unitcost, L.qty, L.total, L.contributes, L.source];
  const headerRow = ws.getRow(3);
  headers.forEach((h,i)=>{ const c = headerRow.getCell(i+1); c.value = h; c.font = { bold:true, color:{argb:"FFFFFFFF"} }; c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F3D34"} }; c.alignment = { vertical:"middle" }; });
  headerRow.height = 20;

  let r = 4; const subtotalCells = [];
  cats.forEach((c, ci)=>{
    const letter = String.fromCharCode(65+ci);
    if(c.name){
      ws.mergeCells(`A${r}:G${r}`);
      const cc = ws.getCell(`A${r}`);
      cc.value = `${letter}. ${c.name}`;
      cc.font = { bold:true, color:{argb:"FFFFFFFF"} };
      cc.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F6E5C"} };
      r++;
    }
    const firstData = r;
    (c.lines||[]).forEach(line=>{
      const uc = toNumber(line.unit_cost); const qty = toNumber(line.quantity);
      const row = ws.getRow(r);
      row.getCell(1).value = line.item || "";
      row.getCell(2).value = line.unit || "";
      row.getCell(3).value = uc !== null ? uc : (line.unit_cost || "");
      row.getCell(4).value = qty !== null ? qty : (line.quantity || "");
      // The Total must always be a NUMBER so the SUM() subtotals and grand total
      // add it up. When the quantity is a plain number we keep a live =C*D formula;
      // when it is descriptive (e.g. "480 (60 teachers x 4 days x 2 years)") we
      // write the engine's computed total as a number, not a string. A text total
      // is silently skipped by SUM, which made the Excel total disagree with the
      // document.
      const tot = toNumber(line.total);
      if(uc !== null && qty !== null){ row.getCell(5).value = { formula:`C${r}*D${r}` }; }
      else if(tot !== null){ row.getCell(5).value = tot; }
      else { row.getCell(5).value = line.total || "[—]"; }
      row.getCell(6).value = line.contributes || "";
      row.getCell(7).value = line.source || "";
      if(uc !== null) row.getCell(3).numFmt = "#,##,##0";
      if((uc !== null && qty !== null) || tot !== null) row.getCell(5).numFmt = "#,##,##0";
      if(line.rate_basis === "estimate"){ row.getCell(3).fill = EST_FILL; }
      r++;
    });
    const lastData = r - 1;
    const sr = ws.getRow(r);
    sr.getCell(4).value = L.subtotal;
    sr.getCell(4).font = { bold:true, color:{argb:"FF0F3D34"} };
    if(lastData >= firstData){
      sr.getCell(5).value = { formula:`SUM(E${firstData}:E${lastData})` };
      sr.getCell(5).numFmt = "#,##,##0";
      sr.getCell(5).font = { bold:true, color:{argb:"FF0F3D34"} };
      subtotalCells.push(`E${r}`);
    }
    [4,5].forEach(cn=>{ sr.getCell(cn).fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFEEF2EF"} }; });
    r++;
  });

  const gr = ws.getRow(r+1);
  gr.getCell(4).value = L.grand;
  gr.getCell(4).font = { bold:true, color:{argb:"FFFFFFFF"} };
  gr.getCell(4).fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F3D34"} };
  if(subtotalCells.length){
    gr.getCell(5).value = { formula:`SUM(${subtotalCells.join(",")})` };
    gr.getCell(5).numFmt = "#,##,##0";
    gr.getCell(5).font = { bold:true, color:{argb:"FFFFFFFF"} };
    gr.getCell(5).fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F3D34"} };
  }

  ws.getColumn(1).width = 34; ws.getColumn(2).width = 13; ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 9;  ws.getColumn(5).width = 16; ws.getColumn(6).width = 26; ws.getColumn(7).width = 34;

  // Rates to Confirm sheet
  const rtc = d.rates_to_confirm || [];
  if(rtc.length){
    const cs = wb.addWorksheet("Rates to Confirm");
    cs.mergeCells("A1:C1");
    cs.getCell("A1").value = L.rates_title;
    cs.getCell("A1").font = { bold:true, size:14, color:{ argb:"FF8A5A00" } };
    cs.getRow(1).height = 24;
    const h = cs.getRow(3);
    [L.rates_item, L.rates_est, L.rates_action].forEach((t,i)=>{ const c = h.getCell(i+1); c.value = t; c.font = { bold:true, color:{argb:"FFFFFFFF"} }; c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF8A5A00"} }; });
    let rr = 4;
    rtc.forEach(x=>{ const row = cs.getRow(rr); row.getCell(1).value = x.item || ""; row.getCell(2).value = x.estimated_rate || ""; row.getCell(3).value = x.prompt || ""; row.getCell(3).alignment = { wrapText:true }; rr++; });
    cs.getColumn(1).width = 34; cs.getColumn(2).width = 20; cs.getColumn(3).width = 60;
  }

  // Timeline sheet
  const tl = d.timeline;
  if(tl && tl.rows && tl.rows.length){
    const units = tl.units || ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8"];
    const ts = wb.addWorksheet("Timeline");
    ts.mergeCells(1, 1, 1, units.length+1);
    ts.getCell("A1").value = L.timeline_title;
    ts.getCell("A1").font = { bold:true, size:14, color:{argb:"FF0F3D34"} };
    ts.getRow(1).height = 24;
    const th = ts.getRow(3);
    th.getCell(1).value = L.g_activity;
    th.getCell(1).font = { bold:true, color:{argb:"FFFFFFFF"} };
    th.getCell(1).fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F3D34"} };
    units.forEach((u,i)=>{ const c = th.getCell(i+2); c.value = u; c.font = { bold:true, color:{argb:"FFFFFFFF"} }; c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F3D34"} }; c.alignment = { horizontal:"center" }; });
    let rr = 4;
    tl.rows.forEach(row=>{
      const set = new Set(row.active||[]);
      const xr = ts.getRow(rr);
      xr.getCell(1).value = row.activity;
      units.forEach((_,i)=>{ const c = xr.getCell(i+2); if(set.has(i+1)){ c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F6E5C"} }; } c.alignment = { horizontal:"center" }; });
      rr++;
    });
    ts.mergeCells(rr+1, 1, rr+1, units.length+1);
    const lc = ts.getCell(rr+1, 1);
    lc.value = L.g_legend;
    lc.font = { italic:true, size:9, color:{argb:"FF5A6763"} };
    lc.alignment = { wrapText:true, vertical:"top" };
    ts.getColumn(1).width = 42;
    for(let i=0;i<units.length;i++){ ts.getColumn(i+2).width = 6; }
  }

  return await wb.xlsx.writeBuffer();
}
module.exports = { generateBudgetXlsx };
