// lib/apply-edits.js
// Apply a user's review-stage edits to a draft before rendering:
//  - narrative text edits (title, subtitle, and each section)
//  - confirmed budget rates (recomputes that line's total, matching the engine's formatting)
// Returns updated { substance, composed, meta }. Pure data, no AI calls.

function parseAmt(s) { const n = Number(String(s == null ? "" : s).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }
// Leading number only, so a descriptive quantity like "480 (60 teachers x 4 days
// x 2 years)" yields 480, not every digit concatenated. 0 when there is none.
function qtyNum(s) { const m = String(s == null ? "" : s).match(/^\s*₹?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/); if (!m) return 0; const n = Number(m[1].replace(/,/g, "")); return isNaN(n) ? 0 : n; }
function fmtIN(n) {
  let s = Math.round(n).toString(); const neg = s.startsWith("-"); if (neg) s = s.slice(1);
  const lastThree = s.length > 3 ? s.slice(-3) : s;
  let rest = s.length > 3 ? s.slice(0, s.length - 3) : "";
  if (rest !== "") { rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ","); s = rest + "," + lastThree; }
  else { s = lastThree; }
  return (neg ? "-" : "") + s;
}

const NARRATIVE = ["title", "subtitle", "problem", "objective", "strategy", "results_narrative", "activities", "sustainability"];

function applyEdits(draft, edits) {
  const substance = JSON.parse(JSON.stringify(draft.substance || {}));
  const composed = JSON.parse(JSON.stringify(draft.composed || {}));
  const e = edits || {};

  if (e.composed) {
    NARRATIVE.forEach((f) => { if (typeof e.composed[f] === "string" && e.composed[f].trim() !== "") composed[f] = e.composed[f]; });
  }

  const confirmed = e.rates || {};
  const bt = substance.budget_table || {};
  const cats = bt.categories || (bt.lines ? [{ name: "", lines: bt.lines }] : []);
  const confirmedItems = new Set();
  cats.forEach((c) => {
    (c.lines || []).forEach((line) => {
      const key = String(line.item || "");
      const given = confirmed[key];
      if (given != null && String(given).trim() !== "") {
        const rate = parseAmt(given);
        if (rate > 0) {
          const qty = qtyNum(line.quantity);
          line.unit_cost = fmtIN(rate);
          line.total = qty > 0 ? fmtIN(rate * qty) : fmtIN(rate);
          line.rate_basis = "confirmed";
          line.source = "Confirmed by applicant";
          confirmedItems.add(key);
        }
      }
    });
  });
  if (Array.isArray(substance.rates_to_confirm)) {
    substance.rates_to_confirm = substance.rates_to_confirm.filter((x) => !confirmedItems.has(String(x.item || "")));
  }

  const meta = Object.assign({}, draft.meta || {});
  meta.title = composed.title || meta.title;
  meta.subtitle = composed.subtitle || meta.subtitle;
  meta.rates_to_confirm = substance.rates_to_confirm || [];

  return { substance, composed, meta };
}

module.exports = { applyEdits };
