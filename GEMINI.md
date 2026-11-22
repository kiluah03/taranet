# TARA.NET — Antigravity Workspace Instructions

Follow `AGENTS.md` at the repository root as the canonical source of truth for TARA.NET's architecture, active vs. dormant files, Next.js 16 conventions, Supabase SSR/RLS guardrails, and CLI commands.

## Workspace Rules & Progressive Skills
- **Scoped Rules (`.agents/rules/`)**: Contextual guardrails for Next.js App Router (`nextjs-app-router.md`), Supabase & Auth security (`supabase-security.md`), and Vercel production deployments (`vercel-production.md`) load automatically by glob or task relevance.
- **Database Migrations & Types**: Load `.agents/skills/supabase-migration/SKILL.md` whenever creating or reviewing SQL migrations, RLS policies, triggers, or regenerating TypeScript database types.
- **Full Build & Smoke Verification**: Load `.agents/skills/verify-build/SKILL.md` before finishing non-trivial changes or shipping releases to run `tsc`, `lint`, `test:auth`, `next build`, and browser verification via the `browser` subagent.
- **Connected Plugins & MCP**: Official **Supabase** and **Vercel** Antigravity plugins are available for read/inspect workflows; `.agents/mcp_config.json` stores the secret-free workspace MCP template. Never expose or commit secrets from `.env.local`.
