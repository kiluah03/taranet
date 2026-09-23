"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authPost } from "../../lib/auth/client";

export function PasswordForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) { setMessage("Your passwords do not match."); return; }
    setBusy(true);
    setMessage("");
    try {
      const result = await authPost("/api/auth/reset-password", { password, confirmPassword });
      setMessage(result.message || "Your password has been updated.");
      setDone(true);
    } catch (error) {
      setMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
    } finally { setBusy(false); }
  }
  return <>
    {done ? <>
      <div className="auth-message" role="status">{message}</div>
      <Link href="/login" className="button full">Sign in</Link>
    </> : <>
      <form onSubmit={submit}>
        <label>New password<input name="password" type="password" required minLength={8} maxLength={1024} autoComplete="new-password" /></label>
        <label>Confirm new password<input name="confirmPassword" type="password" required minLength={8} maxLength={1024} autoComplete="new-password" /></label>
        {message && <div className="auth-message" role="alert" aria-live="polite">{message}</div>}
        <button className="button full" disabled={busy}>{busy ? "Updating password..." : "Update password"}</button>
      </form>
      <Link href="/forgot-password" className="auth-home">Request a new reset link</Link>
    </>}
  </>;
}
