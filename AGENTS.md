# TARA.NET — Project Engineering Guide

TARA.NET is a New Zealand fibre ISP web platform built for Filipino families in Aotearoa (public landing page, customer portal, and staff admin console). It runs on **Next.js 16 (App Router)**, **React 19**, **TypeScript 5.9 (`strict: true`)**, **Supabase Auth & Postgres**, and **Vercel** (`https://www.taranet.nz`, Supabase project ref `jddqtvzyjhhrupksgkmr`).

---

## Active Architecture Map

| Path | Responsibility |
| --- | --- |
| `proxy.ts` | Next.js 16 request proxy guarding `/dashboard/:path*`, `/portal/:path*`, `/admin/:path*` (session refresh + `getUser()` + `Cache-Control: private, no-store`). Do **not** add `middleware.ts`. |
| `app/page.tsx`, `app/ui/` | Public landing experience (`HomeExperience`, `LandingHeader`, `LandingFooter`, `Brand`, `DashboardShell`). |
| `app/globals.css`, `app/landing.css`, `app/portal.css` | Tailwind CSS v4 (`@import "tailwindcss";`) plus TARA.NET design-system custom properties and component styles. |
| `app/login/`, `app/forgot-password/`, `app/reset-password/` | Email/password sign-in, signup, resend confirmation, and PKCE password recovery pages. Social OAuth is intentionally disabled. |
| `app/portal/`, `app/dashboard/` | Authenticated customer portal (`/dashboard` re-exports `/portal`) and `createSupportTicket` Server Action (`app/portal/actions.ts`). |
| `app/admin/` | Staff operations console (`profile.role === "admin"`) and audited Server Actions (`app/admin/actions.ts`). |
| `app/api/auth/*`, `app/auth/*` | Server-mediated auth endpoints (`csrf`, `password`, `resend`, `forgot-password`, `reset-password`, disabled `oauth`, `callback`, `signout`). |
| `app/api/applications/route.ts` | Public fibre application submission endpoint (only caller of `getServiceClient()`). |
| `lib/supabase/auth-server.ts` | Server-only `@supabase/ssr` client (`createAuthServerClient(writable)`). |
| `lib/supabase/server.ts` | Server-only service-role client (`getServiceClient()`), restricted strictly to `/api/applications`. |
| `lib/auth/` | Client CSRF wrapper (`client.ts`), server CSRF check (`csrf.ts`), `appOrigin()`, `safeNext()`, `sessionCookieOptions()`, `authMessage()` (`security.ts`), provider status helper (`providers.ts`). |
| `supabase/migrations/` | Authoritative Postgres schema, triggers, and RLS policies (`YYYYMMDDNNNN_<slug>.sql`). |
| `tests/auth.test.mjs` | Automated Node test suite (`node:test`) covering CSRF, origin validation, redirects, cookie policy, password recovery, and auth routes. |
| `AUTHENTICATION.md` | Authoritative security and auth architecture reference. |

### Dormant Starter Files (Out of Scope)
This repository was originally scaffolded from `vinext-starter`. Do **not** edit, import, or build active features on these dormant files:
- `db/`, `drizzle/`, `drizzle.config.ts`, `examples/d1/` (unused Cloudflare D1 / Drizzle templates)
- `worker/`, `vite.config.ts`, `.openai/hosting.json`, `README.md` (legacy `vinext` / OpenAI Sites starter files)
- `app/chatgpt-auth.ts` (unused ChatGPT workspace auth helper)
- `tests/rendered-html.test.mjs` (legacy `vinext` loading skeleton test)

---

## Core Engineering Conventions

### TypeScript & Next.js 16
- Keep `tsconfig.json` `strict: true` clean (`npx tsc --noEmit` must pass with zero errors). Use the `@/*` path alias or consistent relative imports.
- Default to **Server Components**. Add `"use client"` only for interactive forms, `motion/react` animations (always respect `useReducedMotion()`), or browser APIs. Wrap `useSearchParams()` in `<Suspense>`.
- Export `export const dynamic = "force-dynamic"` on every page that reads cookies or calls `createAuthServerClient()`.
- Validate every Route Handler payload and Server Action input with **Zod v4** (`zod`).
- Never introduce `NextAuth`, client-side JWT handling, or `localStorage` session storage.

### Supabase SSR & RLS Guardrails
- **No browser Supabase client for auth**: All auth calls from Client Components must use `authPost()` (`lib/auth/client.ts`), which fetches `/api/auth/csrf` and sends `X-CSRF-Token` over same-origin requests.
- **Writable flag discipline**: Pass `createAuthServerClient(false)` in Server Components (read-only) and `createAuthServerClient(true)` in Route Handlers and Server Actions that mutate auth cookies.
- **Verify identity server-side**: Always call `supabase.auth.getUser()` before protected reads/writes. Never trust `getSession()`, client-supplied user IDs, or unverified emails.
- **Service-role isolation**: `getServiceClient()` (`SUPABASE_SERVICE_ROLE_KEY`) is **only** permitted for public application inserts in `app/api/applications/route.ts`. All portal and admin reads/writes must run under RLS via `createAuthServerClient`.
- **RLS & migrations**: Never modify applied migrations in `supabase/migrations/`. Every new table in `public` must enable RLS with least-privilege policies. All `security definer` functions must declare `set search_path = public`.

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js 16 local dev server (`http://localhost:3000`). |
| `npm run build` | Run Next.js production build. |
| `npm run lint` | Run ESLint 9 flat config (`eslint . --ignore-pattern dist --ignore-pattern .next`). |
| `npm run test:auth` | Run automated auth security tests (`node --test tests/auth.test.mjs`). |
| `npx tsc --noEmit` | Run strict TypeScript typecheck. |
| `npx supabase gen types typescript --project-id jddqtvzyjhhrupksgkmr > lib/supabase/database.types.ts` | Regenerate Supabase TypeScript database types (wire as `npm run db:types` when adding `database.types.ts`). |
