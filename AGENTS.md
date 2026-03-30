<!-- BEGIN:repo-agent-rules -->
# Repo Instructions

## Next.js 16

This project uses a Next.js version with breaking changes from older conventions. Before editing app routes, layouts, server actions, or client/server component boundaries, read the relevant guide in `node_modules/next/dist/docs/` and follow the current API behavior. Pay attention to deprecations and Cache Components rules.

## Supabase / Postgres

For any work that touches Supabase, Postgres, SQL, schema design, indexes, RLS, connection handling, or query performance, use the local skill at:

`.agents/skills/supabase-postgres-best-practices/SKILL.md`

Follow the skill workflow:

1. Read `SKILL.md` first.
2. Open only the specific `references/` files needed for the task.
3. Apply the most relevant rule category:
   - `query-` for query performance
   - `conn-` for connection management
   - `security-` for RLS and access control
   - `schema-` for schema design
   - `lock-` for concurrency and locking
   - `data-` for data access patterns
   - `monitor-` for diagnostics
   - `advanced-` for specialized Postgres features

When reviewing or changing database code, prefer concrete improvements over generic advice. Look for missing indexes, avoid unnecessary scans, keep RLS readable, and verify query shape before changing application code.
<!-- END:repo-agent-rules -->
