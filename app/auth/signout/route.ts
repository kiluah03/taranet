import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/supabase/auth-server";
import { appOrigin } from "../../../lib/auth/security";
export async function POST(request: Request) {
  // Native form POST: strict Origin validation protects this endpoint from CSRF.
  if (request.headers.get("origin") !== appOrigin() || request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const supabase = await createAuthServerClient(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return NextResponse.json({ error: "Could not sign out. Please try again." }, { status: 503 });
    return NextResponse.redirect(new URL("/login", appOrigin()), { status: 303 });
  } catch { return NextResponse.json({ error: "Could not sign out. Please try again." }, { status: 503 }); }
}
