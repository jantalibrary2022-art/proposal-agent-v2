// The applicant's answers to the four per-proposal questions. In production these
// come from the question flow; here they are captured for a reproducible test.
const answers = {
  project_idea: "Natural farming principles",
  geography: {
    state: "Chhattisgarh",
    district: "Kanker",
    block: "Durgakondal",
    note: "One of the most remote locations in Chhattisgarh, mostly forest, with a direct connection to the Forest Rights Act (FRA)."
  },
  target_group: { group: "PVTG (Particularly Vulnerable Tribal Group) households", scale: "1,000 households" },
  budget: "INR 99,00,000",
  duration: "3 years"
};
module.exports = { answers };
