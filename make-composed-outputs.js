const fs = require("fs");
const { substance, buildDocData } = require("./sample-substance");
const { generateDocx } = require("./lib/proposal-docx");
const { generateBudgetXlsx } = require("./lib/budget-xlsx");

(async () => {
  if(!fs.existsSync("composed-content.json")){
    console.log("composed-content.json not found — run 'node make-composed-proposal.js' first.");
    return;
  }
  const c = JSON.parse(fs.readFileSync("composed-content.json","utf8"));
  const docData = buildDocData(substance, c);
  fs.writeFileSync("COMPOSED-proposal.docx", await generateDocx(docData));
  fs.writeFileSync("COMPOSED-budget.xlsx", await generateBudgetXlsx(docData));
  console.log("Wrote COMPOSED-proposal.docx and COMPOSED-budget.xlsx (no API call; used saved composed-content.json)");
})();
