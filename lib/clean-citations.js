// Strips inline citation markup the web-search model sometimes wraps around quoted
// text, e.g. ... or <cite ...>...</cite>, keeping the inner
// text. Source titles and URLs are stored in separate fields, so nothing is lost.
function stripCitations(x){
  if(typeof x === "string"){
    return x
      .replace(/[<(]\s*cite\b[^>]*>/gi, "")
      .replace(/<\/\s*cite\s*>/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  if(Array.isArray(x)) return x.map(stripCitations);
  if(x && typeof x === "object"){ const o = {}; for(const k in x) o[k] = stripCitations(x[k]); return o; }
  return x;
}
module.exports = { stripCitations };
