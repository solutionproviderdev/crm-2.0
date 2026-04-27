# Edge Function Deployment Guide
## Transform Studio — `transform-process-zone` & `transform-composite`

---

## Prerequisites

Before deploying, ensure you have:
- Node.js ≥ 18 installed
- A Supabase account with a project already created
- Your Supabase project's **Project Reference ID** (visible in Project Settings → General)

---

## Step 1 — Install the Supabase CLI

```bash
npm install -g supabase
```

Verify it installed correctly:

```bash
supabase --version
```

---

## Step 2 — Log In to Supabase

```bash
supabase login
```

This opens a browser window. Authenticate with your Supabase account.

---

## Step 3 — Link to Your Remote Project

Run this from the root of the CRM project (`/Users/mac/DEV/crm-2.0`):

```bash
supabase link --project-ref <YOUR_PROJECT_REF_ID>
```

> **Where to find your Project Ref ID:**
> Supabase Dashboard → Your Project → Project Settings → General → **Reference ID**
> Example: `abcdefghijklmnopqrst`

You will be prompted for your **database password** during linking.

---

## Step 4 — Push the Database Migration

This applies the Transform Studio tables, RLS policies, storage buckets, and seed presets:

```bash
supabase db push
```

> The `20260423_add_transform_studio.sql` file will be applied.
> The `20260423_001_transform_studio_cron.sql` (watchdog) is **separate** — see Step 7.

---

## Step 5 — Set Edge Function Secrets

These environment variables are **only available to Edge Functions at runtime**, separate from `.env.local`:

```bash
supabase secrets set SUPABASE_URL=https://<YOUR_PROJECT_REF_ID>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

> **Where to find your Service Role Key:**
> Supabase Dashboard → Project Settings → API → **service_role** key (secret)

---

## Step 6 — Deploy Both Edge Functions

```bash
supabase functions deploy transform-process-zone
supabase functions deploy transform-composite
```

Verify they appear in the dashboard:
- Supabase Dashboard → Edge Functions → You should see both listed

---

## Step 7 — (Optional) Enable pg_cron Watchdog

This step retries jobs stuck in `processing` for more than 5 minutes.

### 7a — Enable Extensions

In Supabase Dashboard → Database → Extensions:
1. Enable **pg_cron**
2. Enable **pg_net**

### 7b — Set Config Parameters

In Supabase Dashboard → Database → Configuration, add:

| Parameter | Value |
|---|---|
| `app.supabase_url` | `https://<YOUR_PROJECT_REF_ID>.supabase.co` |
| `app.service_role_key` | `<YOUR_SERVICE_ROLE_KEY>` |

### 7c — Run the Cron Migration

Open Supabase Dashboard → SQL Editor, then open and run:

```
supabase/migrations/20260423_001_transform_studio_cron.sql
```

Or copy-paste its contents directly into the SQL Editor and click **Run**.

Confirm it worked:
- Supabase Dashboard → Database → Cron Jobs → You should see `transform-retry-stuck-jobs`

---

## Step 8 — Enable Supabase Realtime

In Supabase Dashboard → Database → Replication:
1. Enable Realtime on **`transform_jobs`** table
2. Enable Realtime on **`transform_generation_steps`** table

This powers the live progress tracker in the browser.

---

## Step 9 — Update `.env.local`

Add this variable to `/Users/mac/DEV/crm-2.0/.env.local`:

```bash
TRANSFORM_EDGE_FUNCTION_URL=https://<YOUR_PROJECT_REF_ID>.supabase.co/functions/v1
```

---

## Verification Checklist

| Check | Where |
|---|---|
| ✅ Both functions listed | Supabase → Edge Functions |
| ✅ 5 new tables visible | Supabase → Table Editor |
| ✅ 3 seed presets present | `transform_presets` table |
| ✅ 2 storage buckets | Supabase → Storage |
| ✅ Cron job listed (if enabled) | Supabase → Database → Cron Jobs |
| ✅ Realtime on both tables | Supabase → Database → Replication |
