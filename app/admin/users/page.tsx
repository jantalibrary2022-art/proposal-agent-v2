import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isAdminEmail, adminToken } from "../../../lib/admin-auth";
import PinGate from "../PinGate";
import UsersTable, { type UserRow } from "./UsersTable";
import { pricePaise } from "../../../lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pages through every row of a table (Supabase caps a select at 1000 rows).
async function fetchAll(admin: any, table: string, cols: string): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select(cols).range(from, from + 999);
    if (error || !data || data.length === 0) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

async function fetchAllUsers(admin: any): Promise<any[]> {
  const out: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = (data && data.users) || [];
    if (error || users.length === 0) break;
    out.push(...users);
    if (users.length < 1000) break;
  }
  return out;
}

export default async function AdminUsersPage() {
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
  const [users, proposals, orgs, purchases, redemptions, coupons] = await Promise.all([
    fetchAllUsers(admin),
    fetchAll(admin, "proposals", "id,user_id,status,mode,created_at"),
    fetchAll(admin, "org_profiles", "user_id,name,is_default"),
    fetchAll(admin, "purchases", "user_id,proposal_id,amount,status"),
    fetchAll(admin, "coupon_redemptions", "user_id,proposal_id,coupon_id,code,kind,created_at"),
    fetchAll(admin, "coupons", "id,value"),
  ]);

  // Discount received, counted only on proposals that reached Final:
  // list price minus what was actually paid. A free code counts as the full price.
  const full = pricePaise() / 100;
  const couponValue = new Map(coupons.map((c: any) => [c.id, Number(c.value) || 0]));
  const latestRed = new Map<string, any>();
  for (const r of redemptions) {
    if (!r.proposal_id) continue;
    const prev = latestRed.get(r.proposal_id);
    if (!prev || r.created_at > prev.created_at) latestRed.set(r.proposal_id, r);
  }
  const paidByProposal = new Map<string, number>();
  for (const p of purchases) if (p.status === "paid" && p.proposal_id) paidByProposal.set(p.proposal_id, (paidByProposal.get(p.proposal_id) || 0) + Number(p.amount || 0));
  function discountFor(proposalId: string): number {
    const r = latestRed.get(proposalId);
    if (!r) return 0;
    if (r.kind === "free") return full;
    const paid = paidByProposal.get(proposalId);
    if (paid !== undefined) return Math.max(0, full - paid);
    const v = couponValue.get(r.coupon_id) || 0;
    const d = r.kind === "percent" ? full * Math.min(100, Math.max(0, v)) / 100 : v;
    return Math.min(full, Math.max(0, d));
  }

  const rows: UserRow[] = users.map((u: any) => {
    const md = u.user_metadata || {};
    const mine = proposals.filter((p) => p.user_id === u.id);
    const count = (s: string) => mine.filter((p) => p.status === s).length;
    const profiles = orgs.filter((o) => o.user_id === u.id).sort((a, b) => Number(!!b.is_default) - Number(!!a.is_default));
    const paid = purchases.filter((p) => p.user_id === u.id && p.status === "paid");
    const last = mine.reduce((acc: string | null, p) => (!acc || p.created_at > acc ? p.created_at : acc), null);
    return {
      id: u.id,
      name: md.full_name || "",
      email: u.email || "",
      accountType: md.account_type === "organisation" ? "Organisation" : "Individual",
      orgName: md.org_name || "",
      profiles: profiles.map((o) => o.name).filter(Boolean),
      signedUp: u.created_at,
      confirmed: !!(u.email_confirmed_at || u.confirmed_at),
      lastSignIn: u.last_sign_in_at || null,
      total: mine.length,
      draft: count("draft"),
      final: count("ready"),
      inProgress: count("generating") + count("rendering"),
      failed: count("error"),
      paidCount: paid.length,
      paidAmount: paid.reduce((a, p) => a + Number(p.amount || 0), 0),
      codesUsed: redemptions.filter((r) => r.user_id === u.id).length,
      discount: Math.round(mine.filter((p) => p.status === "ready").reduce((a, p) => a + discountFor(p.id), 0)),
      lastProposal: last,
    };
  });

  const sum = (k: keyof UserRow) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const tiles: [string, string][] = [
    ["REGISTERED", rows.length.toLocaleString()],
    ["NEW · 7 DAYS", rows.filter((r) => new Date(r.signedUp).getTime() >= weekAgo).length.toLocaleString()],
    ["ORGANISATIONS", rows.filter((r) => r.accountType === "Organisation").length.toLocaleString()],
    ["ACTIVE (≥1 PROPOSAL)", rows.filter((r) => r.total > 0).length.toLocaleString()],
    ["DRAFTS", sum("draft").toLocaleString()],
    ["FINAL", sum("final").toLocaleString()],
    ["PAID", sum("paidCount").toLocaleString()],
    ["AMOUNT PAID", "₹" + sum("paidAmount").toLocaleString("en-IN")],
    ["DISCOUNTS GIVEN", "₹" + sum("discount").toLocaleString("en-IN")],
    ["LIST PRICE", "₹" + full.toLocaleString("en-IN")],
    ["CODES REDEEMED", sum("codesUsed").toLocaleString()],
  ];
  const tile = "bg-card border border-line rounded-lg p-5";

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="h-16 border-b border-line">
        <div className="h-full max-w-[1300px] mx-auto px-6 sm:px-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-[26px] h-[26px] rounded-[3px] bg-ink text-paper font-extrabold text-[15px] flex items-center justify-center">प्र</span>
            <span className="font-extrabold text-[19px] tracking-[-0.02em]">Prastav</span>
            <span className="text-[11px] tracking-[0.1em] text-muted border border-line rounded px-2 py-0.5 ml-1">ADMIN</span>
          </div>
          <Link href="/admin" className="text-[13px] tracking-wide text-muted">← Admin</Link>
        </div>
      </header>

      <div className="max-w-[1300px] mx-auto px-6 sm:px-11 py-10">
        <h1 className="font-extrabold text-[30px] tracking-[-0.03em] mb-2">Users</h1>
        <p className="text-[14px] text-muted mb-8 max-w-[720px] leading-relaxed">
          Everyone who has registered, with the organisation they signed up under and the profiles they have created.
          Draft means generated and awaiting review or payment. Final means approved, with files produced.
          Paid is the total of successful payments (test-mode payments included until live keys are in).
          Discount is counted on Final proposals only: list price minus the amount paid, and the full price where a free code was used.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {tiles.map(([label, val]) => (
            <div key={label} className={tile}>
              <div className="text-[12px] tracking-[0.08em] text-muted mb-2">{label}</div>
              <div className="text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">{val}</div>
            </div>
          ))}
        </div>
        <UsersTable rows={rows} />
      </div>
    </main>
  );
}
