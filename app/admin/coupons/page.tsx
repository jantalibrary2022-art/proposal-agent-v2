import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isAdminEmail, adminToken } from "../../../lib/admin-auth";
import PinGate from "../PinGate";
import CouponConsole from "./CouponConsole";

export const runtime = "nodejs";

export default async function AdminCouponsPage() {
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
  const [cps, rds] = await Promise.all([
    admin.from("coupons").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("coupon_redemptions").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

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
        <h1 className="font-extrabold text-[30px] tracking-[-0.03em] mb-2">Access codes</h1>
        <p className="text-[14px] text-muted mb-8 max-w-[640px] leading-relaxed">
          Mint free access tokens for live testing (one proposal per code), or discount codes for launch.
          Discount codes take effect once payments are live; free codes work now.
        </p>
        <CouponConsole initialCoupons={cps.data || []} initialRedemptions={rds.data || []} />
      </div>
    </main>
  );
}
