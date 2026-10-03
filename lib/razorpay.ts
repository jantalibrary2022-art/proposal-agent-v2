// Razorpay integration helpers, server-side only. REST API via fetch (no SDK
// dependency). All signature checks are constant-time where lengths allow.
import crypto from "crypto";

export function razorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || "";
}

// Price of one proposal, in paise. Default ₹6,999. Overridable via env.
export function pricePaise(): number {
  const v = parseInt(process.env.PRASTAV_PRICE_PAISE || "", 10);
  return Number.isFinite(v) && v > 0 ? v : 699900;
}

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: receipt.slice(0, 40), notes, payment_capture: 1 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`razorpay_order_failed:${res.status}:${t.slice(0, 200)}`);
  }
  return res.json();
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}

type RazorpayPayment = { id: string; amount: number; currency: string; status: string; order_id?: string; notes?: any };

export async function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: authHeader() } });
  if (!res.ok) throw new Error(`razorpay_fetch_failed:${res.status}`);
  return res.json();
}

async function capturePayment(paymentId: string, amount: number, currency: string): Promise<RazorpayPayment> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency }),
  });
  if (!res.ok) throw new Error(`razorpay_capture_failed:${res.status}`);
  return res.json();
}

// Make sure the money is actually collected. If the payment is only
// "authorized" (account set to manual capture), capture it now. Returns the
// captured payment, or null if it cannot be captured (failed/refunded etc.).
export async function ensureCaptured(paymentId: string): Promise<RazorpayPayment | null> {
  let p = await fetchPayment(paymentId);
  if (p.status === "authorized") {
    try { p = await capturePayment(paymentId, p.amount, p.currency || "INR"); }
    catch { p = await fetchPayment(paymentId); } // another path may have captured it meanwhile
  }
  return p.status === "captured" ? p : null;
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

// Verifies the checkout callback: HMAC-SHA256(order_id|payment_id) with key secret.
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

// Verifies a webhook: HMAC-SHA256(raw body) with the webhook secret.
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

// Invoice number like PR-260103-7K3Q.
export function newInvoiceNo(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) rand += alpha[bytes[i] % alpha.length];
  return `PR-${ymd}-${rand}`;
}
