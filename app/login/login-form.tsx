"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Brand } from "../ui/brand";
import { normalizeAffiliateCode } from "../../lib/affiliates/code";
import { authPost } from "../../lib/auth/client";
import { authMessage, safeNext } from "../../lib/auth/security";

type CodeStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; displayName: string }
  | { state: "invalid" };

export function LoginForm({ initialRefCode = "" }: { initialRefCode?: string }) {
  const params = useSearchParams();
  const queryRef = normalizeAffiliateCode(params.get("ref")) ?? "";
  const prefilledCode = queryRef || initialRefCode;

  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(params.get("error") ? authMessage(params.get("error")) : "");
  const [referralCode, setReferralCode] = useState(prefilledCode);
  const [codeStatus, setCodeStatus] = useState<CodeStatus>({ state: "idle" });
  const nextPath = safeNext(params.get("next"));
  const formRef = useRef<HTMLFormElement>(null);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = window.setTimeout(() => setResendWait(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendWait]);

  const validateCode = useCallback(async (raw: string, signal?: AbortSignal) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setCodeStatus({ state: "idle" });
      return;
    }
    const normalized = normalizeAffiliateCode(trimmed);
    if (!normalized) {
      setCodeStatus({ state: "invalid" });
      return;
    }
    setCodeStatus({ state: "checking" });
    try {
      const response = await fetch(`/api/affiliates/validate?code=${encodeURIComponent(normalized)}`, {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
      if (!response.ok) {
        setCodeStatus({ state: "invalid" });
        return;
      }
      const data = await response.json() as { valid?: boolean; displayName?: string };
      if (data.valid && data.displayName) {
        setCodeStatus({ state: "valid", displayName: data.displayName });
      } else {
        setCodeStatus({ state: "invalid" });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setCodeStatus({ state: "idle" });
    }
  }, []);

  useEffect(() => {
    if (!signup) return;
    const trimmed = referralCode.trim();
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void validateCode(trimmed, controller.signal);
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [signup, referralCode, validateCode]);

  const effectiveCodeStatus: CodeStatus = referralCode.trim() ? codeStatus : { state: "idle" };

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
        mode: signup ? "signup" : "login",
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        fullName: String(form.get("fullName") ?? ""),
        mobile: String(form.get("mobile") ?? ""),
        referralCode: signup ? referralCode.trim() : undefined,
        next: nextPath,
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
          {signup && (
            <div className="referral-field">
              <label>
                Affiliate / Referral Code <span className="optional-tag">(optional)</span>
                <input
                  name="referralCode"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  onBlur={() => void validateCode(referralCode)}
                  maxLength={32}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. BARKADA5"
                />
              </label>
              {effectiveCodeStatus.state === "checking" && (
                <p className="referral-hint checking" role="status" aria-live="polite">Checking code…</p>
              )}
              {effectiveCodeStatus.state === "valid" && (
                <p className="referral-hint valid" role="status" aria-live="polite">
                  <CheckCircle2 size={14} /> Referred by {effectiveCodeStatus.displayName}
                </p>
              )}
              {effectiveCodeStatus.state === "invalid" && (
                <p className="referral-hint warn" role="status" aria-live="polite">
                  <AlertCircle size={14} /> Code not recognized — you can still create your account without one.
                </p>
              )}
            </div>
          )}
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
