import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { getDict, type Locale } from "../../../lib/i18n";
import PrintButton from "../../_components/PrintButton";

export const runtime = "nodejs";

function money(n: any, currency = "INR") {
  const sym = currency === "INR" ? "₹" : "";
  return sym + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dateStr(iso: string, locale: Locale) {
  try { return new Date(iso).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; }
}
function n2wIndian(num: number): string {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
  const three = (x: number) => { const h = Math.floor(x / 100); const r = x % 100; return (h ? a[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : ""); };
  let res = "";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  if (crore) res += three(crore) + " Crore ";
  if (lakh) res += three(lakh) + " Lakh ";
  if (thousand) res += three(thousand) + " Thousand ";
  if (num) res += three(num);
  return res.trim();
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { locale, t } = await getDict();
  const inv = t.invoice;

  const { data: p } = await supabase.from("purchases").select("*").eq("id", id).eq("user_id", user.id).single();
  if (!p) notFound();

  let org: any = null;
  const r = await supabase.from("org_profiles").select("name,data").eq("user_id", user.id).eq("is_default", true).single();
  org = r.data || null;

  const sellerName = process.env.SELLER_NAME || "Prakash Kumar";
  const sellerAddress = (process.env.SELLER_ADDRESS || "").split("|").map((s) => s.trim()).filter(Boolean);
  const sellerPan = process.env.SELLER_PAN || "";
  const sellerEmail = process.env.SELLER_EMAIL || "";

  const buyerName = org?.name || (user.user_metadata?.full_name as string) || (user.email ? user.email.split("@")[0] : inv.customer);
  const buyerAddress: string[] = [];
  const oc = (org?.data?.contact) || {};
  if (oc.address) buyerAddress.push(String(oc.address));
  const buyerEmail = user.email || "";

  const invoiceNo = p.invoice_no || ("PRS/" + new Date(p.created_at).getFullYear() + "/" + String(p.id).slice(0, 6).toUpperCase());
  const amount = Number(p.amount || 0);
  // Discounted payments carry the list price; show it with a discount line.
  const listAmount = Number(p.list_amount || 0);
  const discounted = listAmount > amount + 0.001;
  const lineAmount = discounted ? listAmount : amount;
  const discountLabel = p.offer_code === "founding" ? t.offer.invoiceDiscount : t.offer.discount;
  const currency = p.currency || "INR";
  const statusText = p.status === "paid" || !p.status ? inv.paid : p.status;

  const cell = "border border-[#D8D7D1] px-3 py-2 text-[13px] align-top";

  return (
    <div className="min-h-screen bg-[#EDEDEA] text-ink">
      <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-6 flex items-center justify-between print:hidden">
        <Link href="/purchases" className="text-[14px] text-muted">{inv.back}</Link>
        <PrintButton className="bg-ink text-paper text-[14px] font-semibold px-5 py-2.5 rounded-[4px]" label={inv.print} />
      </div>

      <div className="max-w-[820px] mx-auto bg-white border border-[#D8D7D1] print:border-0 px-8 sm:px-12 py-10 mb-10 print:mb-0">
        {/* Seller + title */}
        <div className="flex items-start justify-between gap-6 border-b border-[#D8D7D1] pb-5">
          <div>
            <div className="text-[22px] font-extrabold tracking-[-0.01em]">{sellerName}</div>
            {sellerAddress.map((l, i) => <div key={i} className="text-[12.5px] text-[#3A3A31] leading-snug">{l}</div>)}
            {sellerPan && <div className="text-[12.5px] text-[#3A3A31] mt-1">PAN — {sellerPan}</div>}
            {sellerEmail && <div className="text-[12.5px] text-[#3A3A31]">{sellerEmail}</div>}
          </div>
          <div className="text-right">
            <div className="text-[34px] font-extrabold tracking-tight leading-none">{inv.title}</div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="w-5 h-5 rounded bg-ink flex items-center justify-center text-paper font-extrabold text-[11px]">प्र</span>
              <span className="text-[13px] font-semibold">Prastav</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 py-4 border-b border-[#D8D7D1] text-[13px]">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2"><span className="w-[120px] text-muted">{inv.invoiceNo}</span><span className="font-semibold">{invoiceNo}</span></div>
            <div className="flex gap-2"><span className="w-[120px] text-muted">{inv.invoiceDate}</span><span>{dateStr(p.created_at, locale)}</span></div>
            <div className="flex gap-2"><span className="w-[120px] text-muted">{inv.status}</span><span>{statusText}</span></div>
          </div>
          <div className="flex flex-col gap-1 mt-2 sm:mt-0">
            {p.payment_ref && <div className="flex gap-2"><span className="w-[120px] text-muted">{inv.paymentRef}</span><span className="break-all">{p.payment_ref}</span></div>}
            {p.gateway && <div className="flex gap-2"><span className="w-[120px] text-muted">{inv.paidVia}</span><span className="capitalize">{p.gateway}</span></div>}
            <div className="flex gap-2"><span className="w-[120px] text-muted">{inv.gst}</span><span>{inv.gstNA}</span></div>
          </div>
        </div>

        {/* Bill to */}
        <div className="py-4 border-b border-[#D8D7D1]">
          <div className="text-[11px] tracking-[0.1em] text-muted mb-1.5">{inv.billTo}</div>
          <div className="text-[15px] font-bold">{buyerName}</div>
          {buyerAddress.map((l, i) => <div key={i} className="text-[13px] text-[#3A3A31] leading-snug">{l}</div>)}
          {buyerEmail && <div className="text-[13px] text-[#3A3A31]">{buyerEmail}</div>}
        </div>

        {/* Lines */}
        <table className="w-full border-collapse mt-5">
          <thead>
            <tr className="bg-[#F5F4EF]">
              <th className={cell + " w-[40px] text-left font-semibold"}>{inv.colNum}</th>
              <th className={cell + " text-left font-semibold"}>{inv.colItem}</th>
              <th className={cell + " w-[140px] text-right font-semibold"}>{inv.colAmount}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cell}>1</td>
              <td className={cell}>
                <div className="font-semibold text-[13.5px]">{p.description || inv.lineDesc}</div>
                <div className="text-[12px] text-muted mt-0.5">{inv.lineSub}</div>
              </td>
              <td className={cell + " text-right tabular-nums"}>{money(lineAmount, currency)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col sm:flex-row justify-between gap-5 mt-5">
          <div className="text-[12.5px] max-w-[360px]">
            <div className="text-muted">{inv.totalWords}</div>
            <div className="font-semibold">{currency === "INR" ? inv.rupees : ""}{n2wIndian(amount)}{inv.only}</div>
            <div className="mt-5 text-[11.5px] text-muted leading-relaxed">
              <div className="font-semibold text-[#3A3A31]">{inv.declarationLabel}</div>
              {inv.declaration}
            </div>
            {sellerPan && <div className="mt-3 text-[11.5px] text-muted">{inv.pan}{sellerPan}</div>}
          </div>
          <div className="w-full sm:w-[260px] shrink-0">
            <div className="flex justify-between py-2 border-t border-[#D8D7D1] text-[13px]"><span className="text-muted">{inv.subtotal}</span><span className="tabular-nums">{money(lineAmount, currency)}</span></div>
            {discounted && <div className="flex justify-between py-2 border-t border-[#D8D7D1] text-[13px]"><span className="text-muted">{discountLabel}</span><span className="tabular-nums">− {money(listAmount - amount, currency)}</span></div>}
            <div className="flex justify-between py-2 border-t border-[#D8D7D1] text-[15px] font-bold"><span>{inv.total}</span><span className="tabular-nums">{money(amount, currency)}</span></div>
          </div>
        </div>

        <div className="mt-10 text-right text-[13px] font-semibold">{locale === "hi" ? `${sellerName} ${inv.forSeller}` : `${inv.forSeller}${sellerName}`}</div>
        <div className="mt-3 text-right text-[11.5px] text-muted">{inv.computerGenerated}</div>
      </div>
    </div>
  );
}
