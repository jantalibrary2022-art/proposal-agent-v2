const fs = require("fs");
const { generateBudgetXlsx } = require("./lib/budget-xlsx");

const data = {
  lang:"English",
  title:"Arki Block Women's Livelihoods & Nutrition",
  budget_table:{ lines:[
    { item:"Project Coordinator", unit:"month", unit_cost:"35,000", quantity:"24", total:"8,40,000", source:"NRLM project-staff norms" },
    { item:"Field Coordinators (2)", unit:"month", unit_cost:"25,000", quantity:"48", total:"12,00,000", source:"Technical field-staff rates" },
    { item:"Community Mobilisers (5)", unit:"month", unit_cost:"15,000", quantity:"120", total:"18,00,000", source:"Prevailing NGO field-staff rates, Jharkhand" },
    { item:"Livelihood skills training", unit:"batch of 40", unit_cost:"30,000", quantity:"20", total:"6,00,000", source:"NRLM training cost norms" },
    { item:"Kitchen garden input kits", unit:"household", unit_cost:"1,500", quantity:"500", total:"7,50,000", source:"[rate — confirm locally]" },
    { item:"CRP residential training", unit:"lump sum", unit_cost:"[rate — needs your input]", quantity:"1", total:"[TBD]", source:"Venue/trainer cost not sourceable" },
    { item:"Goat units (2 does)", unit:"unit", unit_cost:"12,000", quantity:"100", total:"12,00,000", source:"State livestock scheme norms" },
  ]},
};

(async () => {
  fs.writeFileSync("sample-budget.xlsx", await generateBudgetXlsx(data));
  console.log("Wrote sample-budget.xlsx");
})();
