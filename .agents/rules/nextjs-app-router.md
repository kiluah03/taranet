---
trigger: glob
globs: "app/**, components/**, proxy.ts"
description: "Next.js 16 App Router, React 19, proxy.ts, Server Actions, and styling conventions for TARA.NET."
---

# Next.js 16 App Router & UI Conventions

## 1. Request Proxy (`proxy.ts`)
- TARA.NET uses Next.js 16's root `proxy.ts` export (`export async function proxy(request: NextRequest)`). Do **not** create `middleware.ts`.
- Keep `config.matcher` scoped strictly to protected routes (`["/dashboard/:path*", "/portal/:path*", "/admin/:path*"]`) so login, callback, and public landing requests are never disrupted.
- Always set `Cache-Control: private, no-store` on both passthrough and redirect responses, and copy refreshed cookies onto redirect responses before returning.
- Always authenticate via `supabase.auth.getUser()` with `AbortSignal.timeout(12000)` and `sessionCookieOptions()`.

## 2. Server Components, Client Components & Dynamic Rendering
- Default to **Server Components**. Add `"use client"` only when using React state/effects, event handlers, `motion/react`, or browser APIs.
- Export `export const dynamic = "force-dynamic"` on any route that reads cookies, calls `createAuthServerClient()`, or renders user-specific data (`/dashboard`, `/portal`, `/admin`, `/reset-password`).
- Wrap any Client Component using `useSearchParams()` inside a `<Suspense>` boundary (`app/login/page.tsx`, `app/forgot-password/page.tsx`).
- Never import `app/chatgpt-auth.ts` (dormant starter file) in TARA.NET routes.

## 3. Auth Calls & Server Actions
- Client Components must **never** import `@supabase/supabase-js` or `@supabase/ssr`, read auth tokens, or touch `localStorage` for sessions.
- Use `authPost()` from `lib/auth/client.ts` for all client-initiated auth POSTs (handles `/api/auth/csrf`, `X-CSRF-Token`, `credentials: "same-origin"`, and request timeout).
- Signout must remain a native same-origin `<form action="/auth/signout" method="post">` request.
- Validate all Route Handler bodies and Server Action inputs with **Zod v4** (`zod`).
- Every Server Action in `app/admin/actions.ts` must:
  1. Call `requireAdmin()` (verified via `createAuthServerClient(true)` + `getUser()` + `profiles.role === "admin"`).
  2. Perform database writes under RLS (never via `getServiceClient()`).
  3. Record an `audit_events` entry with `actor_id: user.id`.
  4. Call `revalidatePath("/admin")`.

## 4. UI Components & Styling
- Place shared UI primitives in `app/ui/` (or `components/` if introduced in the future). Keep page-local interactive islands colocated (e.g., `app/portal/portal-actions.tsx`, `app/reset-password/password-form.tsx`).
- `app/layout.tsx` loads `Geist` (`--font-geist`), `Geist_Mono` (`--font-mono`), `@vercel/analytics/next` (`<Analytics />`), and three stylesheets: `globals.css` (`@import "tailwindcss";` + portal/dashboard base tokens), `portal.css`, and `landing.css`.
- Preserve TARA.NET's existing CSS custom properties (`--ph-blue`, `--ph-blue-dark`, `--ph-red`, `--sun-gold`, `--fern`, `--ink`, `--gold`, `--coral`, `--line`) and avoid global CSS resets that break landing or portal layouts.
- When animating with `motion/react`, respect `useReducedMotion()` and CSS `@media (prefers-reduced-motion: reduce)`.
- Use `lucide-react` for icons and `next/image` with explicit dimensions for raster assets in `public/`.
