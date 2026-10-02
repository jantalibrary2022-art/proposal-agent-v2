// Renders the committed sample proposals (composed + substance from engine
// testing) into static HTML for the public, view-only /samples viewer.
// Run from the repo root: node scripts/build-samples.js
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { renderProposalHTML } = require(path.join(ROOT, "lib", "proposal-template"));

function geoLineFrom(s) {
  const g = (s && s.geography) || {};
  const b = String(g.block || "").split("(")[0].trim();
  const d = String(g.district || "").split("(")[0].trim();
  return [b && b + " Block", d && d + " District", g.state].filter(Boolean).join(", ");
}
function docDataFrom(substance, composed) {
  const s = substance, c = composed || {};
  const donorAgnostic = !s.donor || /agnostic/i.test(s.donor);
  const contact = (s.org && s.org.contact) || {};
  return {
    lang: s.lang, title: c.title || "Project Proposal", subtitle: c.subtitle || "",
    geography: geoLineFrom(s), duration: s.duration, budget: s.budget,
    submittedTo: donorAgnostic ? "" : s.donor, submittedBy: s.org && s.org.name,
    orgName: s.org && s.org.name, orgAddress: contact.address || "Ranchi, Jharkhand",
    orgContact: contact.email || "contact@example.org",
    problem: c.problem, objective: c.objective, strategy: c.strategy, activities: c.activities,
    results_narrative: c.results_narrative, sustainability: c.sustainability,
    matrix: s.matrix, sources: s.sources, budget_table: s.budget_table, risks: s.risks, timeline: s.timeline,
  };
}

const samples = [
  { slug: "open-nutrition", composed: "open-composed-content.json", substance: "open-substance.json" },
  { slug: "rfp-livelihoods", composed: "rfp-composed-content.json", substance: "substance-built.json" },
  { slug: "improved-pwd", composed: "improve-composed-content.json", substance: "rebuilt-substance.json" },
];

const outDir = path.join(ROOT, "samples-html");
fs.mkdirSync(outDir, { recursive: true });
for (const s of samples) {
  const composed = JSON.parse(fs.readFileSync(path.join(ROOT, s.composed), "utf8"));
  const substance = JSON.parse(fs.readFileSync(path.join(ROOT, s.substance), "utf8"));
  const docData = docDataFrom(substance, composed);
  const html = renderProposalHTML(docData, { template: "institutional", font: "serif-classic", includeToc: true, includeBack: true });
  fs.writeFileSync(path.join(outDir, s.slug + ".html"), html);
  console.log(s.slug, "->", html.length, "bytes |", docData.title);
}
