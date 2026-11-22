---
trigger: glob
globs: "supabase/**, lib/supabase/**, lib/auth/**"
description: "Supabase SSR session handling, Row Level Security (RLS), secret isolation, and typed query guardrails for TARA.NET."
---

# Supabase & Auth Security Guardrails

Reference `AUTHENTICATION.md` for full auth design rationale. Never weaken any control below.

## 1. Client Separation & Secret Isolation
- **`createAuthServerClient(writable = false)` (`lib/supabase/auth-server.ts`)**: Use for all authenticated user and staff operations under RLS.
  - Pass `writable = false` in Server Components (read-only; `proxy.ts` handles refresh).
  - Pass `writable = true` in Route Handlers and Server Actions that sign in, sign out, exchange PKCE codes, or update passwords.
- **`getServiceClient()` (`lib/supabase/server.ts`)**: Uses `SUPABASE_SERVICE_ROLE_KEY` with `persistSession: false`. Restricted strictly to unauthenticated public server endpoints (`app/api/applications/route.ts`, `app/api/affiliates/validate/route.ts`, `app/api/affiliates/apply/route.ts`, and non-blocking affiliate referral attribution in `app/api/auth/password/route.ts`). Never use it for authentication, identity linking, customer portal reads/writes, or admin actions.
- **Secret Hygiene**: Never expose `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or OAuth provider secrets in client code, API JSON, logs, or `NEXT_PUBLIC_*` variables.

## 2. Session, CSRF & Redirect Invariants
- Always verify identity on the server with `supabase.auth.getUser()`. Never trust `getSession()`, client-supplied user IDs, or unverified emails.
- Preserve cookie hardening via `sessionCookieOptions()` (`httpOnly: true`, `sameSite: "lax"`, `secure: appOrigin().startsWith("https:")`, `path: "/"`).
- `appOrigin()` must derive the origin strictly from trusted env vars (`APP_URL` -> `NEXT_PUBLIC_APP_URL` -> `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`), **never** from client-controlled request `Host` or `Origin` headers.
- All JSON auth POST routes must enforce `await checkCsrf(request)` (`tara-csrf` HttpOnly cookie + `X-CSRF-Token` + exact `Origin` + `Sec-Fetch-Site !== "cross-site"`).
- Validate every post-auth redirect target with `safeNext()` (strict allowlist: `/dashboard`, `/portal`, `/admin`, `/reset-password`).
- Preserve anti-enumeration responses on signup, resend confirmation, and forgot-password routes. Keep `/api/auth/oauth` disabled (`503`) unless social providers are configured and explicitly re-enabled.
- Include `Cache-Control: no-store` on auth API responses and `AbortSignal.timeout(...)` on outbound Supabase fetches.

## 3. Database Migrations & RLS Standards
- **Append-Only Migrations**: Never edit already-applied files in `supabase/migrations/`. Always create a new timestamped migration (`YYYYMMDDNNNN_<description>.sql`).
- **Mandatory RLS**: Every table in `public` must execute `alter table public.<table> enable row level security;` with explicit least-privilege policies for `select`, `insert`, `update`, and `delete`.
- **`security definer` Hygiene**: Every `security definer` function (e.g., `public.is_staff()`, `public.handle_new_user()`) must explicitly set `set search_path = public`.
- **Verified Identity Linking**: Never assign `public.applications.user_id` by email match unless `auth.users.email_confirmed_at is not null`. Preserve nullable `public.profiles.email` and full-UUID `referral_code` generation.
- **Prevent Role Escalation**: Keep `profiles` customer self-update policy constrained with `with check (id = auth.uid() and role = 'customer')`. Only staff (`public.is_staff()`) may update roles or staff-managed records.

## 4. Typed Queries
- Whenever `lib/supabase/database.types.ts` is present, parameterize `createServerClient<Database>` and `createClient<Database>` with the generated `Database` type.
- Prefer explicit column selections over `select("*")` for new queries and avoid untyped `as` casts.
- Run `npm run test:auth` after any change in `lib/auth/`, `lib/supabase/`, `proxy.ts`, or `app/api/auth/*`.
