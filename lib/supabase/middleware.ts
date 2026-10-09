import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicOrigin } from "../public-origin";

// Inlined here (not imported from admin-auth, which pulls in next/headers) so it
// is safe to call in middleware. Mirrors isAdminEmail: email in ADMIN_EMAILS.
function emailIsAdmin(email: string | null | undefined): boolean {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Maintenance mode: while PRASTAV_MAINTENANCE=on, everyone except a signed-in
  // admin sees the maintenance page. Login, auth, API routes (cron, webhook,
  // their own auth) and the maintenance page itself stay reachable so the admin
  // can sign in and work privately on the live site.
  if ((process.env.PRASTAV_MAINTENANCE || "").toLowerCase() === "on") {
    const path = request.nextUrl.pathname;
    const open =
      path === "/maintenance" ||
      path.startsWith("/login") ||
      path.startsWith("/auth") ||
      path.startsWith("/api") ||
      path.startsWith("/_next");
    if (!open && !emailIsAdmin(user?.email)) {
      const res = NextResponse.rewrite(new URL("/maintenance", publicOrigin(request)));
      res.headers.set("Retry-After", "3600");
      return res;
    }
  }

  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", publicOrigin(request)));
  }

  return supabaseResponse;
}
