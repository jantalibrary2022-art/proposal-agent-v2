// The public address of the site for building redirects. Behind Render's proxy
// the server sees its internal address (e.g. 0.0.0.0:10000), so prefer the
// forwarded host, then NEXT_PUBLIC_SITE_URL, then the request's own origin.
export function publicOrigin(req: { headers: Headers; url: string }): string {
  const host = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  if (host && !/^(0\.0\.0\.0|127\.0\.0\.1|localhost)(:|$)/.test(host)) return `${proto}://${host}`;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const own = new URL(req.url).origin;
  if (/\/\/(0\.0\.0\.0|127\.0\.0\.1)(:|$)/.test(own)) return site || "https://prastav.app";
  return own;
}
