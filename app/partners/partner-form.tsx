"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { authPost } from "../../lib/auth/client";

export function PartnerApplicationForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await authPost("/api/affiliates/apply", {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        preferredCode: String(form.get("preferredCode") ?? ""),
      });
      setMessage(result.message || "Your partner application has been received.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "The request timed out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="partner-success" role="status" aria-live="polite">
        <CheckCircle2 size={20} />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form className="partner-form" onSubmit={submit}>
      <label>
        Full name or community group
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="e.g. Maria Santos" />
      </label>
      <label>
        Email address
        <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.co.nz" />
      </label>
      <label>
        Preferred partner code <span className="partner-optional">(optional)</span>
        <input name="preferredCode" maxLength={32} autoComplete="off" spellCheck={false} placeholder="e.g. BARKADA5" />
      </label>
      {error && <p className="form-error" role="alert" aria-live="polite">{error}</p>}
      <button type="submit" className="landing-button landing-button-primary" disabled={busy}>
        {busy ? "Submitting…" : "Submit partner application"} <ArrowRight size={16} />
      </button>
    </form>
  );
}
