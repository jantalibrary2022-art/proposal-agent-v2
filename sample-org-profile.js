// Sample applicant organisation profile. In production each NGO fills this ONCE
// at account setup and every proposal reuses it. The numeric facts below are
// ILLUSTRATIVE placeholders for testing, to be replaced by the org's real profile.
const orgProfile = {
  name: "EcoKheti Foundation",
  legal_status: "Section 8 non-profit company, registered in India",
  registration_year: 2016,
  states_present: ["Jharkhand", "Chhattisgarh"],
  thematic_experience: [
    { theme: "Community-based livelihoods", years: 8 },
    { theme: "Maternal and child nutrition", years: 6 },
    { theme: "Climate smart / climate-resilient livelihoods", years: 5 }
  ],
  annual_revenue: "Rs. 2.4 Crore",
  board_members: 5,
  permanent_staff: 9,
  donor_concentration: "No individual donor is among the top 3 donors",
  affiliations: "None (no political or religious affiliation)",
  past_projects: [
    { title: "SHG-led livelihoods & nutrition, tribal Jharkhand", funder: "State Rural Livelihoods Mission", funder_type: "government", location: "Khunti & Gumla, Jharkhand", scale: "1,200 women", outcomes: "≥45% income increase; dietary diversity improved in 60% of households" },
    { title: "Climate-resilient agriculture with small farmers", funder: "A CSR foundation", funder_type: "foundation", location: "Chhattisgarh", scale: "800 farmers", outcomes: "Climate-adaptive practices adopted by 70%" },
    { title: "FPO strengthening and market linkage", funder: "Public programme", funder_type: "public", location: "Jharkhand", scale: "3 FPOs, 900 members", outcomes: "Aggregated sales roughly doubled" }
  ],
  values: "Community ownership, women's agency, convergence with public systems",
  experience_summary: "Community-based livelihoods and nutrition programming in tribal Jharkhand and Chhattisgarh",
  contact: { address: "Ranchi, Jharkhand", email: "contact@example.org" }
};
module.exports = { orgProfile };
