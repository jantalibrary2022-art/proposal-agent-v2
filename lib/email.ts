// Transactional email, env-gated and best-effort. If SMTP is not configured,
// every call is a no-op that returns false, so generation never depends on it.
// Configure via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional),
// NEXT_PUBLIC_SITE_URL (optional, for links).
import nodemailer from "nodemailer";

export function emailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://prastav.app").replace(/\/+$/, "");
}

let transporter: any = null;
function getTransport(): any {
  if (!emailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Same as sendEmail but reports the failure reason. Used by the admin test button.
export async function sendEmailDetailed(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const t = getTransport();
  if (!t) return { ok: false, error: "SMTP is not configured (SMTP_HOST, SMTP_USER and SMTP_PASS must all be set)." };
  if (!to) return { ok: false, error: "No recipient address." };
  const from = process.env.SMTP_FROM || `Prastav <${process.env.SMTP_USER}>`;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  try {
    await t.sendMail({ from, to, subject, html, text });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String((e && (e.response || e.message)) || e).slice(0, 500) };
  }
}

export function emailSettingsSummary() {
  return {
    configured: emailConfigured(),
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || "",
    from: process.env.SMTP_FROM || "",
  };
}

export async function sendTestEmail(to: string) {
  const body = `<p style="font-size:15px;line-height:1.6">This is a test email from the Prastav admin page. If you are reading it, transactional email is working.</p>`;
  return sendEmailDetailed(to, "Prastav test email", shell("Email is working", body));
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransport();
  if (!t || !to) return false;
  const from = process.env.SMTP_FROM || `Prastav <${process.env.SMTP_USER}>`;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  try {
    await t.sendMail({ from, to, subject, html, text });
    return true;
  } catch {
    return false;
  }
}

const shell = (title: string, body: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a17">
    <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;margin-bottom:16px">Prastav</div>
    <h1 style="font-size:19px;margin:0 0 12px">${title}</h1>
    ${body}
    <p style="font-size:12px;color:#8a8a80;margin-top:28px">You are receiving this because a proposal was generated on your Prastav account.</p>
  </div>`;

export async function sendProposalReady(to: string, p: { id: string; title?: string }): Promise<boolean> {
  const link = `${siteUrl()}/proposals/${p.id}`;
  const title = p.title ? `"${p.title}"` : "Your proposal";
  const body = `
    <p style="font-size:15px;line-height:1.6">${title} is ready to review.</p>
    <p style="margin:20px 0"><a href="${link}" style="background:#1a1a17;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:4px;display:inline-block">Review your proposal</a></p>
    <p style="font-size:13px;color:#8a8a80">Or open: ${link}</p>`;
  return sendEmail(to, "Your Prastav proposal is ready", shell("Your proposal is ready", body));
}

export async function sendProposalFailed(to: string, p: { id: string; busy?: boolean }): Promise<boolean> {
  const dash = `${siteUrl()}/dashboard`;
  const body = p.busy
    ? `<p style="font-size:15px;line-height:1.6">We were handling a lot of requests and could not build your proposal just now. Nothing has been charged. Please try again from your dashboard in a few minutes.</p>`
    : `<p style="font-size:15px;line-height:1.6">Something went wrong while building your proposal, and it is on us, not you. Nothing has been charged. You can start again from your dashboard, and if it keeps happening, reply to this email and we will help.</p>`;
  const cta = `<p style="margin:20px 0"><a href="${dash}" style="background:#1a1a17;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:4px;display:inline-block">Go to your dashboard</a></p>`;
  return sendEmail(to, "About your Prastav proposal", shell("We could not finish your proposal", body + cta));
}

export async function sendDraftReminder(to: string, p: { id: string; title?: string; locksAt: string }): Promise<boolean> {
  const link = `${siteUrl()}/proposals/${p.id}`;
  const d = new Date(p.locksAt);
  const dateEn = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const dateHi = d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const title = p.title ? `"${p.title}"` : "Your draft proposal";
  const body = `
    <p style="font-size:15px;line-height:1.6">${title} is unpaid and will be locked on <b>${dateEn}</b>. To keep it, pay and finalise before then, and your PDF, Word and Excel files will be ready at once.</p>
    <p style="font-size:14px;line-height:1.6;color:#55554c">आपका ड्राफ़्ट प्रस्ताव ${dateHi} को लॉक हो जाएगा। उसे रखने के लिए उससे पहले भुगतान करके अंतिम रूप दें।</p>
    <p style="margin:20px 0"><a href="${link}" style="background:#1a1a17;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:4px;display:inline-block">Review and finalise</a></p>
    <p style="font-size:13px;color:#8a8a80">If it locks, you can still restore it by paying within the following 30 days. After that it is deleted permanently. Or open: ${link}</p>`;
  return sendEmail(to, "Your Prastav draft locks in 2 days", shell("Your draft locks in 2 days", body));
}
