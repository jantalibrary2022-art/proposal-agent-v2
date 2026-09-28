// Shared sample proposal. In production this object is built at runtime by
// Phase 1 from the user's answers, RFP and any uploaded draft. Here it is a
// fixed example so all three output engines render the same proposal.
const substance = {
  lang:"English",
  org:{ name:"EcoKheti Foundation", experience:"community-based livelihoods and nutrition programming in tribal Jharkhand", values:"community ownership, women's agency, convergence with public systems" },
  theme:"Women's income augmentation integrated with maternal and child health & nutrition",
  geography:{ state:"Jharkhand", district:"Khunti", block:"Arki", coverage:"all 16 Gram Panchayats" },
  target:"800 Scheduled Tribe (predominantly Munda) women of reproductive age from landless and near-landless households",
  duration:"24 months",
  budget:"INR 60,00,000",
  donor:"Grameen Vikas Foundation",
  problem_facts:[
    "Arki is the most underserved block in Khunti; female literacy 41.02% (Census 2011)",
    "~80% of Arki's population is Scheduled Tribe, predominantly Munda",
    "Livelihoods depend on rain-fed agriculture and seasonal forest produce; little/no land; no stable off-farm income",
    "60% of SC/ST in Jharkhand are below the poverty line (well above the state average of ~46%)",
    "65% of women in Jharkhand are anaemic (NFHS-5); 47% of tribal women are undernourished vs 29% of non-tribal women",
    "40% of children in Jharkhand are stunted (NFHS-5)",
    "Economic vulnerability and health/nutrition deficits reinforce each other in a cycle"
  ],
  objective:"Strengthen the economic independence of 800 ST women in Arki block through stable, diversified incomes under their own control, while improving maternal and child nutrition of their households, over 24 months",
  results:{
    impact:"Reduced intergenerational poverty and malnutrition among ST households in Arki block",
    outcomes:[
      "800 ST women have increased and diversified household incomes under their own control",
      "800 ST women and their families adopt improved maternal and child health, nutrition and care practices"
    ],
    outputs:[
      "800 women organised into ~53 functioning SHGs with savings and credit",
      "800 women equipped with diversified livelihood skills and productive assets",
      "800 women linked to markets, government schemes and financial services",
      "800 women and 400 family members reached with maternal and child nutrition and health knowledge",
      "500 household kitchen gardens established and maintained"
    ]
  },
  strategy_facts:[
    "SHG-anchored community platform as the single delivery structure for both economic and health strands",
    "Three phases over 24 months: mobilisation & group formation; capacity-building & asset support; consolidation, market linkage & transition",
    "Convergence with NRLM/JSLPS, MGNREGA, PDS, ICDS, National Health Mission",
    "Integration logic: kitchen gardens and livestock generate both income and household nutrition; SHG meetings host both livelihood and health learning"
  ],
  activities_facts:[
    "Community mobilisation and SHG formation/strengthening across 16 GPs",
    "Livelihood skills training (agriculture, poultry, goatery, NTFP value-addition, micro-enterprise)",
    "Provision of productive assets and input kits",
    "SHG-bank linkage, scheme enrolment (NRLM, MGNREGA, PMMVY), market linkage",
    "Nutrition counselling (IFA, IYCF, ANC, dietary diversity) integrated into SHG meetings and household visits",
    "Kitchen garden establishment with seeds, saplings and technical support",
    "Convergence facilitation with ASHA, AWW, VHSND"
  ],
  matrix:{ rows:[
    { level:"Impact", statement:"Reduced poverty and malnutrition among ST households in Arki", indicator:"Under-5 stunting prevalence in beneficiary HHs", baseline:"39.6% (NFHS-5 Jharkhand)", target:"Trending below block baseline", mov:"Endline anthropometric survey; ICDS records" },
    { level:"Outcome 1", statement:"800 women have increased, diversified incomes", indicator:"Average annual income; number of income sources", baseline:"To be established by baseline survey", target:"≥50% income increase; ≥2 sources", mov:"Baseline/endline income survey; SHG records" },
    { level:"Outcome 2", statement:"Improved maternal & child nutrition practices", indicator:"% women with minimum dietary diversity", baseline:"To be established", target:"≥60% of women", mov:"Endline KAP survey; ICDS records" },
    { level:"Output 1", statement:"Functioning SHGs with savings & credit", indicator:"Number of functional SHGs", baseline:"0", target:"~53 SHGs", mov:"SHG registers; bank passbooks" },
    { level:"Output 2", statement:"Women equipped with skills & productive assets", indicator:"Women trained; assets distributed", baseline:"0", target:"800 trained; assets to 250 HHs", mov:"Training records; asset handover logs" },
    { level:"Output 3", statement:"Women linked to markets, schemes & finance", indicator:"SHGs bank-linked; women enrolled in schemes", baseline:"0", target:"~53 linked; 800 enrolled", mov:"Bank records; scheme enrolment records" },
    { level:"Output 4", statement:"Women & families reached with nutrition/health knowledge", indicator:"Women & family members counselled", baseline:"0", target:"800 women; 400 family members", mov:"Counselling registers; KAP survey" },
    { level:"Output 5", statement:"Household kitchen gardens", indicator:"Functional gardens at endline", baseline:"0", target:"500 gardens", mov:"Field verification; harvest logs" }
  ]},
  budget_table:{ categories:[
    { name:"Personnel & Salaries", lines:[
      { item:"Project Coordinator", unit:"month", unit_cost:"35,000", quantity:"24", total:"8,40,000", contributes:"Management of all outputs", source:"NRLM project-staff norms" },
      { item:"Community Mobilisers (5)", unit:"month", unit_cost:"15,000", quantity:"120", total:"18,00,000", contributes:"Output 1 — SHG formation", source:"Prevailing NGO field-staff rates, Jharkhand" }
    ]},
    { name:"Capital Expenditure", lines:[
      { item:"Project two-wheeler for field mobility (illustrative)", unit:"unit", unit_cost:"[confirm]", quantity:"2", total:"[to confirm]", contributes:"Field delivery across 16 GPs", source:"Illustrative — confirm or remove" }
    ]},
    { name:"Programme / Activity Costs", lines:[
      { item:"Livelihood skills training", unit:"batch of 40", unit_cost:"30,000", quantity:"20", total:"6,00,000", contributes:"Output 2 — skills", source:"NRLM training cost norms" },
      { item:"Goat units (2 does each)", unit:"unit", unit_cost:"12,000", quantity:"100", total:"12,00,000", contributes:"Output 2 assets → Outcome 1", source:"State livestock scheme norms" },
      { item:"Kitchen garden input kits", unit:"household", unit_cost:"1,500", quantity:"500", total:"7,50,000", contributes:"Output 5 → Outcome 2", source:"[rate — confirm locally]" }
    ]},
    { name:"Administrative / Overheads", lines:[
      { item:"Block office rent & utilities (illustrative)", unit:"month", unit_cost:"[confirm]", quantity:"24", total:"[to confirm]", contributes:"Programme operations", source:"Illustrative — confirm or remove" }
    ]}
  ]},
  timeline:{ units:["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8"], rows:[
    { activity:"Community mobilisation & SHG formation", active:[1,2,3] },
    { activity:"Livelihood skills training", active:[2,3,4,5,6] },
    { activity:"Provision of productive assets & input kits", active:[3,4,5,6] },
    { activity:"SHG-bank linkage, scheme enrolment & market linkage", active:[3,4,5,6,7,8] },
    { activity:"Nutrition counselling (SHG meetings & household visits)", active:[2,3,4,5,6,7,8] },
    { activity:"Kitchen garden establishment", active:[3,4,5] },
    { activity:"Convergence facilitation (ASHA, AWW, VHSND)", active:[2,3,4,5,6,7,8] },
    { activity:"Monitoring & documentation (baseline, midline, endline)", active:[1,4,8] }
  ]}
};

// Single source of the composed-prose -> document-data mapping, shared by all outputs.
function buildDocData(s, c){
  const g = s.geography;
  return {
    lang: s.lang,
    title: c.title || "Project Proposal",
    subtitle: c.subtitle || "",
    geography: `${g.block} Block (${g.coverage}), ${g.district} District, ${g.state}`,
    duration: s.duration,
    budget: s.budget,
    submittedTo: s.donor,
    submittedBy: "Prakash Kumar, Independent Development-Sector Consultant",
    orgName: s.org.name,
    orgAddress: "Ranchi, Jharkhand",
    orgContact: "contact@example.org",
    problem: c.problem,
    objective: c.objective,
    strategy: c.strategy,
    activities: c.activities,
    results_narrative: c.results_narrative,
    sustainability: c.sustainability,
    matrix: s.matrix,
    budget_table: s.budget_table,
    timeline: s.timeline
  };
}

module.exports = { substance, buildDocData };
