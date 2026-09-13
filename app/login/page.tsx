"use client";

import { FormEvent, Suspense, useState } from "react";
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
  const [socialBusy, setSocialBusy] = useState<"google" | "github" | "facebook" | null>(null);
  const [message, setMessage] = useState(params.get("error") ? authMessage(params.get("error")) : "");
  const nextPath = safeNext(params.get("next"));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || socialBusy) return;
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

  async function signInWithSocial(provider: "google" | "github" | "facebook") {
    if (busy || socialBusy) return;
    setSocialBusy(provider);
    setMessage("");
    try {
      const result = await authPost("/api/auth/oauth", { provider, next: nextPath });
      if (!result.redirect) throw new Error("Could not connect to the provider. Try again.");
      window.location.assign(result.redirect);
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
    } finally { setSocialBusy(null); }
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
        <div className="social-auth" aria-label="Social sign in options">
          <button
            type="button"
            className="social-auth-button"
            onClick={() => signInWithSocial("google")}
            disabled={busy || socialBusy !== null}
          >
            <span className="social-auth-icon google" aria-hidden="true">G</span>
            {socialBusy === "google" ? "Connecting…" : "Continue with Google"}
          </button>
          <button
            type="button"
            className="social-auth-button"
            onClick={() => signInWithSocial("facebook")}
            disabled={busy || socialBusy !== null}
          >
            <span className="social-auth-icon facebook" aria-hidden="true">f</span>
            {socialBusy === "facebook" ? "Connecting…" : "Continue with Facebook"}
          </button>
          <button type="button" className="social-auth-button" onClick={() => signInWithSocial("github")} disabled={busy || socialBusy !== null}>
            {socialBusy === "github" ? "Connecting…" : "Continue with GitHub"}
          </button>
        </div>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form onSubmit={submit}>
          {signup && (
            <>
              <label>Full name<input name="fullName" required autoComplete="name" /></label>
              <label>Mobile<input name="mobile" required autoComplete="tel" /></label>
            </>
          )}
          <label>Email<input name="email" type="email" required autoComplete="email" defaultValue={params.get("email") ?? ""} /></label>
          <label>Password<input name="password" type="password" minLength={signup ? 8 : 1} maxLength={1024} required autoComplete={signup ? "new-password" : "current-password"} /></label>
          {message && <div className="auth-message" role="alert" aria-live="polite">{message}</div>}
          <button className="button full" disabled={busy || socialBusy !== null}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"} <ArrowRight size={17} />
          </button>
        </form>
        <button className="auth-switch" disabled={busy || socialBusy !== null} onClick={() => { setSignup(!signup); setMessage(""); }}>
          {signup ? "Already have an account? Sign in" : "New customer? Create an account"}
        </button>
        <Link href="/" className="auth-home">← Back to TARA.NET</Link>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-card">Loading…</section></main>}><LoginForm /></Suspense>;
}
