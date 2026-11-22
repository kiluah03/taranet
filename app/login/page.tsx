import { cookies } from "next/headers";
import { Suspense } from "react";
import { AFFILIATE_COOKIE, normalizeAffiliateCode } from "../../lib/affiliates/code";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const initialRefCode = normalizeAffiliateCode(cookieStore.get(AFFILIATE_COOKIE)?.value) ?? "";
  return (
    <Suspense fallback={<main className="auth-page"><section className="auth-card">Loading…</section></main>}>
      <LoginForm initialRefCode={initialRefCode} />
    </Suspense>
  );
}
