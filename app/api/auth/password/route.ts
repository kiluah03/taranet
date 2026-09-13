import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { checkCsrf } from "../../../../lib/auth/csrf";
import { appOrigin, authMessage, safeNext } from "../../../../lib/auth/security";
const schema = z.object({
  mode: z.enum(["login", "signup"]), email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024), fullName: z.string().trim().max(160).optional(),
  mobile: z.string().trim().max(30).optional(), next: z.string().optional(),
});
export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) return NextResponse.json({ error: "Refresh the page and try again." }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    const { mode, email, password, fullName, mobile, next } = parsed.data;
    if (mode === "signup" && (password.length < 8 || !fullName || !mobile))
      return NextResponse.json({ error: "Enter your name, mobile, and a password of at least 8 characters." }, { status: 400 });
    const supabase = await createAuthServerClient(true);
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: {
          emailRedirectTo: appOrigin() + "/auth/callback?next=" + encodeURIComponent(safeNext(next)),
          data: { full_name: fullName, mobile },
        } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return NextResponse.json({ error: authMessage(result.error.code) }, { status: result.error.status === 429 ? 429 : 400 });
    return NextResponse.json(result.data.session ? { redirect: safeNext(next) } :
      { message: "Check your email and confirm your account in this browser, then sign in." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: authMessage(null) }, { status: 503 });
  }
}
