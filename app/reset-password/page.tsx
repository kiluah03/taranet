import Link from "next/link";
import { Brand } from "../ui/brand";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  let verified = false;
  try {
    const supabase = await createAuthServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    verified = !error && !!user;
  } catch { /* Show recovery instructions when the session cannot be verified. */ }
  return <main className="auth-page"><section className="auth-card">
    <Brand />
    <p className="eyebrow">Account recovery</p>
    <h1>Choose a new password.</h1>
    {verified ? <>
      <p className="auth-lead">Use at least 8 characters and choose a password you have not used before.</p>
      <PasswordForm />
    </> : <>
      <p className="auth-lead">Open the latest password reset link in the browser where you requested it. If your link expired, request a new one.</p>
      <Link href="/forgot-password" className="button full">Request a reset link</Link>
      <Link href="/login" className="auth-home">Back to sign in</Link>
    </>}
  </section></main>;
}
