import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { substance, composed } from "../../../../lib/dev-fixture";

export const runtime = "nodejs";

function geoLine(s: any) {
  const g = (s && s.geography) || {};
  return [g.block && g.block + " Block", g.district && g.district + " District", g.state].filter(Boolean).join(", ");
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "disabled_in_production" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const meta = {
    title: composed.title,
    subtitle: composed.subtitle,
    theme: substance.theme,
    geography: geoLine(substance),
    duration: substance.duration,
    budget: substance.budget,
    budget_grand_total: substance.budget_grand_total,
    rates_to_confirm: substance.rates_to_confirm || [],
    flags: substance.flags || [],
  };

  const admin = createAdminClient();
  const { data: row, error } = await admin.from("proposals").insert({
    user_id: user.id, mode: "open", status: "draft", title: composed.title,
    answers: { seed: true }, substance, composed, meta,
  }).select("id").single();
  if (error || !row) return NextResponse.json({ ok: false, error: error?.message || "insert_failed" }, { status: 500 });

  return NextResponse.redirect(new URL("/proposals/" + row.id, req.url));
}
