"use client";
// Browser helpers for Razorpay Checkout.

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function creditArrived(): Promise<boolean> {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    try {
      const j = await (await fetch("/api/proposals/gate")).json();
      if (j && j.hasCredit) return true;
    } catch {}
  }
  return false;
}

// Pay upfront for the next proposal. Resolves "paid" (credit recorded),
// "cancelled" (user closed checkout), "failed" (no payment taken), or
// "unconfirmed" (checkout reported success but we could not confirm it yet).
export async function payUpfront(opts: { email?: string; description: string }): Promise<"paid" | "cancelled" | "failed" | "unconfirmed"> {
  try {
    const res = await fetch("/api/payments/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prepay: true }) });
    const data = await res.json();
    if (data.already) return "paid";
    if (!data.ok) return "failed";
    if (!(await loadRazorpay()) || !(window as any).Razorpay) return "failed";
    return await new Promise((resolve) => {
      const rz = new (window as any).Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "Prastav",
        description: opts.description,
        prefill: opts.email ? { email: opts.email } : undefined,
        theme: { color: "#1a1a17" },
        handler: async (resp: any) => {
          try {
            const v = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prepay: true, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature }),
            });
            const vd = await v.json();
            if (vd.ok) return resolve("paid");
          } catch {}
          // Checkout says it succeeded; the webhook may still record it.
          resolve((await creditArrived()) ? "paid" : "unconfirmed");
        },
        modal: { ondismiss: () => resolve("cancelled") },
      });
      rz.open();
    });
  } catch { return "failed"; }
}
