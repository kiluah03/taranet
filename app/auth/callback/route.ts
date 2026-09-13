import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { appOrigin, safeNext } from "../../../lib/auth/security";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  let failure = url.searchParams.get("error_code") || url.searchParams.get("error") || "callback";
  try {
    const code = url.searchParams.get("code");
    if (code && !url.searchParams.has("error") && !url.searchParams.has("error_code")) {
      const supabase = await createAuthServerClient(true);
      // Supabase verifies the one-time code against this browser's HttpOnly PKCE verifier.
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user && data.session) {
        return NextResponse.redirect(new URL(next, appOrigin()), { headers: { "Cache-Control": "no-store" } });
      }
      failure = error?.code || "callback";
    }
  } catch { failure = "callback"; }
  const target = new URL("/login", appOrigin());
  target.searchParams.set("error", failure);
  target.searchParams.set("next", next);
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}
