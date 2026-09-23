"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "../ui/brand";
import { authPost } from "../../lib/auth/client";
import { authMessage, safeNext } from "../../lib/auth/security";

function LoginForm() {
  const params = useSearchParams();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(params.get("error") ? authMessage(params.get("error")) : "");
  const nextPath = safeNext(params.get("next"));
  const formRef = useRef<HTMLFormElement>(null);
  const [resendWait, setResendWait] = useState(0);
  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = window.setTimeout(() => setResendWait(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendWait]);

  async function resendConfirmation() {
    if (busy || resendWait > 0) return;
    const emailInput = formRef.current?.elements.namedItem("email") as HTMLInputElement | null;
    if (!emailInput?.reportValidity()) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await authPost("/api/auth/resend", { email: emailInput.value, next: nextPath });
      setMessage(result.message || "Please try again.");
      setResendWait(60);
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await authPost("/api/auth/password", {
        mode: signup ? "signup" : "login", email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""), fullName: String(form.get("fullName") ?? ""),
        mobile: String(form.get("mobile") ?? ""), next: nextPath,
      });
      if (result.redirect) window.location.assign(result.redirect);
      else setMessage(result.message || "Please try again.");
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Brand />
        <p className="eyebrow">{signup ? "Create your account" : "Customer portal"}</p>
        <h1>{signup ? "Join your TARA whānau." : "Welcome back."}</h1>
        <p className="auth-lead">
          {signup
            ? "Use the same email as your fibre application so we can link it automatically."
            : "Sign in to manage your service, billing, rewards, and support."}
        </p>
        <form ref={formRef} onSubmit={submit}>
          {signup && (
            <>
              <label>Full name<input name="fullName" required autoComplete="name" /></label>
              <label>Mobile<input name="mobile" required autoComplete="tel" /></label>
            </>
          )}
          <label>Email<input name="email" type="email" required autoComplete="email" defaultValue={params.get("email") ?? ""} /></label>
          <label>Password<input name="password" type="password" minLength={signup ? 8 : 1} maxLength={1024} required autoComplete={signup ? "new-password" : "current-password"} /></label>
          {message && <div className="auth-message" role="alert" aria-live="polite">{message}</div>}
          <button className="button full" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"} <ArrowRight size={17} />
          </button>
        </form>
        {!signup && <Link href="/forgot-password" className="auth-switch">Forgot password?</Link>}
        <button className="auth-switch" disabled={busy} onClick={() => { setSignup(!signup); setMessage(""); }}>
          {signup ? "Already have an account? Sign in" : "New customer? Create an account"}
        </button>
        <button type="button" className="auth-switch" disabled={busy || resendWait > 0} onClick={resendConfirmation}>
          {resendWait > 0 ? "Resend available in " + resendWait + "s" : "Resend confirmation email"}
        </button>
        <Link href="/" className="auth-home">← Back to TARA.NET</Link>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-card">Loading…</section></main>}><LoginForm /></Suspense>;
}
