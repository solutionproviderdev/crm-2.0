-- =============================================================================
-- CRM 2.0 — Database Migration (Run in Supabase SQL Editor)
-- 
-- Run this ENTIRE script in one go in the Supabase SQL editor.
-- It is idempotent (safe to re-run — uses IF NOT EXISTS and OR REPLACE).
--
-- Sections:
-- 1. Performance Indexes
-- 2. Computed Finance View (replaces stale JSONB totals)
-- 3. Atomic RPCs (complete_meeting, mark_as_sold, expire_missed_follow_ups)
-- 4. RLS Policies (role-based data access)
-- 5. Realtime REPLICA IDENTITY FULL
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- leads table — most frequently filtered/sorted columns
CREATE INDEX IF NOT EXISTS idx_leads_status          ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_cre_id          ON leads(cre_id);
CREATE INDEX IF NOT EXISTS idx_leads_sales_exec_id   ON leads(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at      ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source          ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_composite_filter ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_cid             ON leads(cid);

-- lead_meetings — critical for calendar/slot queries
CREATE INDEX IF NOT EXISTS idx_meetings_date         ON lead_meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id      ON lead_meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_sales_exec   ON lead_meetings(sales_executive_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status       ON lead_meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date_slot    ON lead_meetings(date, slot);

-- lead_follow_ups — for reminders page range queries
CREATE INDEX IF NOT EXISTS idx_follow_ups_time       ON lead_follow_ups(time);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id    ON lead_follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status     ON lead_follow_ups(status);

-- lead_payments — for finance summary queries
CREATE INDEX IF NOT EXISTS idx_payments_lead_id      ON lead_payments(lead_id);

-- lead_comments — for activity feed
CREATE INDEX IF NOT EXISTS idx_comments_lead_id      ON lead_comments(lead_id);

-- Messages — for chat queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_id      ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. COMPUTED FINANCE VIEW
-- Replaces the stale JSONB `finance.totalPayment` and `finance.totalDue`.
-- Lead detail pages query this view to get accurate live payment totals.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW lead_finance_computed AS
SELECT
  l.id                                                 AS lead_id,
  COALESCE((l.finance->>'projectValue')::numeric, 0)   AS project_value,
  COALESCE((l.finance->>'soldAmount')::numeric, 0)     AS sold_amount,
  (l.finance->>'soldDate')                             AS sold_date,
  COALESCE((l.finance->>'clientsBudget')::numeric, 0)  AS clients_budget,
  COALESCE(SUM(p.amount), 0)                           AS total_payment,
  GREATEST(
    COALESCE((l.finance->>'soldAmount')::numeric, 0) - COALESCE(SUM(p.amount), 0),
    0
  )                                                    AS total_due
FROM leads l
LEFT JOIN lead_payments p ON p.lead_id = l.id
GROUP BY l.id, l.finance;

-- Grant access to the service role (used by admin client)
GRANT SELECT ON lead_finance_computed TO service_role;
GRANT SELECT ON lead_finance_computed TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ATOMIC RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. complete_meeting
-- Atomically: marks meeting complete, updates lead status + finance,
-- schedules next follow-up, and logs a comment.
-- This replaces the multiple sequential writes in the completeMeeting action.
CREATE OR REPLACE FUNCTION complete_meeting(
  p_meeting_id       uuid,
  p_lead_id          uuid,
  p_project_value    numeric,
  p_clients_budget   numeric,
  p_follow_up_time   timestamptz,
  p_comment          text,
  p_user_id          uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the meeting status
  UPDATE lead_meetings
  SET status = 'Complete',
      updated_at = NOW()
  WHERE id = p_meeting_id;

  -- Update lead status and finance snapshot
  UPDATE leads
  SET
    status      = 'Meeting Complete',
    finance     = finance::jsonb || jsonb_build_object(
                    'projectValue',  p_project_value,
                    'clientsBudget', p_clients_budget
                  ),
    updated_at  = NOW()
  WHERE id = p_lead_id;

  -- Log the completion comment
  INSERT INTO lead_comments (lead_id, comment_by, comment)
  VALUES (p_lead_id, p_user_id, p_comment);

  -- Schedule next follow-up
  INSERT INTO lead_follow_ups (lead_id, time, status, type, assigned_to)
  VALUES (p_lead_id, p_follow_up_time, 'Pending', 'Call', p_user_id);
END;
$$;


-- 3b. mark_as_sold
-- Atomically: marks meeting as Sold, updates lead finance + status,
-- records initial payment, logs comment, schedules follow-up.
CREATE OR REPLACE FUNCTION mark_as_sold(
  p_meeting_id         uuid,
  p_lead_id            uuid,
  p_project_value      numeric,
  p_sold_amount        numeric,
  p_clients_budget     numeric,
  p_sold_date          date,
  p_payment_amount     numeric,
  p_payment_method     text,
  p_payment_note       text,
  p_next_follow_up_time timestamptz,
  p_comment            text,
  p_user_id            uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update meeting status to Sold
  UPDATE lead_meetings
  SET status = 'Sold',
      updated_at = NOW()
  WHERE id = p_meeting_id;

  -- Update lead status and finance snapshot
  UPDATE leads
  SET
    status     = 'Sold',
    finance    = finance::jsonb || jsonb_build_object(
                   'projectValue',  p_project_value,
                   'soldAmount',    p_sold_amount,
                   'clientsBudget', p_clients_budget,
                   'soldDate',      p_sold_date::text
                 ),
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- Insert initial payment record (only if amount > 0)
  IF p_payment_amount > 0 THEN
    INSERT INTO lead_payments (lead_id, amount, payment_method, note, payment_date, recorded_by)
    VALUES (p_lead_id, p_payment_amount, p_payment_method, p_payment_note, p_sold_date, p_user_id);
  END IF;

  -- Log the sale comment
  INSERT INTO lead_comments (lead_id, comment_by, comment)
  VALUES (p_lead_id, p_user_id, p_comment);

  -- Schedule next follow-up
  INSERT INTO lead_follow_ups (lead_id, time, status, type, assigned_to)
  VALUES (p_lead_id, p_next_follow_up_time, 'Pending', 'Call', p_user_id);
END;
$$;


-- 3c. expire_missed_follow_ups
-- Marks all follow-ups that are still 'Pending' but have passed their due time as 'Missed'.
-- Schedule this via pg_cron to run every 15 minutes:
--   SELECT cron.schedule('expire-follow-ups', '*/15 * * * *', 'SELECT expire_missed_follow_ups()');
CREATE OR REPLACE FUNCTION expire_missed_follow_ups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lead_follow_ups
  SET status = 'Missed'
  WHERE status = 'Pending'
    AND time < NOW();
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
-- 
-- Strategy: Role-based access where users see only their own assigned data.
-- Admins see everything. Service role bypasses all RLS.
--
-- User types: 'Admin', 'CRE', 'Sales', 'Other'
--
-- IMPORTANT: Enable RLS on each table first if not already done:

ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_meetings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_call_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings   ENABLE ROW LEVEL SECURITY;


-- Helper function: get current user's type from the users table
CREATE OR REPLACE FUNCTION get_current_user_type()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT type FROM users WHERE id = auth.uid() LIMIT 1;
$$;


-- ── leads table ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS leads_select ON leads;
DROP POLICY IF EXISTS leads_insert ON leads;
DROP POLICY IF EXISTS leads_update ON leads;
DROP POLICY IF EXISTS leads_delete ON leads;

-- CREs see leads assigned to them; Sales see leads where they're the executive; Admins see all
CREATE POLICY leads_select ON leads
  FOR SELECT TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR cre_id = auth.uid()
    OR sales_executive_id = auth.uid()
  );

-- CREs can create new leads
CREATE POLICY leads_insert ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_type() IN ('Admin', 'CRE')
  );

-- Admins and CREs can update; Sales can only update their own assigned fields
CREATE POLICY leads_update ON leads
  FOR UPDATE TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR cre_id = auth.uid()
    OR sales_executive_id = auth.uid()
  );

-- Only admins can delete leads
CREATE POLICY leads_delete ON leads
  FOR DELETE TO authenticated
  USING (get_current_user_type() = 'Admin');


-- ── lead_meetings ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS meetings_select ON lead_meetings;
DROP POLICY IF EXISTS meetings_insert ON lead_meetings;
DROP POLICY IF EXISTS meetings_update ON lead_meetings;
DROP POLICY IF EXISTS meetings_delete ON lead_meetings;

CREATE POLICY meetings_select ON lead_meetings
  FOR SELECT TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR sales_executive_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_meetings.lead_id
        AND (leads.cre_id = auth.uid() OR leads.sales_executive_id = auth.uid())
    )
  );

