// Sample OPEN-mode inputs for reproducible testing.
// 'answers' = an applicant who HAS an idea (direct path); budget and donor are left
// blank deliberately, to exercise estimate-and-flag and donor-agnostic handling.
// 'hints' = an applicant who wants help choosing a project (ideate path).
const answers = {
  has_idea: true,
  project_about: "Improve maternal and child nutrition in tribal SHG households by combining home kitchen gardens, community nutrition counselling, and convergence with ICDS and health services",
  geography: { state: "Jharkhand", district: "Khunti", block: "Murhu" },
  target_group: { group: "Pregnant and lactating women and children under five in SHG households", scale: "about 1,200 women across 20 villages" },
  duration: "2 years",
  budget: null,
  donor: null,
  must_include: "Work through existing SHGs and converge with ICDS and Anganwadi services rather than build parallel delivery"
};
const hints = {
  has_idea: false,
  interests: "Women's livelihoods or nutrition, open on the exact theme",
  geography_pref: "Jharkhand, ideally Khunti or Gumla where we have worked",
  budget_band: null,
  notes: "A project that builds on our SHG and nutrition strengths and could attract CSR or government funding"
};
module.exports = { answers, hints };
