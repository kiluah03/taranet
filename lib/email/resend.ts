// Server-only transactional email via the Resend HTTP API (no SDK dependency).
// Best-effort: never throws and never blocks the caller's primary action.

export const DEFAULT_FROM = "TaraNet NZ <no-reply@taranet.nz>";

export function emailFrom() {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

export function adminNotifyEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || "hello@taranet.nz";
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));
}

// m***@gmail.com — never disclose a referred customer's full address to a partner.
export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.trim().split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export async function sendEmail(input: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
  try {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key || !input.to) return false;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: emailFrom(), to: [input.to], subject: input.subject, text: input.text, html: input.html }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