CREATE POLICY meetings_insert ON lead_meetings
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_type() IN ('Admin', 'CRE', 'Sales'));

CREATE POLICY meetings_update ON lead_meetings
  FOR UPDATE TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR sales_executive_id = auth.uid()
  );

CREATE POLICY meetings_delete ON lead_meetings
  FOR DELETE TO authenticated
  USING (get_current_user_type() = 'Admin');


-- ── lead_follow_ups ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS follow_ups_select ON lead_follow_ups;
DROP POLICY IF EXISTS follow_ups_insert ON lead_follow_ups;
DROP POLICY IF EXISTS follow_ups_update ON lead_follow_ups;

CREATE POLICY follow_ups_select ON lead_follow_ups
  FOR SELECT TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_follow_ups.lead_id
        AND (leads.cre_id = auth.uid() OR leads.sales_executive_id = auth.uid())
    )
  );

CREATE POLICY follow_ups_insert ON lead_follow_ups
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_type() IN ('Admin', 'CRE', 'Sales'));

CREATE POLICY follow_ups_update ON lead_follow_ups
  FOR UPDATE TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR assigned_to = auth.uid()
  );


-- ── lead_comments ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS comments_select ON lead_comments;
DROP POLICY IF EXISTS comments_insert ON lead_comments;

