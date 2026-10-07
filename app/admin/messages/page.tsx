import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isAdminEmail, adminToken } from "../../../lib/admin-auth";
import PinGate from "../PinGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const pin = process.env.ADMIN_PIN || "";
  if (pin) {
    const store = await cookies();
    const token = store.get("prastav_admin")?.value || "";
    if (token !== adminToken(pin, user.id)) return <PinGate />;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_messages")
    .select("id,name,email,subject,message,user_id,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows: any[] = data || [];

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="h-16 border-b border-line">
        <div className="h-full max-w-[1100px] mx-auto px-6 sm:px-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[19px] tracking-[-0.02em]">Prastav</span>
            <span className="text-[11px] tracking-[0.1em] text-muted border border-line rounded px-2 py-0.5 ml-1">ADMIN</span>
          </div>
          <Link href="/admin" className="text-[13px] tracking-wide text-muted">← Admin</Link>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 sm:px-11 py-10">
        <h1 className="font-extrabold text-[30px] tracking-[-0.03em] mb-2">Messages</h1>
        <p className="text-[14px] text-muted mb-8 max-w-[720px] leading-relaxed">
          Everything sent through the Contact page, newest first. Reply opens your mail app with the sender&apos;s address filled in.
        </p>

        {error && (
          <div className="bg-card border border-[#C9A27A] rounded-lg p-5 text-[14px] text-[#8A3B12] mb-6">
            Could not load messages: {error.message}. If this says the table is missing, run the contact_messages SQL in Supabase.
          </div>
        )}

        {!error && rows.length === 0 && (
          <div className="bg-card border border-line rounded-lg p-6 text-[14px] text-muted">No messages yet.</div>
        )}

        <div className="space-y-4">
          {rows.map((m) => {
            const subj = m.subject || "Your message to Prastav";
            const reply = `mailto:${encodeURIComponent(m.email || "")}?subject=${encodeURIComponent("Re: " + subj)}`;
            return (
              <article key={m.id} className="bg-card border border-line rounded-lg p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <div>
                    <span className="font-semibold">{m.name || "No name"}</span>
                    <span className="text-[13px] text-muted ml-2 break-all">{m.email}</span>
                    {m.user_id && <span className="ml-2 text-[10.5px] tracking-wide border border-line rounded px-1.5 py-px text-muted">SIGNED IN</span>}
                  </div>
                  <span className="text-[12.5px] text-muted tabular-nums">{fmt(m.created_at)}</span>
                </div>
                {m.subject && <div className="text-[14px] font-semibold mb-1.5">{m.subject}</div>}
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{m.message}</div>
                {m.email && (
                  <a href={reply} className="inline-block mt-3 text-[13px] font-semibold border border-ink rounded px-3 py-1.5">Reply</a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
