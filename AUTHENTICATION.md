# Authentication repair and setup

## Current sign-in availability

Social signup and sign-in are intentionally disabled. Login and signup show email/password only, and `/api/auth/oauth` rejects initiation without contacting Supabase. The shared callback remains available for email confirmation. Provider setup below is future reference; re-enable the application UI and OAuth handler only after configuring the desired providers.

## Stack and findings

This application uses Next.js 16 and Supabase Auth (@supabase/ssr), not NextAuth. Supabase owns password hashing, auth.users, auth.identities, JWT signing, OAuth provider state validation, and verified-email identity linking. The public application profile is public.profiles, keyed by auth.users.id; db/schema.ts is unused for authentication.

Code defects repaired:
- Login instantiated the browser client during rendering without checking configuration. Exceptions and failed network requests could leave loading buttons stuck.
- Callback errors were redirected to /login but never displayed there. Provider denial, missing/expired codes, and exchange exceptions now produce feedback.
- Both redirect checks accepted protocol-relative external URLs. Destinations are now restricted to /dashboard, /portal, and /admin. /dashboard renders the existing protected portal.
- Auth requests used browser-readable session cookies. Credentials and OAuth initiation now run through server routes; both session and PKCE cookies are HttpOnly, SameSite=Lax, host-only, and Secure on HTTPS. HTTP is allowed only for localhost development. Tokens are never returned in API JSON or stored in localStorage. Existing support-ticket writes were moved to a server action to preserve authenticated access.
- The profile trigger could assign applications to an unverified email, and short referral-code prefixes could collide. The new migration waits for email_confirmed_at and uses the full UUID for new referral codes. Missing provider email is nullable; display name falls back to Customer. Auth identity linking remains Supabase-owned, never a privileged lookup by an untrusted email.
- Refresh previously ran on every route and could disrupt login/callback requests. Proxy now refreshes only protected pages, verifies users, preserves refreshed cookies on redirects, and prevents caching.

Live check on 2026-09-13: the configured Supabase project reports Google, GitHub, and Facebook DISABLED; email enabled; signup enabled; email confirmation required (mailer_autoconfirm=false). Disabled providers are a confirmed OAuth blocker. The OAuth start route now checks public provider settings and returns feedback without navigating away. Provider secrets, redirect allow lists, and deployed database migration state have not been verified. No credentials were tested against a real user account.

## Configuration verification — 2026-09-18

- Supabase project: `jddqtvzyjhhrupksgkmr`. The supplied publishable and secret keys are configured in Git-ignored `.env.local`, using the environment variable names consumed by the app. Secrets are not stored in this document or `.env.example`.
- Local `NEXT_PUBLIC_APP_URL` is `http://localhost:3000`. The previous production origin in the local file would reject localhost auth POSTs and send callbacks to production. Keep the production deployment origin configured separately as `https://taranet.vercel.app`.
- Live read-only checks: Auth settings and the database API returned HTTP 200. Email and signup are enabled; email confirmation is required. Google, GitHub, and Facebook remain disabled.
- The database API exposes the application tables and reports profile email as optional. This does not prove the profile trigger, RLS policies, or migration history match the repository; those still require SQL/dashboard verification. No migrations were applied during this check.
- Validation passed: all 12 authentication tests, `npx tsc --noEmit`, and `npm run build`. The development server was restarted. Local HTTP checks confirmed login renders, anonymous dashboard access redirects to login, missing callback codes return to localhost login, CSRF cookies are HttpOnly and SameSite=Lax, cross-origin credential requests return 403, and disabled Google login returns an explanatory error.
- Remaining hosted setup: verify migrations in filename order, Site URL and callback allow lists, password minimum/rate limits and SMTP; configure and enable the desired social providers with their provider-specific client IDs and secrets. The supplied project API keys cannot change hosted Auth configuration or execute migrations. Browser access failed, so these settings remain unverified.
- Real-user signup/confirmation, password login, successful OAuth, session refresh, support submission, and signout remain to be tested after hosted setup. No test users were created or confirmation emails sent.

## Required environment and database setup

