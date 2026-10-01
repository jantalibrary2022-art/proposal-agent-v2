// lib/dev-fixture.js
// A realistic, self-contained OPEN-mode draft (substance + composed) matching the
// CURRENT engine schema. Used only by the dev-seed route to exercise the review,
// edit, confirm-rates and finalise flow WITHOUT any paid AI call.

const substance = {
  lang: "English",
  org: { name: "EcoKheti Foundation", experience: "Community-based livelihoods and nutrition in tribal Jharkhand and Chhattisgarh", values: "Community ownership, women's agency, convergence with public systems", contact: { address: "Ranchi, Jharkhand", email: "contact@ecokheti.org" } },
  theme: "Maternal and child nutrition through SHG kitchen gardens and ICDS convergence",
  geography: { state: "Jharkhand", district: "Khunti", block: "Murhu", coverage: "20 villages" },
  target: "1,200 women in SHG households and their children under five across 20 villages",
  duration: "24 months",
  budget: "Rs 1,20,00,000",
  donor: "Donor-agnostic",
  problem_facts: [
    "Child stunting in the district remains above the state average [S1].",
    "Dietary diversity among young children is low, with few households consuming pulses or green vegetables daily [S1].",
    "ICDS and health services exist but uptake is weak, and SHGs are not yet used as a delivery channel [S2]."
  ],
  objective: "Improve the nutritional status of children under five in 1,200 SHG households across Murhu block over 24 months, by combining home kitchen gardens, community nutrition counselling and stronger convergence with ICDS and health services.",
  results: { impact: "Reduced undernutrition among children under five in the target villages", outcomes: ["Improved dietary diversity in SHG households", "Higher uptake of ICDS and health entitlements"], outputs: ["1,200 kitchen gardens established and productive", "A trained community nutrition resource person active in each cluster"] },
  strategy_facts: [
    "Work through existing SHGs rather than build parallel delivery.",
    "Converge with ICDS, Anganwadi and the health system so gains are institutionally anchored.",
    "Treat scheme entitlements as convergence, not project cost."
  ],
  risks: [
    { risk: "Seasonal migration reduces household participation", likelihood: "Medium", impact: "Medium", mitigation: "Schedule core activities around the agricultural and migration calendar; use SHG peer follow-up." },
    { risk: "Weak frontline worker coordination slows convergence", likelihood: "Medium", impact: "High", mitigation: "Formal MoU with the ICDS project office and joint monthly review at block level." }
  ],
  activities_facts: [
    "Establish and support 1,200 home kitchen gardens with seed kits and training.",
    "Run monthly community nutrition counselling sessions through SHGs.",
    "Facilitate convergence camps linking households to ICDS and health entitlements."
  ],
  matrix: { rows: [
    { level: "Impact", statement: "Reduced undernutrition among children under five", indicator: "% children under five stunted", baseline: "To be established by baseline survey", target: "Reduced by 8 percentage points", mov: "Endline anthropometric survey" },
    { level: "Outcome", statement: "Improved dietary diversity in SHG households", indicator: "% households meeting minimum dietary diversity", baseline: "To be established by baseline survey", target: "60% of target households", mov: "Household diet survey" },
    { level: "Output", statement: "Kitchen gardens established", indicator: "No. of productive kitchen gardens", baseline: "0", target: "1,200", mov: "Field verification records" }
  ] },
  budget_table: { categories: [
    { name: "Personnel & Salaries", lines: [
      { item: "Community nutrition resource person honorarium", unit: "person-month", unit_cost: "3,500", quantity: "48", total: "1,68,000", rate_basis: "estimate", contributes: "Outcome 1", source: "Estimated, confirm against JSLPS Poshan Sakhi rate" },
      { item: "Project coordinator", unit: "month", unit_cost: "35,000", quantity: "24", total: "8,40,000", rate_basis: "sourced", contributes: "Management", source: "NRLM contractual staff norm [S2]" }
    ] },
    { name: "Programme / Activity Costs", lines: [
      { item: "Kitchen garden seed kit", unit: "household", unit_cost: "350", quantity: "1200", total: "4,20,000", rate_basis: "estimate", contributes: "Output 1", source: "Estimated, confirm with KVK Khunti" }
    ] }
  ] },
  budget_grand_total: "14,28,000",
  rates_to_confirm: [
    { item: "Community nutrition resource person honorarium", estimated_rate: "Rs 3,500 / month", prompt: "Confirm against the JSLPS Poshan Sakhi honorarium, or supply your own figure." },
    { item: "Kitchen garden seed kit", estimated_rate: "Rs 350 / household", prompt: "Confirm with KVK Khunti or a local quote." }
  ],
  flags: [],
  timeline: { units: ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8"], rows: [
    { activity: "Mobilisation & baseline", active: [1,2] },
    { activity: "Kitchen gardens & counselling", active: [3,4,5,6] },
    { activity: "Consolidation & transition", active: [7,8] }
  ] },
  sources: [
    { ref: "S1", title: "NFHS-5 district factsheet, Khunti", url: "https://example.gov.in/nfhs5-khunti" },
    { ref: "S2", title: "District Census Handbook, Khunti", url: "https://example.gov.in/census-khunti" }
  ]
};

const composed = {
  title: "Poshan Saathi: SHG-led Kitchen Gardens, Nutrition Counselling and ICDS Convergence",
  subtitle: "A 24-month initiative in Murhu block, Khunti, Jharkhand",
  problem: "Child undernutrition in Murhu block persists despite the presence of public services. Stunting among children under five remains above the state average [S1], and dietary diversity in SHG households is low, with few young children eating pulses or green vegetables on a daily basis [S1].\n\nThe causes are not only clinical. ICDS and health services exist but are weakly used, and the self-help groups that already organise women economically have not yet been used as a channel for nutrition [S2]. The result is a gap that neither the health system nor household income alone has closed.",
  objective: "The project will improve the nutritional status of children under five in 1,200 SHG households across 20 villages of Murhu block over 24 months, by combining home kitchen gardens, community nutrition counselling, and stronger convergence with ICDS and health services.",
  strategy: "The approach works through the structures that already exist. Rather than build a parallel delivery system, the project uses established SHGs as the organising unit, and converges deliberately with ICDS, Anganwadi and the health system so that gains are institutionally anchored and outlast the project. Scheme entitlements are treated as convergence, not as project cost.",
  results_narrative: "The results chain runs from gardens and counselling to measurable change. At output level, 1,200 kitchen gardens become productive and a trained nutrition resource person is active in each cluster. These feed two outcomes, improved dietary diversity in the household and higher uptake of ICDS and health entitlements, which together drive the intended impact, a measurable reduction in undernutrition among children under five.",
  activities: "Three activity clusters build the results. First, the project establishes and supports 1,200 home kitchen gardens with seed kits and practical training, so households have a year-round source of diverse food. Second, it runs monthly community nutrition counselling through the SHGs, turning the group meeting into a place where feeding practices change. Third, it facilitates convergence camps that link households to the ICDS and health entitlements they are owed.",
  sustainability: "Because the work is delivered through SHGs and anchored in public systems, the gains do not depend on the project continuing. The kitchen gardens are owned by the households, the resource persons are drawn from the community, and the convergence with ICDS and health services is formalised, so the delivery continues after the project closes."
};

module.exports = { substance, composed };
