import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { appOrigin, safeNext } from "../../../lib/auth/security";

// Token-hash confirmation: unlike the PKCE /auth/callback, this works when the email link is opened
// in a different browser or an in-app mail browser than the one that requested it.
const TYPES = ["signup", "recovery", "email"] as const;
type OtpType = (typeof TYPES)[number];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as OtpType | null;
  const recovery = type === "recovery";
  const next = safeNext(url.searchParams.get("next") || (recovery ? "/reset-password" : "/dashboard"));
  let failure = "confirmation";
  try {
    if (tokenHash && type && TYPES.includes(type)) {
      const supabase = await createAuthServerClient(true);
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(next, appOrigin()), { headers: { "Cache-Control": "no-store" } });
      failure = error.code || "confirmation";
    }
  } catch { failure = "confirmation"; }
  const target = new URL(recovery ? "/forgot-password" : "/login", appOrigin());
  target.searchParams.set("error", failure);
  target.searchParams.set("next", next);
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}
