export async function providerEnabled(provider: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Authentication is not configured.");
  const response = await fetch(url + "/auth/v1/settings", {
    headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Authentication settings are unavailable.");
  const settings = await response.json();
  return settings.external?.[provider] === true;
}