1. Copy the keys documented in .env.example into the deployment environment. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must belong to the same project. The anon/publishable key is used for user authentication; the service-role key is only for application submissions and must remain server-only.
2. Set NEXT_PUBLIC_APP_URL to the exact browser origin, such as http://localhost:3000 or https://your-domain.example. Do not mix localhost and 127.0.0.1, change port mid-flow, or use an internal proxy hostname. HTTPS production origins enable Secure cookies. Rebuild after changing NEXT_PUBLIC values.
3. Apply supabase/migrations in filename order to the Supabase database, including 202609130001_auth_profile_mapping.sql. Test in staging first. The migration backfills profiles and verified application links, retaining existing roles and referral codes. It intentionally does not detach historical application assignments; audit previously linked unverified accounts before production rollout.
4. In Supabase Authentication settings, enable Email/password, email confirmation, the desired social providers, a password minimum of at least 8 characters, appropriate rate limits, and working SMTP for confirmation delivery.
5. Set Supabase Site URL to NEXT_PUBLIC_APP_URL. Add each app callback to Redirect URLs, including its next query: http://localhost:3000/auth/callback** for development and https://your-domain.example/auth/callback** for production. Keep the host exact. This app always supplies a validated next path. Confirm email in the same browser that initiated signup because the PKCE verifier is stored there.

## Provider consoles

There are TWO different callback destinations:
- Provider -> Supabase: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback (use the exact callback shown in the Supabase provider panel, including any custom auth domain).
- Supabase -> this application: NEXT_PUBLIC_APP_URL/auth/callback?next=%2Fdashboard.

Do not register /api/auth/callback/google or the app callback as the provider's Supabase callback. There are no NextAuth routes or secrets in this project.

| Provider | Configuration |
| --- | --- |
| Google | Create a Web application OAuth client in Google Auth Platform. Add the app origin under Authorized JavaScript origins and the Supabase callback under Authorized redirect URIs. Configure audience/test users and openid, email, profile scopes. Copy client ID and secret into the Supabase Google provider and enable it. |
| GitHub | Create an OAuth App in Developer Settings. Set homepage to the app origin and Authorization callback URL to the Supabase callback. Copy client ID and secret into Supabase GitHub settings and enable it. The app requests read:user and user:email so private primary emails can be obtained. |
| Facebook | Configure Facebook Login for the Meta app, add the Supabase callback under Valid OAuth Redirect URIs, and configure app domains and required public policy URLs. Enable email permission and grant any required access for public users; development mode is limited to app roles/testers. Copy App ID and App Secret into Supabase Facebook settings and enable it. |

Provider credentials listed as comments in .env.example are a configuration inventory. Setting them in Next.js alone does not enable hosted Supabase providers; configure them in Supabase. Never prefix provider secrets with NEXT_PUBLIC_.

Official setup: [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github), [Facebook](https://supabase.com/docs/guides/auth/social-login/auth-facebook).

## Linking and missing email

Supabase automatically links compatible identities with the same verified email to the existing auth user. Keep email confirmation enabled and retain Supabase's verification checks. See [identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking). Do not merge application users or copy roles on email match in application code. If Supabase refuses a link, the error prompts the user to sign in with the original method; accounts with different emails are not silently merged.

If Supabase accepts a provider without email, the profile trigger creates a profile by immutable user ID with nullable email. Such a user cannot claim applications by email. If the provider requires email and rejects the login, the banner asks the user to allow email access or use email login. Google/GitHub/Facebook must be configured with the documented email scopes.

## Request and session protection

- /api/auth/csrf issues a random token in JSON and a matching HttpOnly cookie. Credential/OAuth POST requests require X-CSRF-Token plus an exact Origin match. Signout uses a native form POST and requires an exact Origin match. Next.js supplies Origin/Host protection for server actions.
- OAuth is a top-level browser redirect; Supabase validates provider state and the app exchanges a one-time code using its server-stored PKCE verifier. Do not implement an independent code/token exchange or disable state validation.
- The browser only talks to same-origin application endpoints with credentials. No credentialed cross-origin CORS policy is necessary or enabled. Deploy the login UI and these endpoints on the same origin.
- Server code obtains verified users through getUser before protected reads or writes; Supabase RLS remains active. No service-role client is used for login, identity linking, or support requests.
- Supabase performs password hashing; the application sends passwords over HTTPS to Supabase without logging or storing them. Configure Supabase's rate limits and monitor abuse for the server-mediated endpoints.

## Validation

Run npm run test:auth, npx tsc --noEmit, and npm run build. Automated tests cover credential validation, confirmation, CSRF rejection, redirect attacks, cookie policy, provider errors, callbacks, and signout with isolated provider responses. They do not replace live OAuth testing.

After configuration and migration, verify in staging: signup and same-browser confirmation; valid and invalid passwords; Google/GitHub/Facebook acceptance and denial; expired callback and missing PKCE cookie; existing verified-email identity linking; private/missing provider email; refresh after reload; unauthenticated dashboard redirect; support-ticket submission; and signout. Inspect Set-Cookie for HttpOnly, SameSite=Lax and Secure on HTTPS and confirm no session tokens are exposed to browser JavaScript.