CREATE POLICY comments_select ON lead_comments
  FOR SELECT TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_comments.lead_id
        AND (leads.cre_id = auth.uid() OR leads.sales_executive_id = auth.uid())
    )
  );

CREATE POLICY comments_insert ON lead_comments
  FOR INSERT TO authenticated
  WITH CHECK (comment_by = auth.uid());


-- ── lead_payments ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS payments_select ON lead_payments;
DROP POLICY IF EXISTS payments_insert ON lead_payments;

CREATE POLICY payments_select ON lead_payments
  FOR SELECT TO authenticated
  USING (
    get_current_user_type() = 'Admin'
    OR EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_payments.lead_id
        AND (leads.cre_id = auth.uid() OR leads.sales_executive_id = auth.uid())
    )
  );

CREATE POLICY payments_insert ON lead_payments
  FOR INSERT TO authenticated
  WITH CHECK (recorded_by = auth.uid() OR get_current_user_type() = 'Admin');


-- ── users table (user directory) ────────────────────────────────────────────
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_update ON users;

-- All authenticated users can see the directory (needed for assignment dropdowns)
CREATE POLICY users_select ON users
  FOR SELECT TO authenticated
  USING (true);

-- Users can only update their own profile; Admins can update any
CREATE POLICY users_update ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_current_user_type() = 'Admin');


-- ── departments & roles (read-only for all; write for admins) ────────────────
DROP POLICY IF EXISTS departments_select ON departments;
DROP POLICY IF EXISTS departments_insert ON departments;
DROP POLICY IF EXISTS departments_update ON departments;
DROP POLICY IF EXISTS departments_delete ON departments;

CREATE POLICY departments_select ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY departments_insert ON departments
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_type() = 'Admin');

CREATE POLICY departments_update ON departments
  FOR UPDATE TO authenticated
  USING (get_current_user_type() = 'Admin');

CREATE POLICY departments_delete ON departments
  FOR DELETE TO authenticated
  USING (get_current_user_type() = 'Admin');

DROP POLICY IF EXISTS roles_select ON roles;
DROP POLICY IF EXISTS roles_insert ON roles;
DROP POLICY IF EXISTS roles_update ON roles;
DROP POLICY IF EXISTS roles_delete ON roles;

CREATE POLICY roles_select ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY roles_insert ON roles
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_type() = 'Admin');

CREATE POLICY roles_update ON roles
  FOR UPDATE TO authenticated
  USING (get_current_user_type() = 'Admin');

CREATE POLICY roles_delete ON roles
  FOR DELETE TO authenticated
  USING (get_current_user_type() = 'Admin');


-- ── site_settings ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS settings_select ON site_settings;
DROP POLICY IF EXISTS settings_update ON site_settings;

CREATE POLICY settings_select ON site_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY settings_update ON site_settings
  FOR UPDATE TO authenticated
  USING (get_current_user_type() = 'Admin');


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. REALTIME REPLICA IDENTITY
-- Enables Supabase Realtime to broadcast the OLD and NEW row values for
-- UPDATE events. Required for change detection in the leads:reassigned channel.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE leads           REPLICA IDENTITY FULL;
ALTER TABLE lead_meetings   REPLICA IDENTITY FULL;
ALTER TABLE lead_follow_ups REPLICA IDENTITY FULL;
ALTER TABLE messages        REPLICA IDENTITY FULL;

-- Enable realtime on the Supabase dashboard too:
-- Dashboard → Database → Publications → supabase_realtime → Add Tables:
--   leads, lead_meetings, lead_follow_ups, messages


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. pg_cron: Schedule auto-expiry of follow-ups (OPTIONAL)
-- Requires pg_cron extension. Enable in: Dashboard → Extensions → pg_cron
--
-- Once enabled, run:
-- SELECT cron.schedule(
--   'expire-follow-ups',
--   '*/15 * * * *',
--   'SELECT expire_missed_follow_ups()'
-- );
-- ─────────────────────────────────────────────────────────────────────────────

-- Done! All changes are applied.
