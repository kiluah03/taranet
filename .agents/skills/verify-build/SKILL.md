---
name: verify-build
description: >-
  Use this skill to run TARA.NET's full verification suite: TypeScript typecheck,
  ESLint, automated auth security tests, Next.js production build, and a live
  browser smoke test via the Antigravity browser subagent.
---

# TARA.NET Build & Smoke-Test Verification

Run these checks in order before shipping changes, opening a pull request, or confirming a release candidate. Stop and fix failures at the earliest stage before proceeding.

## 1. TypeScript Typecheck
Run strict typechecking without emitting files:
```powershell
npx tsc --noEmit
```
Confirm exit code `0` with zero errors.

## 2. ESLint
Run the flat ESLint config (already configured to ignore `.next` and `dist`):
```powershell
npm run lint
```
Confirm zero errors (and review any new warnings in touched files).

## 3. Automated Auth Security Tests
Run the active Node test suite covering CSRF, origin checks, redirect allowlisting, cookies, and recovery flows:
```powershell
npm run test:auth
```
Confirm all tests in `tests/auth.test.mjs` pass.
*(Do not run legacy `tests/rendered-html.test.mjs`; it belongs to the dormant `vinext` starter.)*

## 4. Next.js Production Build
Run the full Next.js 16 production build:
```powershell
npm run build
```
Confirm zero compilation, type, static generation, or route-handler errors.

## 5. Browser Smoke Test (Antigravity `browser` Subagent)
1. Start the built app locally on port 3000 (`npm run start`, or `npm run dev` if verifying dev behavior).
   - **Windows note**: When delegating to the `browser` subagent or letting the user preview in a browser, start the local server outside the sandbox (`BypassSandbox: true`, `IsDaemon: true`) so `http://localhost:3000` is reachable, and stop it with `manage_task` (`kill`) once smoke checks finish.
2. Delegate to the `browser` subagent with a clear verification checklist:
   - Open `http://localhost:3000/` and confirm the landing page renders cleanly (hero, plans, footer) with zero console or uncaught page errors.
   - Open `http://localhost:3000/login` and `http://localhost:3000/forgot-password` and confirm forms render with no hydration warnings or console errors.
   - Navigate anonymously to `http://localhost:3000/dashboard` and confirm `proxy.ts` redirects to `/login?next=%2Fdashboard`.
   - Check `/api/auth/csrf` indirectly or confirm login submit button state behaves cleanly without throwing runtime errors.
3. Stop the background server once the browser subagent reports results.

## 6. Verification Summary
Report pass/fail results for each of the 5 stages (`tsc`, `lint`, `test:auth`, `build`, `browser smoke test`), including exact test counts and any console/network issues observed.
