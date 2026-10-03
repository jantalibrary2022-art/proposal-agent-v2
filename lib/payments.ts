// Records a paid purchase for a proposal, idempotently, with a sequential
// invoice number (PRS/<year>/0001) from the next_invoice_no() SQL function.
import { newInvoiceNo } from "./razorpay";

async function nextInvoiceNo(admin: any): Promise<string> {
  try {
    const { data, error } = await admin.rpc("next_invoice_no");
    if (!error && typeof data === "string" && data) return data;
  } catch {}
  return newInvoiceNo(); // fallback if the SQL function is not installed yet
}

export async function recordPaidPurchase(
  admin: any,
  p: { userId: string; proposalId: string; paymentId: string; amountPaise: number }
): Promise<void> {
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .or(`payment_ref.eq.${p.paymentId},and(proposal_id.eq.${p.proposalId},status.eq.paid)`)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  await admin.from("purchases").insert({
    user_id: p.userId,
    proposal_id: p.proposalId,
    description: "Prastav — Project proposal",
    amount: p.amountPaise / 100,
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
  p: { userId: string; paymentId: string; amountPaise: number }
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
  };
  const { error } = await admin.from("purchases").insert(row);
  // If sql/draft-rules.sql has not been run, the prepaid column is missing:
  // never lose a payment, store it without the flag.
  if (error && /prepaid/i.test(error.message || "")) {
    delete row.prepaid;
    await admin.from("purchases").insert(row);
  }
}
