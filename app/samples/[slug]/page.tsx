import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { SAMPLES } from "../_data";
import SampleViewer from "./viewer";

export const runtime = "nodejs";

export function generateStaticParams() {
  return SAMPLES.map((s) => ({ slug: s.slug }));
}

function injectProtection(html: string): string {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='330' height='210'><text x='50%' y='50%' fill='rgba(20,20,18,0.06)' font-family='Arial,sans-serif' font-size='21' font-weight='bold' text-anchor='middle' transform='rotate(-30 165 105)'>SAMPLE · PRASTAV</text></svg>";
  const wm = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  const inject =
    "<style>" +
    "*{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important;}" +
    "img{-webkit-user-drag:none;}" +
    "@media print{html,body{display:none!important;}}" +
    "@media screen{" +
    "html{background:#56565a;}" +
    "body{background:#56565a!important;margin:0;}" +
    ".cover,.toc,body>section,.back{box-sizing:border-box;width:210mm;max-width:94vw;margin:11mm auto!important;background:#fff!important;padding:20mm 18mm!important;box-shadow:0 4px 22px rgba(0,0,0,.40);border-radius:2px;}" +
    ".cover{height:247mm!important;}" +
    "}" +
    "#prastav-wm{position:fixed;inset:0;z-index:2147483647;pointer-events:none;background-repeat:repeat;background-image:url('" + wm + "');}" +
    "</style>" +
    "<div id=\"prastav-wm\"></div>" +
    "<script>(function(){var b=function(e){e.preventDefault();e.stopPropagation();return false;};['contextmenu','copy','cut','dragstart','selectstart'].forEach(function(ev){document.addEventListener(ev,b,{capture:true});});document.addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase();if((e.ctrlKey||e.metaKey)&&['c','x','s','p','u'].indexOf(k)>-1){b(e);}},{capture:true});window.addEventListener('beforeprint',function(){try{document.documentElement.style.display='none';}catch(_){}});window.addEventListener('afterprint',function(){try{document.documentElement.style.display='';}catch(_){}});})();</script>";
  if (html.includes("</body>")) return html.replace("</body>", inject + "</body>");
  return html + inject;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = SAMPLES.find((s) => s.slug === slug);
  if (!meta) notFound();
  let html = "";
  try {
    html = fs.readFileSync(path.join(process.cwd(), "samples-html", slug + ".html"), "utf8");
  } catch {
    html = "<!doctype html><body style=\"font-family:sans-serif;padding:40px;color:#444\">This sample is temporarily unavailable.</body>";
  }
  return <SampleViewer meta={meta} html={injectProtection(html)} />;
}
