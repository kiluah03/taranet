---
name: supabase-migration
description: >-
  Use this skill when creating or modifying TARA.NET Postgres schema, triggers,
  or Row Level Security (RLS) policies, applying Supabase migrations locally or
  remotely, or regenerating TypeScript database types.
---

# Supabase Migration & Type Generation Workflow

Follow this runbook for all schema, trigger, and RLS changes in TARA.NET (hosted Supabase project ref: `jddqtvzyjhhrupksgkmr`).

## 1. Inspect Current Schema & Conventions
1. List and read existing migrations in `supabase/migrations/` in filename order (`YYYYMMDDNNNN_<slug>.sql`).
2. Check existing enums (`app_role`, `application_status`, `ticket_status`), helper functions (`public.is_staff()`, `public.handle_new_user()`), and RLS policies so new SQL fits the established model.
3. Never edit an already-applied migration file.

## 2. Author the New Migration
1. Create a new file `supabase/migrations/<YYYYMMDDNNNN>_<short_slug>.sql` with a strictly newer timestamp prefix than the latest migration.
2. Verify the SQL follows every security guardrail:
   - Enable RLS on every newly created `public` table: `alter table public.<table> enable row level security;`
   - Add explicit least-privilege policies for `select`, `insert`, `update`, and `delete`.
   - Declare `set search_path = public` on every `security definer` function.
   - Never link customer records (such as `applications`) by unverified email; gate on `email_confirmed_at is not null`.
   - Never allow customers to escalate `public.profiles.role`.
   - Avoid hardcoding user PII or production credentials in new migrations.

## 3. Apply & Test the Migration
- **Local Supabase (when local CLI + Docker are initialized)**:
  1. Run `npx supabase db reset` (or `npx supabase migration up`) to verify clean replay from `202607240001_initial.sql` through the new migration.
- **Remote Hosted Project (`jddqtvzyjhhrupksgkmr`)**:
  1. **Stop and request explicit user confirmation** before applying any write migration to the remote database.
  2. Preview first with `npx supabase db push --dry-run` (or inspect remote migration history via the Supabase MCP `list_migrations` tool).
  3. After approval, apply via `npx supabase db push` or the Supabase MCP `apply_migration` tool.
  4. Check security advisors (via Supabase MCP `get_advisors` with type `security`) to verify no table was left without RLS or with unsafe function `search_path`.

## 4. Regenerate TypeScript Database Types
1. Generate updated types from the hosted project (or local database with `--local`):
   ```powershell
   npx supabase gen types typescript --project-id jddqtvzyjhhrupksgkmr > lib/supabase/database.types.ts
   ```
   *(If `npm run db:types` has been added to `package.json`, run `npm run db:types` instead.)*
2. Alternatively, generate types via the Supabase MCP `generate_typescript_types` tool and write the output to `lib/supabase/database.types.ts`.
3. Verify `lib/supabase/auth-server.ts`, `lib/supabase/server.ts`, and affected queries compile cleanly.

## 5. Final Verification
1. Run `npx tsc --noEmit`.
2. Run `npm run test:auth`.
3. Run `npm run build`.
4. Report the migration filename, tables/policies changed, advisor check result, and command outcomes.
