"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Brand } from "../ui/brand";
import { createAuthBrowserClient } from "../../lib/supabase/auth-client";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createAuthBrowserClient(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (signup) {
      const fullName = String(form.get("fullName") ?? "");
      const mobile = String(form.get("mobile") ?? "");
      const redirectTo = `${window.location.origin}/auth/callback?next=/portal`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo, data: { full_name: fullName, mobile } },
      });
      if (error) setMessage(error.message);
      else if (data.session) {
        router.replace("/portal");
        router.refresh();
      } else {
        setMessage("Check your email and confirm your account, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else {
        router.replace("/portal");
        router.refresh();
      }
    }
    setBusy(false);
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
        <form onSubmit={submit}>
          {signup && (
            <>
              <label>Full name<input name="fullName" required autoComplete="name" /></label>
              <label>Mobile<input name="mobile" required autoComplete="tel" /></label>
            </>
          )}
          <label>Email<input name="email" type="email" required autoComplete="email" defaultValue={params.get("email") ?? ""} /></label>
          <label>Password<input name="password" type="password" minLength={8} required autoComplete={signup ? "new-password" : "current-password"} /></label>
          {message && <div className="auth-message"><CheckCircle2 size={17} />{message}</div>}
          <button className="button full" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"} <ArrowRight size={17} />
          </button>
        </form>
        <button className="auth-switch" onClick={() => { setSignup(!signup); setMessage(""); }}>
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
