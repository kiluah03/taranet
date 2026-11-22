import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AFFILIATE_COOKIE, AFFILIATE_COOKIE_MAX_AGE, normalizeAffiliateCode } from "./lib/affiliates/code";
import { sessionCookieOptions } from "./lib/auth/security";

const PROTECTED_PREFIXES = ["/dashboard", "/portal", "/admin"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const refCode = normalizeAffiliateCode(request.nextUrl.searchParams.get("ref"));

  // Last-touch 30-day attribution: whenever a valid ?ref=CODE is visited, refresh taranet_ref.
  // Inject onto request.cookies too so same-request Server Components (e.g. /login?mode=signup&ref=CODE) read it immediately.
  const applyRefCookie = (res: NextResponse) => {
    if (!refCode) return;
    let secure = false;
    try {
      secure = sessionCookieOptions().secure;
    } catch {
      secure = request.nextUrl.protocol === "https:";
    }
    res.cookies.set(AFFILIATE_COOKIE, refCode, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
    });
    res.headers.set("Cache-Control", "private, no-store");
  };

  if (refCode) {
    request.cookies.set(AFFILIATE_COOKIE, refCode);
  }

  // Public routes: never run Supabase session refresh so login/callback/public pages remain fast and unaffected.
  if (!isProtectedPath(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request });
    applyRefCookie(response);
    return response;
  }

  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  applyRefCookie(response);

  const login = () => {
    const target = new URL("/login", request.url);
    target.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    applyRefCookie(redirect);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  };

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return login();
    const options = sessionCookieOptions();
    const supabase = createServerClient(url, key, {
      cookieOptions: options,
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          response.headers.set("Cache-Control", "private, no-store");
          applyRefCookie(response);
          values.forEach(({ name, value, options: cookieOptions }) => response.cookies.set(name, value, { ...cookieOptions, ...options }));
        },
      },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    return error || !user ? login() : response;
  } catch {
    return login();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
