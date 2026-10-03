import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Supabase falls back to the Site URL (the homepage) after confirming an
  // email when the link's redirect isn't used. Forward those landings to the
  // confirm route so the user is signed in and taken to the dashboard.
  const url = request.nextUrl;
  if (url.pathname === "/" && (url.searchParams.has("code") || url.searchParams.has("token_hash"))) {
    const to = url.clone();
    to.pathname = "/auth/confirm";
    if (!to.searchParams.has("next")) to.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(to);
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
