const { chromium } = require("playwright");
const { renderProposalHTML } = require("./lib/proposal-template");

const sample = {
  title: "Strengthening Women's Livelihoods and Household Nutrition in Arki Block",
  subtitle: "An integrated economic empowerment and maternal-child nutrition initiative for Scheduled Tribe women",
  geography: "Arki Block (all 16 Gram Panchayats), Khunti District, Jharkhand",
  duration: "24 months",
  budget: "INR 60,00,000",
  submittedTo: "Grameen Vikas Foundation",
  submittedBy: "Prakash Kumar, Independent Development-Sector Consultant",
  orgName: "EcoKheti Foundation",
  orgAddress: "Ranchi, Jharkhand, India",
  orgContact: "contact@example.org · +91 00000 00000",
  closing: "We look forward to partnering with you to build lasting change for the women and families of Arki block.",
  problem: "Scheduled Tribe women of reproductive age in the landless and near-landless households of Arki block face two intertwined and mutually reinforcing challenges: economic vulnerability and a heavy burden of maternal and child undernutrition. Together these conditions hold households within a cycle of poverty and poor health that neither can break alone.\n\nOn the economic side, these women depend on rain-fed agriculture and the seasonal collection of forest produce, own little or no land, and have no stable off-farm income. Their earnings are consequently low and seasonally unstable, and their control over household income is limited. On the health and nutrition side, a majority of pregnant women are anaemic, and child stunting in the area ranks among the highest in the country. The two strands feed one another: poor income drives poor diets, while ill-health erodes the productivity and earning capacity on which better diets depend.",
  objective: "To strengthen the economic independence of 800 Scheduled Tribe women in Arki block by enabling stable and diversified incomes over which they exercise genuine control, while improving the maternal and child nutrition of their households through an integrated, mutually reinforcing set of interventions delivered over 24 months.",
  strategy: "The project adopts an integrated, community-platform approach anchored in women's Self-Help Groups, which serve as the single delivery structure for both the economic and the health strands. Work is sequenced across three phases: mobilisation and group formation in the opening months, intensive capacity-building and asset support through the middle period, and consolidation, market linkage and transition toward self-sustaining institutions in the final phase.\n\nThroughout, the project converges deliberately with government systems, the National Rural Livelihoods Mission, MGNREGA, the Integrated Child Development Services and the National Health Mission, so that its work reinforces, rather than duplicates, the entitlements and services already available to the community.",
  activities: "Activities are grouped by output and every activity traces to a defined result. Under the livelihoods outputs, the project mobilises women across all 16 Gram Panchayats, forms and strengthens Self-Help Groups, delivers skills training in selected trades, provides productive assets and input kits, and establishes market and financial-service linkages. Under the health and nutrition outputs, it trains community nutrition counsellors, conducts group and household counselling on maternal and child nutrition, establishes household kitchen gardens, and facilitates convergence with frontline health and nutrition services.",
  sustainability: "Sustainability rests on four foundations. Institutionally, the Self-Help Groups are federated into Village Organisations that endure beyond the project team's presence. Financially, women retain access to capital through the savings, credit and bank linkages established during the project. Socially, the changed practices and strengthened capacities remain within the community. And through convergence, the work is handed to established public programmes designed to continue it.",
  matrix: { rows: [
    { level:"Impact", statement:"Reduced intergenerational poverty and malnutrition among ST households in Arki block", indicator:"Prevalence of stunting among under-5 children in beneficiary households", baseline:"39.6% (NFHS-5, Jharkhand)", target:"Trending below block baseline", mov:"Endline anthropometric survey; ICDS growth-monitoring records" },
    { level:"Outcome 1", statement:"800 ST women have increased and diversified household incomes", indicator:"Average annual income; number of income sources per household", baseline:"To be established", target:"≥50% increase; ≥2 income sources", mov:"Baseline and endline income survey; SHG records" },
    { level:"Output 1.1", statement:"Women trained in sustainable livelihood skills", indicator:"Women completing training with ≥80% attendance", baseline:"0", target:"800 women", mov:"Training attendance registers" },
  ]},
  budget_table: { lines: [
    { item:"Project Coordinator", unit:"month", unit_cost:"35,000", quantity:"24", total:"8,40,000", source:"NRLM project-staff norms" },
    { item:"Community Mobilisers (5)", unit:"month", unit_cost:"15,000", quantity:"24", total:"18,00,000", source:"Prevailing NGO field-staff rates" },
    { item:"Livelihood skills training", unit:"batch of 40", unit_cost:"30,000", quantity:"20", total:"6,00,000", source:"NRLM training cost norms" },
  ]},
};

const variants = [
  { file:"sample-A-institutional-full.pdf", opts:{ template:"institutional", includeToc:true, includeBack:true } },
  { file:"sample-B-contemporary-full.pdf",  opts:{ template:"contemporary",  includeToc:true, includeBack:true } },
  { file:"sample-C-institutional-notoc-noback.pdf", opts:{ template:"institutional", includeToc:false, includeBack:false } },
];

(async () => {
  const browser = await chromium.launch();
  for (const v of variants) {
    const html = renderProposalHTML(sample, v.opts);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({ path: v.file, format: "A4", printBackground: true });
    await page.close();
    console.log("Wrote", v.file);
  }
  await browser.close();
  console.log("Done — three sample PDFs.");
})();
