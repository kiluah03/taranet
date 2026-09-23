import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { checkCsrf } from "../../../../lib/auth/csrf";
import { appOrigin, authMessage, safeNext } from "../../../../lib/auth/security";

const schema = z.object({ email: z.string().trim().email().max(254), next: z.string().optional() });

export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) return NextResponse.json({ error: "Refresh the page and try again." }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const supabase = await createAuthServerClient(true);
    const { error } = await supabase.auth.resend({
      type: "signup", email: parsed.data.email,
      options: { emailRedirectTo: appOrigin() + "/auth/callback?next=" + encodeURIComponent(safeNext(parsed.data.next)) },
    });
    if (error) return NextResponse.json({ error: authMessage(error.code) }, { status: error.status === 429 ? 429 : 400 });
    // Do not disclose whether an account exists, or promise delivery for verified accounts.
    return NextResponse.json({ message: "If this email has an account awaiting confirmation, a new confirmation email has been requested. Check your inbox and spam folder, and open the latest link in this browser. If you already confirmed your account, sign in instead." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not request a confirmation email. Please try again shortly." }, { status: 503 });
  }
}
