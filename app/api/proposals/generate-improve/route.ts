import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { runImproveDraft } from "../../../../lib/run-improve";
import { normalizeCode, validateCoupon, redeemCoupon } from "../../../../lib/coupons";
import { genErrorMessage } from "../../../../lib/gen-errors";
import { gateForGeneration, claimCredit, recordDraft, releaseOnFailure, progressReporter } from "../../../../lib/drafts";
import { priceFor } from "../../../../lib/pricing";
import { sendProposalReady, sendProposalFailed } from "../../../../lib/email";

export const runtime = "nodejs";

function outputLanguage(v: unknown): "English" | "Hindi" {
  return v === "Hindi" ? "Hindi" : "English";
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  let form: any = null;
  try { form = (await req.json()).answers; } catch { form = null; }
  if (!form || !form.draft_text || String(form.draft_text).trim().length < 200) {
    return NextResponse.json({ ok: false, error: "missing_draft" }, { status: 400 });
  }

  const draftText = String(form.draft_text);
  const diagnosis = form.diagnosis && typeof form.diagnosis === "object" ? form.diagnosis : null;
  const qa = Array.isArray(form.qa) ? form.qa : [];
  const dmeta = (diagnosis && diagnosis.meta) || {};
  const title = String(dmeta.title || "Improved proposal").slice(0, 120);

  const couponCode = normalizeCode(form.coupon_code);
  if (couponCode) {
    const chk = await validateCoupon(couponCode, user.email);
    if (!chk.ok) return NextResponse.json({ ok: false, error: "invalid_coupon", reason: chk.reason }, { status: 400 });
  }

  const admin = createAdminClient();
  // Unpaid-draft rules: limit of open unpaid drafts, pay-first after an expiry.
  const gate = await gateForGeneration(admin, user.id, !!couponCode);
  if (gate.error) return NextResponse.json({ ok: false, error: gate.error }, { status: 402 });
  const { data: row, error: insErr } = await admin
    .from("proposals")
    .insert({ user_id: user.id, mode: "improve", status: "generating", title, answers: { qa, meta: dmeta } })
    .select("id")
    .single();
  if (insErr || !row) return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });

  const proposalId = row.id as string;

  if (gate.creditId && !(await claimCredit(admin, gate.creditId, proposalId))) {
    // The credit was taken by another request meanwhile: allow only if the user
    // may still generate without it.
    const again = await gateForGeneration(admin, user.id, !!couponCode);
    if (again.error || (again.creditId && !(await claimCredit(admin, again.creditId, proposalId)))) {
      await admin.from("proposals").delete().eq("id", proposalId);
      return NextResponse.json({ ok: false, error: again.error || "prepay_required" }, { status: 402 });
    }
  }

  if (couponCode) {
    const red = await redeemCoupon(couponCode, user.id, user.email ?? null, proposalId);
    if (!red.ok) {
      await admin.from("proposals").update({ status: "error", error: "coupon_redeem_failed:" + (red.reason || ""), updated_at: new Date().toISOString() }).eq("id", proposalId);
      await releaseOnFailure(admin, proposalId);
      return NextResponse.json({ ok: false, error: "coupon_redeem_failed", reason: red.reason }, { status: 400 });
    }
  }

  // Every draft goes in the ledger; one that is free (code brings price to 0) never counts.
  await recordDraft(admin, user.id, proposalId, couponCode ? (await priceFor(admin, proposalId)).free : false);

  (async () => {
    try {
      const draft = await runImproveDraft(draftText, qa, { diagnosis, language: outputLanguage(form.output_language), onProgress: progressReporter(admin, proposalId) });
      const meta = {
        ...draft.meta,
        improve: {
          strengths: (diagnosis && diagnosis.strengths) || [],
          weaknesses: (diagnosis && diagnosis.weaknesses) || [],
          source_authority_flags: (diagnosis && diagnosis.source_authority_flags) || [],
          improvements: draft.meta.improvements || [],
        },
      };
      await admin.from("proposals").update({ status: "draft", title: draft.meta.title, meta, substance: draft.substance, composed: draft.composed, updated_at: new Date().toISOString() }).eq("id", proposalId);
      if (user.email) { try { await sendProposalReady(user.email, { id: proposalId }); } catch {} }
    } catch (e: any) {
      await admin.from("proposals").update({ status: "error", error: genErrorMessage(e), updated_at: new Date().toISOString() }).eq("id", proposalId);
      await releaseOnFailure(admin, proposalId);
      if (user.email) { try { await sendProposalFailed(user.email, { id: proposalId, busy: genErrorMessage(e).startsWith("busy:") }); } catch {} }
      try { await admin.from("error_alerts").insert({ user_id: user.id, proposal_id: proposalId, mode: "improve", message: genErrorMessage(e) }); } catch {}
    }
  })();

  return NextResponse.json({ ok: true, id: proposalId });
}
