import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { publicOrigin } from "../../../lib/public-origin";

// Email confirmation landing. Handles both link formats Supabase can send:
// - token_hash + type (custom template: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email)
// - code (default template, PKCE redirect after Supabase verifies the link)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") || "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const supabase = await createClient();
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  // If the account is already confirmed (e.g. a mail scanner opened the link first),
  // the user can simply sign in; the signup page explains this for link_invalid.
  return NextResponse.redirect(new URL("/signup?error=link_invalid", origin));
}
