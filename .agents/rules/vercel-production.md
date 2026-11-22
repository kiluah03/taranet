---
trigger: model_decision
description: "Apply when configuring Vercel deployments, environment variables, Next.js build settings, caching headers, analytics, or serverless/edge runtime constraints for TARA.NET."
---

# Vercel Production & Runtime Constraints

## 1. Origin & Environment Variables
- `appOrigin()` (`lib/auth/security.ts`) resolves origins in strict order:
  1. `APP_URL` (server-only override)
  2. `NEXT_PUBLIC_APP_URL`
  3. `https://${VERCEL_PROJECT_PRODUCTION_URL}` when `VERCEL_ENV === "production"`, otherwise `https://${VERCEL_URL}` for preview deployments.
- Production origin must be an exact HTTPS origin with no trailing slash or path (e.g., `https://www.taranet.nz`), matching Supabase **Site URL** and **Redirect URLs** (`https://www.taranet.nz/auth/callback**`).
- Required Vercel environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable or anon key)
  - `SUPABASE_SERVICE_ROLE_KEY` (Server-only secret; never `NEXT_PUBLIC_`)
  - `NEXT_PUBLIC_APP_URL` (or `APP_URL`)
- Optional integrations: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY`.
- Never configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, or social OAuth provider secrets in Vercel—provider secrets live exclusively in Supabase Auth settings.
- Changing any `NEXT_PUBLIC_*` variable on Vercel requires a fresh build/redeploy so client bundles pick up the updated value.

## 2. Caching, Headers & Dynamic Routes
- Authenticated pages (`/dashboard`, `/portal`, `/admin`, `/reset-password`) must export `export const dynamic = "force-dynamic"`.
- Protected responses from `proxy.ts` and all `/api/auth/*` and `/auth/*` Route Handlers must set `Cache-Control: private, no-store` (or `no-store`) so Vercel's CDN never caches session cookies or personalized HTML/JSON.
- Do not add static revalidation (`revalidate`) or CDN caching headers to user-scoped routes.

## 3. Runtime, Timeouts & Telemetry
- Target Node.js `>=22.13.0` (`package.json` `engines.node`). Keep Route Handlers and Server Actions on the default Node.js runtime; do not opt into `export const runtime = "edge"` unless Supabase SSR cookies, `crypto`, and auth tests are explicitly verified on Edge.
- Keep `AbortSignal.timeout(...)` on outbound network calls (12s for Supabase SSR auth calls, 5s for provider settings) so Vercel serverless functions fail fast rather than hanging until invocation timeout.
- Preserve `<Analytics />` from `@vercel/analytics/next` in `app/layout.tsx`.
- Keep `next.config.ts` compatible with standard `next build` on Vercel; do not couple builds to legacy `vite.config.ts` / `vinext` / `wrangler` tooling.
