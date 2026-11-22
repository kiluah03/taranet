export const AFFILIATE_COOKIE = "taranet_ref";
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const AFFILIATE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

export function normalizeAffiliateCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return AFFILIATE_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function generateAffiliateCode(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(2)), b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${base || "TARA"}${suffix}`;
}
