export function safeNext(value: string | null | undefined) {
  // Only known protected destinations; reject URL parser ambiguities.
  if (!value || /[\\\x00-\x20]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://local.invalid");
    if (!value.startsWith("/") || url.origin !== "https://local.invalid") return "/dashboard";
    return ["/dashboard", "/portal", "/admin"].includes(url.pathname) ? url.pathname + url.search + url.hash : "/dashboard";
  } catch { return "/dashboard"; }
}

export function appOrigin() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("Authentication URL is not configured.");
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("Authentication URL must be an HTTPS origin (HTTP localhost is allowed).");
  }
  return url.origin;
}

export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: appOrigin().startsWith("https:"), path: "/" };
}

export const csrfCookie = "tara-csrf";
export function validCsrf(request: Request, token: string | undefined) {
  return request.headers.get("origin") === appOrigin() &&
    request.headers.get("sec-fetch-site") !== "cross-site" &&
    !!token && /^[a-f0-9]{64}$/.test(token) && request.headers.get("x-csrf-token") === token;
}

export function authMessage(code: string | undefined | null): string {
  switch (code) {
    case "invalid_credentials": return "Invalid email or password.";
    case "email_not_confirmed": return "Confirm your email before signing in.";
    case "access_denied": return "Social provider access denied. Please try again.";
    case "provider_disabled": case "validation_failed": return "This sign-in provider is unavailable. Try email or another provider.";
    case "email_not_found": case "email_address_not_authorized": return "The provider did not share an email. Allow email access or sign in with email.";
    case "identity_already_exists": case "email_exists": case "user_already_exists": return "Sign in to your existing account using its original method. Provider accounts can only be linked after ownership is verified.";
    case "weak_password": return "Choose a stronger password with at least 8 characters.";
    case "over_request_rate_limit": case "over_email_send_rate_limit": return "Too many attempts. Please wait before trying again.";
    case "confirmation": case "callback": return "The sign-in link expired or could not be verified. Start again in this browser.";
    default: return "Sign-in is temporarily unavailable. Please try again.";
  }
}
