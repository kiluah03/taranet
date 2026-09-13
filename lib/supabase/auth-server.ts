import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sessionCookieOptions } from "../auth/security";

export async function createAuthServerClient(writable = false) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase authentication is not configured.");
  return createServerClient(url, key, {
    cookieOptions: sessionCookieOptions(),
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        // Server Components read sessions; proxy refreshes them. Mutations must write successfully.
        if (!writable) return;
        values.forEach(({ name, value, options }) => cookieStore.set(name, value, { ...options, ...sessionCookieOptions() }));
      },
    },
  });
}
