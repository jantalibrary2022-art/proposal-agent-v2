// Records a paid purchase for a proposal, idempotently, with a sequential
// invoice number (PRS/<year>/0001) from the next_invoice_no() SQL function.
import { newInvoiceNo, pricePaise } from "./razorpay";

async function nextInvoiceNo(admin: any): Promise<string> {
  try {
    const { data, error } = await admin.rpc("next_invoice_no");
    if (!error && typeof data === "string" && data) return data;
  } catch {}
  return newInvoiceNo(); // fallback if the SQL function is not installed yet
}

// Insert a purchase row; if the offers SQL has not been run (columns missing),
// retry without the offer fields so a payment is never lost.
async function insertPurchase(admin: any, row: any): Promise<void> {
  // Remove only a column the database says is missing (e.g. an SQL script not
  // yet run), never the others, so a payment is always stored with as much
  // detail as the schema allows.
  const r = { ...row };
  for (let i = 0; i < 4; i++) {
    const { error } = await admin.from("purchases").insert(r);
    if (!error) return;
    const m = /'([a-z_]+)' column/i.exec(error.message || "");
    if (!m || !(m[1] in r)) return; // some other error (e.g. duplicate payment): stop
    delete r[m[1]];
  }
}

export async function recordPaidPurchase(
  admin: any,
  p: { userId: string; proposalId: string; paymentId: string; amountPaise: number; offerCode?: string }
): Promise<void> {
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .or(`payment_ref.eq.${p.paymentId},and(proposal_id.eq.${p.proposalId},status.eq.paid)`)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  await insertPurchase(admin, {
    user_id: p.userId,
    proposal_id: p.proposalId,
    description: "Prastav — Project proposal",
    amount: p.amountPaise / 100,
    list_amount: pricePaise() / 100,
    offer_code: p.offerCode || null,
    currency: "INR",
    status: "paid",
    invoice_no: await nextInvoiceNo(admin),
    payment_ref: p.paymentId,
    gateway: "razorpay",
  });
}

// Records a payment made BEFORE generation: a paid, prepaid purchase with no
// proposal yet (a credit). The next generation attaches it. Idempotent per payment.
export async function recordPrepaidCredit(
  admin: any,
  p: { userId: string; paymentId: string; amountPaise: number; offerCode?: string }
): Promise<void> {
  const { data: existing } = await admin.from("purchases").select("id").eq("payment_ref", p.paymentId).limit(1).maybeSingle();
  if (existing) return;
  const row: any = {
    user_id: p.userId,
    proposal_id: null,
    prepaid: true,
    description: "Prastav — Project proposal (paid in advance)",
    amount: p.amountPaise / 100,
    currency: "INR",
    status: "paid",
    invoice_no: await nextInvoiceNo(admin),
    payment_ref: p.paymentId,
    gateway: "razorpay",
    list_amount: pricePaise() / 100,
    offer_code: p.offerCode || null,
  };
  await insertPurchase(admin, row);
}
