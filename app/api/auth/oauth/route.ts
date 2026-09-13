import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { checkCsrf } from "../../../../lib/auth/csrf";
import { appOrigin, authMessage, safeNext } from "../../../../lib/auth/security";
import { providerEnabled } from "../../../../lib/auth/providers";
const schema = z.object({ provider: z.enum(["google", "github", "facebook"]), next: z.string().optional() });
export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) return NextResponse.json({ error: "Refresh the page and try again." }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a supported sign-in provider." }, { status: 400 });
    const { provider, next } = parsed.data;
    if (!await providerEnabled(provider)) return NextResponse.json({ error: authMessage("provider_disabled") }, { status: 503 });
    const supabase = await createAuthServerClient(true);
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: {
      redirectTo: appOrigin() + "/auth/callback?next=" + encodeURIComponent(safeNext(next)),
      skipBrowserRedirect: true,
      scopes: provider === "github" ? "read:user user:email" : provider === "facebook" ? "email" : undefined,
    } });
    if (error || !data.url) return NextResponse.json({ error: authMessage(error?.code) }, { status: 400 });
    return NextResponse.json({ redirect: data.url }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: authMessage(null) }, { status: 503 }); }
}
