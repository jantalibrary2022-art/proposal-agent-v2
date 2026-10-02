export type Sample = {
  slug: string;
  mode: string;
  title: string;
  subtitle: string;
  geo: string;
};

export const SAMPLES: Sample[] = [
  {
    slug: "open-nutrition",
    mode: "Open idea",
    title: "Poshan Saathi",
    subtitle: "SHG-led kitchen gardens, nutrition counselling and ICDS convergence for mothers and young children.",
    geo: "Murhu, Khunti · Jharkhand",
  },
  {
    slug: "rfp-livelihoods",
    mode: "RFP response",
    title: "Rooted Resilience",
    subtitle: "Natural farming for climate resilience and livelihood security of PVTG households, answering a donor call.",
    geo: "Durgakondal, Kanker · Chhattisgarh",
  },
  {
    slug: "improved-pwd",
    mode: "Improved draft",
    title: "Earning, Entitled and Organised",
    subtitle: "A rebuilt proposal: homestead livelihoods, entitlement convergence and a self-governing PwD Sangathan.",
    geo: "Angara, Ranchi · Jharkhand",
  },
];
