"use client";
export async function authPost(path: string, body: unknown): Promise<{ redirect?: string; message?: string }> {
  const signal = AbortSignal.timeout(20000);
  const csrf = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store", signal });
  if (!csrf.ok) throw new Error("Sign-in is unavailable. Please try again.");
  const { token } = await csrf.json();
  const response = await fetch(path, { method: "POST", credentials: "same-origin", signal,
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
