const { chromium } = require("playwright");
const { composeProposal } = require("./lib/compose");
const { renderProposalHTML } = require("./lib/proposal-template");
const { substance, buildDocData } = require("./sample-substance");

(async () => {
  console.log("Composing on Opus… (this takes ~30-60s)");
  const c = await composeProposal(substance, { lang:"English" });
  if(c._missing && c._missing.length){
    console.log("WARNING: missing sections: "+c._missing.join(", ")+" (stop="+c._stop+"); raw saved to composed-raw.txt");
    require("fs").writeFileSync("composed-raw.txt", c._raw);
    return;
  }
  const docData = buildDocData(substance, c);
  const html = renderProposalHTML(docData, { template:"institutional", font:"serif-classic", includeToc:true, includeBack:true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:"networkidle" });
  await page.pdf({ path:"COMPOSED-proposal.pdf", format:"A4", printBackground:true });
  await browser.close();
  require("fs").writeFileSync("composed-content.json", JSON.stringify(c, null, 2));
  console.log("Wrote COMPOSED-proposal.pdf and composed-content.json");
})();
