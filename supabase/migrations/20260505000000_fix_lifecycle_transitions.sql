-- =============================================================================
-- CRM 2.0 - Fix Lifecycle Transition Graph
--
-- Changes:
--   1. Add missing transition: lead/new → client/meeting_fixed
--      Rationale: leads that arrive with a phone number (WhatsApp, referral,
--      walk-in) can be called directly on the first attempt and a meeting fixed
--      without passing through number_collected first.
--
--   2. Add missing transition: lead/call_rescheduled → lead/need_support
--      Rationale: need_support is an escalation path available from any active
--      lead status; it was missing from call_rescheduled.
--
--   3. Add missing transition: lead/message_rescheduled → lead/need_support
--      Rationale: same as above — escalation should be available at any point
--      where the CRE encounters an unusual client situation.
--
--   4. Update lead/meeting_fixed → client/meeting_complete to require a note
--      Rationale: "Meeting Complete" means the meeting was conducted and details
--      updated. Without requiring a note, sales reps click through without
--      recording what was discussed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1–3. Insert missing transitions (idempotent)
-- -----------------------------------------------------------------------------

WITH transition_seed AS (
  SELECT *
  FROM (
    VALUES
      -- Leads with an existing phone number can go directly to meeting fixed
      ('lead', 'new',                 'client', 'meeting_fixed', 'CRE', false, true,  false),
      -- Escalation path from call_rescheduled
      ('lead', 'call_rescheduled',    'lead',   'need_support',  'CRE', true,  false, false),
      -- Escalation path from message_rescheduled
      ('lead', 'message_rescheduled', 'lead',   'need_support',  'CRE', true,  false, false)
  ) AS t(
    from_stage_code, from_status_code,
    to_stage_code,   to_status_code,
    department_name,
    requires_note, requires_assignment, requires_follow_up
  )
),
resolved_transitions AS (
  SELECT
    from_status.id AS from_status_id,
    to_status.id   AS to_status_id,
    d.id           AS allowed_department_id,
    t.requires_note,
    t.requires_assignment,
    t.requires_follow_up
  FROM transition_seed t
  JOIN public.pipeline_stages   from_stage  ON from_stage.code    = t.from_stage_code
  JOIN public.pipeline_statuses from_status ON from_status.stage_id = from_stage.id
                                           AND from_status.code     = t.from_status_code
  JOIN public.pipeline_stages   to_stage    ON to_stage.code       = t.to_stage_code
  JOIN public.pipeline_statuses to_status   ON to_status.stage_id  = to_stage.id
                                           AND to_status.code       = t.to_status_code
  LEFT JOIN public.departments  d           ON d.name               = t.department_name
)
INSERT INTO public.status_transitions (
  from_status_id,
  to_status_id,
  allowed_department_id,
  requires_note,
  requires_assignment,
  requires_follow_up
)
SELECT
  rt.from_status_id,
  rt.to_status_id,
  rt.allowed_department_id,
  rt.requires_note,
  rt.requires_assignment,
  rt.requires_follow_up
FROM resolved_transitions rt
WHERE NOT EXISTS (
  SELECT 1
  FROM public.status_transitions existing
  WHERE existing.from_status_id = rt.from_status_id
    AND existing.to_status_id   = rt.to_status_id
);

-- -----------------------------------------------------------------------------
-- 4. Require a note when marking a meeting as complete
-- -----------------------------------------------------------------------------

UPDATE public.status_transitions st
SET    requires_note = true
FROM   public.pipeline_stages   from_stage
JOIN   public.pipeline_statuses from_status ON from_status.stage_id = from_stage.id
                                           AND from_status.code      = 'meeting_fixed'
JOIN   public.pipeline_stages   to_stage    ON to_stage.code         = 'client'
JOIN   public.pipeline_statuses to_status   ON to_status.stage_id    = to_stage.id
                                           AND to_status.code         = 'meeting_complete'
WHERE  from_stage.code         = 'client'
  AND  st.from_status_id       = from_status.id
  AND  st.to_status_id         = to_status.id
  AND  st.requires_note        = false;
