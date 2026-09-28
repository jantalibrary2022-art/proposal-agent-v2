const ExcelJS = require("exceljs");

const LABELS = {
  English: { title:"Project Budget", item:"Item", unit:"Unit", unitcost:"Unit cost (₹)", qty:"Quantity", total:"Total (₹)", source:"Source / note", grand:"GRAND TOTAL" },
  Hindi:   { title:"परियोजना बजट", item:"मद", unit:"इकाई", unitcost:"इकाई लागत (₹)", qty:"संख्या", total:"कुल (₹)", source:"स्रोत / टिप्पणी", grand:"कुल योग" },
};

// Parse a figure like "8,40,000" or "35,000" into a number; return null if not numeric (e.g. a placeholder).
function toNumber(v){
  if(v == null) return null;
  const cleaned = String(v).replace(/[,₹\s]/g, "");
  if(cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

async function generateBudgetXlsx(d){
  const L = LABELS[d.lang] || LABELS.English;
  const lines = (d.budget_table && d.budget_table.lines) || [];
  const wb = new ExcelJS.Workbook();
  wb.creator = "Proposal Development Agent";
  const ws = wb.addWorksheet("Budget");

  // Title row
  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = d.title ? `${L.title} — ${d.title}` : L.title;
  ws.getCell("A1").font = { bold:true, size:14, color:{ argb:"FF0F3D34" } };
  ws.getCell("A1").alignment = { vertical:"middle" };
  ws.getRow(1).height = 24;

  // Header row (row 3)
  const headers = [L.item, L.unit, L.unitcost, L.qty, L.total, L.source];
  const headerRow = ws.getRow(3);
  headers.forEach((h,i)=>{ const c = headerRow.getCell(i+1); c.value = h; c.font = { bold:true, color:{argb:"FFFFFFFF"} }; c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F3D34"} }; c.alignment = { vertical:"middle" }; });
  headerRow.height = 20;

  // Data rows, with live formulas for Total where numeric.
  let r = 4;
  const firstDataRow = r;
  for(const line of lines){
    const uc = toNumber(line.unit_cost);
    const qty = toNumber(line.quantity);
    const row = ws.getRow(r);
    row.getCell(1).value = line.item || "";
    row.getCell(2).value = line.unit || "";
    row.getCell(3).value = uc !== null ? uc : (line.unit_cost || "");
    row.getCell(4).value = qty !== null ? qty : (line.quantity || "");
    // Total: live formula if both numeric, else the given text / placeholder.
    if(uc !== null && qty !== null){
      row.getCell(5).value = { formula:`C${r}*D${r}` };
    } else {
      row.getCell(5).value = line.total || "[—]";
    }
    row.getCell(6).value = line.source || "";
    // number formatting for numeric cells
    if(uc !== null) row.getCell(3).numFmt = "#,##,##0";
    if(uc !== null && qty !== null) row.getCell(5).numFmt = "#,##,##0";
    r++;
  }
  const lastDataRow = r - 1;

  // Grand total row
  const gr = ws.getRow(r+1);
  gr.getCell(4).value = L.grand;
  gr.getCell(4).font = { bold:true };
  if(lastDataRow >= firstDataRow){
    gr.getCell(5).value = { formula:`SUM(E${firstDataRow}:E${lastDataRow})` };
    gr.getCell(5).numFmt = "#,##,##0";
    gr.getCell(5).font = { bold:true, color:{argb:"FF0F3D34"} };
  }

  // Column widths
  ws.getColumn(1).width = 34;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 10;
  ws.getColumn(5).width = 16;
  ws.getColumn(6).width = 34;

  return await wb.xlsx.writeBuffer();
}
module.exports = { generateBudgetXlsx };
