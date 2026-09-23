import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { checkCsrf } from "../../../../lib/auth/csrf";
import { appOrigin, authMessage } from "../../../../lib/auth/security";

const schema = z.object({ email: z.string().trim().email().max(254) });
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) return json({ error: "Refresh the page and try again." }, 403);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: "Enter a valid email address." }, 400);
    const supabase = await createAuthServerClient(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: appOrigin() + "/auth/callback?next=%2Freset-password",
    });
    // Keep the result identical for unknown and registered email addresses.
    if (error && error.code !== "user_not_found") {
      const message = error.code === "email_address_not_authorized"
        ? "The password reset email could not be sent. Please contact support so we can restore email delivery."
        : error.status === 429 || ["email_address_invalid", "over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code || "")
          ? authMessage(error.code)
          : "We could not request a password reset email. Please try again shortly.";
      return json({ error: message }, error.status === 429 ? 429 : 400);
    }
    return json({ message: "If an account exists for this email, a password reset email has been requested. Check your inbox and spam folder, then open the latest link in this browser." });
  } catch {
    return json({ error: "We could not request a password reset email. Please try again shortly." }, 503);
  }
}
