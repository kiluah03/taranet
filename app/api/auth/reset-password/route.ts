import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { checkCsrf } from "../../../../lib/auth/csrf";
import { authMessage } from "../../../../lib/auth/security";

const schema = z.object({ password: z.string().min(8).max(1024), confirmPassword: z.string().min(8).max(1024) })
  .refine(value => value.password === value.confirmPassword);
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) return json({ error: "Refresh the page and try again." }, 403);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: "Enter matching passwords with at least 8 characters." }, 400);
    const supabase = await createAuthServerClient(true);
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) return json({ error: "Your reset session expired. Request a new password reset email." }, 401);
    // Supabase selects the account from the verified session, never from a submitted email or ID.
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return json({ error: ["weak_password", "same_password", "reauthentication_needed"].includes(error.code || "")
      ? authMessage(error.code) : "Your password could not be updated. Request a new reset link and try again." }, error.status === 429 ? 429 : 400);
    // Updating succeeded. A later logout failure must not tell the user their old password still works.
    try {
      const { error: logoutError } = await supabase.auth.signOut({ scope: "global" });
      if (logoutError) return json({ message: "Your password has been updated. We could not sign out all sessions; please sign out on your other devices." });
    } catch {
      return json({ message: "Your password has been updated. We could not sign out all sessions; please sign out on your other devices." });
    }
    return json({ message: "Your password has been updated. Sign in with your new password." });
  } catch {
    return json({ error: "Your password could not be updated. Please try again shortly." }, 503);
  }
}
