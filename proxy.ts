import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions } from "./lib/auth/security";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const login = () => {
    const target = new URL("/login", request.url);
    target.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
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
          values.forEach(({ name, value, options: cookieOptions }) => response.cookies.set(name, value, { ...cookieOptions, ...options }));
        },
      },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    return error || !user ? login() : response;
  } catch { return login(); }
}
export const config = { matcher: ["/dashboard/:path*", "/portal/:path*", "/admin/:path*"] };
