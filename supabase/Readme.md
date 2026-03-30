# Supabase Database Documentation

This directory contains all database migration files and a consolidated reference schema for the CRM project.

---

## 📁 Directory Structure

```
supabase/
├── migrations/          # Incremental migration files (run in order)
│   ├── 20260328000000_core_auth.sql
│   ├── 20260328000001_crm_leads_meetings.sql
│   ├── 20260328000002_lead_management.sql
│   ├── 20260328000003_lead_details_expansion.sql
│   ├── 20260328000004_meeting_slots.sql
│   ├── 20260328000005_meeting_booking_expansion.sql
│   ├── 20260329000000_settings_and_branding.sql
│   └── 20260329000001_storage_fixes.sql
│
└── sql/
    └── currentstage.sql # Consolidated snapshot of the full current schema
```

---

## ⚡ Workflow Rules — MUST FOLLOW

> **Whenever you add a new migration file OR modify any table/column/policy in the `migrations/` folder, you MUST also update `sql/currentstage.sql` to reflect the current full schema state.**

### Steps to Follow for Any Schema Change

1. **Create a migration file** in `migrations/` with a timestamped name:
   ```
   YYYYMMDDHHMMSS_short_description.sql
   ```

2. **Apply the migration** to your Supabase project:
   - Via the Supabase Dashboard → SQL Editor
   - Or via Supabase CLI: `supabase db push`

3. **Update `sql/currentstage.sql`** to incorporate the changes:
   - Add new `CREATE TABLE` definitions
   - Update existing table definitions with new columns, constraints, or types
   - Update storage bucket configurations if changed
   - Remove definitions for anything that was dropped

4. **Commit both files together** in the same commit.

---

## 📋 Migration Index

| File | Date | Description |
|------|------|-------------|
| `20260328000000_core_auth.sql` | 2026-03-28 | Core auth setup, user types/statuses, RLS policies, storage bucket |
| `20260328000001_crm_leads_meetings.sql` | 2026-03-28 | Leads and meetings base tables |
| `20260328000002_lead_management.sql` | 2026-03-28 | Lead comments, call logs, follow-ups, payments |
| `20260328000003_lead_details_expansion.sql` | 2026-03-28 | Lead CRE/Sales assignment, additional lead fields |
| `20260328000004_meeting_slots.sql` | 2026-03-28 | Meeting slots lookup table |
| `20260328000005_meeting_booking_expansion.sql` | 2026-03-28 | Meeting booking additional fields |
| `20260329000000_settings_and_branding.sql` | 2026-03-29 | `theme_preference` on users, `site_settings` table, admin branding RLS |
| `20260329000001_storage_fixes.sql` | 2026-03-29 | Make `user-media` bucket public, granular storage RLS policies |

---

## 🗄️ `sql/currentstage.sql`

This file is a **read-only reference snapshot** of the full database schema at the current stage. It is **not meant to be run directly** (table order may not be valid for fresh execution). It exists so developers can:

- Quickly understand the full schema without reading all migration files
- Generate ERDs or review column definitions
- Validate what the current live database should look like

> **Keep this file up to date.** After every migration, update it to reflect the true current state.

---

## 🔐 Key Design Patterns

- **RLS is enabled** on all tables. Never disable it.
- **`public.is_admin()`** helper function is used for admin-only access checks.
- **Storage**: The `user-media` bucket is public for URL serving. Upload paths follow the pattern `profiles/{user_id}/*` for user media and `branding/*` for admin-managed assets.
- **Theme**: User theme preference is stored in `users.theme_preference` with a CHECK constraint of `('light', 'dark', 'system')`.
