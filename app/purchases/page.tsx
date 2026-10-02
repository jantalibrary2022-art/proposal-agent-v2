import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export const runtime = "nodejs";

function money(n: any, currency = "INR") {
  const sym = currency === "INR" ? "₹" : "";
  return sym + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dateStr(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("purchases").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const rows = data || [];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">Back to dashboard</Link>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-12 flex justify-center">
        <div className="w-full max-w-[720px]">
          <h1 className="font-extrabold text-[clamp(26px,5vw,34px)] tracking-tight leading-[1.1] mb-2">Purchases</h1>
          <p className="text-[16px] text-muted leading-relaxed mb-8">Your proposals and payments, with an invoice for each.</p>

          {rows.length === 0 ? (
            <div className="bg-card border border-line rounded-lg p-10 text-center">
              <p className="text-[15px] text-muted">No purchases yet. When you pay for a proposal, it will appear here with its invoice.</p>
            </div>
          ) : (
            <div className="bg-card border border-line rounded-lg divide-y divide-[#EFEEE7]">
              {rows.map((p: any) => (
                <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="text-[15px] font-semibold truncate">{p.description || "Proposal"}</div>
                    <div className="text-[13px] text-muted mt-0.5">{dateStr(p.created_at)} · {p.invoice_no || "Invoice"} · <span className="capitalize">{p.status || "paid"}</span></div>
                  </div>
                  <div className="text-[15px] font-semibold tabular-nums shrink-0">{money(p.amount, p.currency)}</div>
                  <Link href={"/purchases/" + p.id} className="shrink-0 text-[13px] tracking-wide font-semibold">INVOICE →</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
