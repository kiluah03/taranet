"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "../ui/brand";
import { authPost } from "../../lib/auth/client";

function ForgotPasswordForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [message, setMessage] = useState(params.has("error") ? "Your reset link expired or could not be verified. Request a new email and open the latest link in this browser." : "");
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || wait > 0) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const result = await authPost("/api/auth/forgot-password", { email: String(form.get("email") ?? "") });
      setMessage(result.message || "Please try again.");
      setWait(60);
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card">
    <Brand />
    <p className="eyebrow">Account recovery</p>
    <h1>Forgot password?</h1>
    <p className="auth-lead">Enter your account email to request a password reset link. Open it in this browser to choose a new password.</p>
    <form onSubmit={submit}>
      <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={params.get("email") ?? ""} /></label>
      {message && <div className="auth-message" role="status" aria-live="polite">{message}</div>}
      <button className="button full" disabled={busy || wait > 0}>{busy ? "Sending request..." : wait > 0 ? "Try again in " + wait + "s" : "Send reset link"}</button>
    </form>
    <Link href="/login" className="auth-home">Back to sign in</Link>
  </section></main>;
}

export default function ForgotPasswordPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-card">Loading...</section></main>}><ForgotPasswordForm /></Suspense>;
}
