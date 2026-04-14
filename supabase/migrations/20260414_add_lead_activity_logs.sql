-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add lead_activity_logs table
-- Purpose:   Persistent, queryable audit trail for all significant actions
--            performed on lead records (create, assign, status change, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_activity_logs (
  id          uuid          NOT NULL DEFAULT gen_random_uuid(),
  lead_id     uuid          NOT NULL,
  actor_id    uuid,
  action      text          NOT NULL,
  metadata    jsonb         NOT NULL DEFAULT '{}',
  created_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT lead_activity_logs_pkey PRIMARY KEY (id),

  -- Cascade: when a lead is deleted, its activity log is deleted too.
  CONSTRAINT lead_activity_logs_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE,

  -- Nullify: if the acting user is deleted (e.g. sentinel cleanup),
  -- preserve the log row but clear the actor reference.
  CONSTRAINT lead_activity_logs_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Primary access pattern: "show me all activity for this lead"
CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_lead_id
  ON public.lead_activity_logs(lead_id, created_at DESC);

-- Secondary pattern: "show me all actions by this user" (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_actor_id
  ON public.lead_activity_logs(actor_id);

-- Secondary pattern: filter by action type (e.g. "show me all sales")
CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_action
  ON public.lead_activity_logs(action);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Logs are read-only for app users. Writes are done via the service-role
-- admin client from server actions only.

ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs. Operators can only read logs for leads assigned to them.
CREATE POLICY "lead_activity_logs_select"
  ON public.lead_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.type = 'Admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_activity_logs.lead_id
        AND (l.cre_id = auth.uid() OR l.sales_executive_id = auth.uid())
    )
  );

-- No INSERT/UPDATE/DELETE via RLS — all writes go through service-role client.
