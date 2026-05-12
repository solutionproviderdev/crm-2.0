-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Lifecycle History — Rich Event Types
--
-- Adds event_type column so history rows are distinguishable:
--   status_change  — automatic via DB trigger (existing behaviour)
--   assignment     — manual reassign logged by app
--   follow_up      — follow-up scheduled, logged by app
--   meeting        — meeting completed / lead sold, logged by app
--   support_request— support request created, logged by app
--   comment        — standalone note logged by app (future use)
--
-- Also rebuilds the trigger function to set event_type = 'status_change'
-- explicitly on auto-generated rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add column (idempotent)
ALTER TABLE public.lead_status_history
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'status_change';

-- 2. Backfill existing rows (all pre-existing rows are status_change events)
UPDATE public.lead_status_history
  SET event_type = 'status_change'
  WHERE event_type = 'status_change'; -- no-op but explicit for clarity

-- 3. Add index for timeline queries filtered by event type
CREATE INDEX IF NOT EXISTS idx_lead_status_history_event_type
  ON public.lead_status_history(lead_id, event_type, changed_at DESC);

-- 4. Rebuild trigger function to set event_type explicitly
CREATE OR REPLACE FUNCTION public.log_lead_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_status_history (
      lead_id,
      to_stage_id,
      to_status_id,
      changed_by,
      event_type,
      metadata
    )
    VALUES (
      NEW.id,
      NEW.current_stage_id,
      NEW.current_status_id,
      auth.uid(),
      'status_change',
      jsonb_build_object('source', 'insert')
    );
  ELSIF NEW.current_status_id IS DISTINCT FROM OLD.current_status_id THEN
    INSERT INTO public.lead_status_history (
      lead_id,
      from_stage_id,
      to_stage_id,
      from_status_id,
      to_status_id,
      changed_by,
      event_type,
      metadata
    )
    VALUES (
      NEW.id,
      OLD.current_stage_id,
      NEW.current_stage_id,
      OLD.current_status_id,
      NEW.current_status_id,
      auth.uid(),
      'status_change',
      jsonb_build_object('source', 'lead_update')
    );
  END IF;

  RETURN NEW;
END;
$$;
