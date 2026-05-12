-- =============================================================================
-- CRM 2.0 - Standard Lead Lifecycle Schema
--
-- Purpose:
--   Normalize the CRM pipeline away from department-based stages.
--   Standard lifecycle:
--     Lead -> Client -> Project
--
-- Notes:
--   - This migration is additive and idempotent.
--   - Existing application columns such as leads.status, leads.cre_id, and
--     leads.sales_executive_id are preserved for compatibility.
--   - New lifecycle columns are synced from leads.status where possible.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Department and role seeds
-- -----------------------------------------------------------------------------

INSERT INTO public.departments (name, description)
VALUES
  ('Measurement', 'Measurement scheduling and site measurement team'),
  ('Purchase', 'Material ordering, vendor coordination, and inventory allocation'),
  ('Factory', 'Production and carpenter team coordination'),
  ('Installation', 'Dispatch, installation, and handover team'),
  ('Management', 'Management oversight and reporting')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO public.departments (name, description)
VALUES
  ('CRE', 'Customer relationship executives and lead qualification'),
  ('Sales', 'Sales team and client conversion'),
  ('Operations', 'Operations and project management')
ON CONFLICT (name) DO NOTHING;

WITH role_seed AS (
  SELECT
    d.id AS department_id,
    v.name,
    v.description,
    v.permissions::jsonb AS permissions
  FROM (
    VALUES
      (
        'CRE',
        'CRE Agent',
        'Handles new leads, contact attempts, follow-ups, support requests, and meeting fixing',
        '{
          "lead.view_assigned": true,
          "lead.create": true,
          "lead.update": true,
          "lead.assign": false,
          "lead.change_status": true,
          "client.update": false,
          "project.update": false,
          "support_request.create": true
        }'
      ),
      (
        'Sales',
        'Sales Executive',
        'Handles client meetings, quotations, prospecting, sold/lost outcomes, and sales follow-up',
        '{
          "lead.view_assigned": true,
          "client.view_assigned": true,
          "client.update": true,
          "client.change_status": true,
          "quotation.create": true,
          "quotation.update_own": true,
          "project.update": false
        }'
      ),
      (
        'Measurement',
        'Measurement Agent',
        'Schedules and completes site measurements after sale',
        '{
          "client.view_assigned": true,
          "measurement.create": true,
          "measurement.update_assigned": true,
          "client.change_status": true
        }'
      ),
      (
        'Purchase',
        'Purchase Agent',
        'Orders and receives project materials',
        '{
          "project.view_assigned": true,
          "project.update": true,
          "project.change_status": true
        }'
      ),
      (
        'Factory',
        'Factory Manager',
        'Coordinates production and readiness for installation',
        '{
          "project.view_assigned": true,
          "project.update": true,
          "project.change_status": true
        }'
      ),
      (
        'Installation',
        'Installation Agent',
        'Coordinates dispatch, installation completion, and handover',
        '{
          "project.view_assigned": true,
          "project.update": true,
          "project.change_status": true
        }'
      ),
      (
        'Management',
        'Manager',
        'Can view department work, assign users, and override lifecycle movement',
        '{
          "lead.view_all": true,
          "lead.assign": true,
          "lead.change_status": true,
          "client.view_all": true,
          "client.assign": true,
          "client.change_status": true,
          "project.view_all": true,
          "project.assign": true,
          "project.change_status": true,
          "reports.view": true
        }'
      )
  ) AS v(department_name, name, description, permissions)
  JOIN public.departments d ON d.name = v.department_name
)
INSERT INTO public.roles (department_id, name, description, permissions)
SELECT department_id, name, description, permissions
FROM role_seed
ON CONFLICT (department_id, name) DO UPDATE
SET
  description = EXCLUDED.description,
  permissions = public.roles.permissions || EXCLUDED.permissions,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 2. Permission helper
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role_permission(permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.is_admin(), false)
    OR EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND COALESCE((r.permissions ->> permission_key)::boolean, false)
    );
$$;

-- -----------------------------------------------------------------------------
-- 3. Standard lifecycle tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id),
  CONSTRAINT pipeline_stages_code_key UNIQUE (code),
  CONSTRAINT pipeline_stages_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.pipeline_statuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL,
  default_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  is_terminal boolean NOT NULL DEFAULT false,
  is_conversion_point boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pipeline_statuses_pkey PRIMARY KEY (id),
  CONSTRAINT pipeline_statuses_stage_code_key UNIQUE (stage_id, code),
  CONSTRAINT pipeline_statuses_stage_name_key UNIQUE (stage_id, name)
);

CREATE TABLE IF NOT EXISTS public.status_transitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE CASCADE,
  to_status_id uuid NOT NULL REFERENCES public.pipeline_statuses(id) ON DELETE CASCADE,
  allowed_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  allowed_role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  requires_note boolean NOT NULL DEFAULT false,
  requires_assignment boolean NOT NULL DEFAULT false,
  requires_follow_up boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT status_transitions_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_status_transitions_unique_pair
  ON public.status_transitions(from_status_id, to_status_id)
  WHERE from_status_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_status_transitions_unique_initial
  ON public.status_transitions(to_status_id)
  WHERE from_status_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_statuses_stage_sort
  ON public.pipeline_statuses(stage_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_pipeline_statuses_default_department
  ON public.pipeline_statuses(default_department_id);

CREATE INDEX IF NOT EXISTS idx_status_transitions_from
  ON public.status_transitions(from_status_id);

CREATE INDEX IF NOT EXISTS idx_status_transitions_to
  ON public.status_transitions(to_status_id);

-- -----------------------------------------------------------------------------
-- 4. Seed lifecycle stages and statuses
-- -----------------------------------------------------------------------------

INSERT INTO public.pipeline_stages (code, name, description, sort_order)
VALUES
  ('lead', 'Lead', 'Pre-client lead qualification and contact workflow', 10),
  ('client', 'Client', 'Meeting, quotation, sales conversion, and measurement workflow', 20),
  ('project', 'Project', 'Material, production, installation, and handover workflow', 30)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

WITH status_seed AS (
  SELECT *
  FROM (
    VALUES
      ('lead', 'new', 'New', 'Completely new lead.', 10, 'CRE', false, false),
      ('lead', 'message_rescheduled', 'Message Rescheduled', 'Client was busy over text and requested later contact.', 20, 'CRE', false, false),
      ('lead', 'number_collected', 'Number Collected', 'Phone number collected via text and updated in CRM.', 30, 'CRE', false, false),
      ('lead', 'call_rescheduled', 'Call Rescheduled', 'Call attempt did not connect or client was busy; follow-up call scheduled.', 40, 'CRE', false, false),
      ('lead', 'ongoing', 'Ongoing', 'Client project is under construction and not ready for interior work.', 50, 'CRE', false, false),
      ('lead', 'need_support', 'Need Support', 'Lead requires support from another team member or superior.', 60, 'CRE', false, false),
      ('lead', 'closed', 'Closed', 'Lead is no longer active before client conversion.', 90, 'CRE', true, false),

      ('client', 'meeting_fixed', 'Meeting Fixed', 'Requirements gathered and meeting scheduled; lead has become a client-stage opportunity.', 100, 'Sales', false, true),
      ('client', 'meeting_complete', 'Meeting Complete', 'Meeting conducted and required details updated in CRM.', 110, 'Sales', false, false),
      ('client', 'quotation_sent', 'Quotation Sent', 'Quotation prepared and sent to the client.', 120, 'Sales', false, false),
      ('client', 'prospect', 'Prospect', 'Client is highly interested in the design, quotation, and pricing.', 130, 'Sales', false, false),
      ('client', 'sold', 'Sold', 'Commercial conversion confirmed.', 140, 'Sales', false, true),
      ('client', 'lost', 'Lost', 'Client chose another company or already completed the work elsewhere.', 150, 'Sales', true, false),
      ('client', 'closed', 'Closed', 'Client-stage opportunity is no longer active.', 160, 'Sales', true, false),
      ('client', 'measurement_scheduled', 'Measurement Scheduled', 'Initial post-sale measurement has been scheduled.', 170, 'Measurement', false, false),
      ('client', 'measurement_done', 'Measurement Done', 'Final working measurements have been taken.', 180, 'Measurement', false, true),

      ('project', 'material_ordered', 'Material Ordered', 'Materials ordered from vendors or allocated from inventory.', 200, 'Purchase', false, false),
      ('project', 'material_received', 'Material Received', 'Materials received at the factory.', 210, 'Purchase', false, false),
      ('project', 'making', 'Making', 'Carpenter team assigned and production has started.', 220, 'Factory', false, false),
      ('project', 'ready_for_installation', 'Ready for Installation', 'Production complete and ready for installation scheduling.', 230, 'Factory', false, false),
      ('project', 'out_for_installation', 'Out for Installation', 'Dispatch team has left for client location.', 240, 'Installation', false, false),
      ('project', 'installation_completed', 'Installation Completed', 'Installation has been completed and updated.', 250, 'Installation', false, false),
      ('project', 'handed_over', 'Handed Over', 'Project successfully handed over to client and complete.', 260, 'Installation', true, true),
      ('project', 'closed', 'Closed', 'Project is closed without active delivery work.', 270, 'Operations', true, false)
  ) AS s(stage_code, code, name, description, sort_order, department_name, is_terminal, is_conversion_point)
)
INSERT INTO public.pipeline_statuses (
  stage_id,
  code,
  name,
  description,
  sort_order,
  default_department_id,
  is_terminal,
  is_conversion_point
)
SELECT
  ps.id,
  ss.code,
  ss.name,
  ss.description,
  ss.sort_order,
  d.id,
  ss.is_terminal,
  ss.is_conversion_point
FROM status_seed ss
JOIN public.pipeline_stages ps ON ps.code = ss.stage_code
LEFT JOIN public.departments d ON d.name = ss.department_name
ON CONFLICT (stage_id, code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  default_department_id = EXCLUDED.default_department_id,
  is_terminal = EXCLUDED.is_terminal,
  is_conversion_point = EXCLUDED.is_conversion_point,
  is_active = true,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 5. Seed transition graph
-- -----------------------------------------------------------------------------

WITH transition_seed AS (
  SELECT *
  FROM (
    VALUES
      (NULL, NULL, 'lead', 'new', 'CRE', false, true, false),

      ('lead', 'new', 'lead', 'message_rescheduled', 'CRE', false, false, true),
      ('lead', 'new', 'lead', 'number_collected', 'CRE', false, false, false),
      ('lead', 'new', 'lead', 'call_rescheduled', 'CRE', false, false, true),
      ('lead', 'new', 'lead', 'ongoing', 'CRE', false, false, true),
      ('lead', 'new', 'lead', 'need_support', 'CRE', true, false, false),
      ('lead', 'new', 'lead', 'closed', 'CRE', true, false, false),

      ('lead', 'message_rescheduled', 'lead', 'number_collected', 'CRE', false, false, false),
      ('lead', 'message_rescheduled', 'lead', 'call_rescheduled', 'CRE', false, false, true),
      ('lead', 'message_rescheduled', 'lead', 'closed', 'CRE', true, false, false),

      ('lead', 'number_collected', 'lead', 'call_rescheduled', 'CRE', false, false, true),
      ('lead', 'number_collected', 'client', 'meeting_fixed', 'CRE', false, true, false),
      ('lead', 'number_collected', 'lead', 'need_support', 'CRE', true, false, false),

      ('lead', 'call_rescheduled', 'lead', 'number_collected', 'CRE', false, false, false),
      ('lead', 'call_rescheduled', 'client', 'meeting_fixed', 'CRE', false, true, false),
      ('lead', 'call_rescheduled', 'lead', 'closed', 'CRE', true, false, false),

      ('lead', 'ongoing', 'lead', 'call_rescheduled', 'CRE', false, false, true),
      ('lead', 'ongoing', 'client', 'meeting_fixed', 'CRE', false, true, false),
      ('lead', 'ongoing', 'lead', 'closed', 'CRE', true, false, false),

      ('lead', 'need_support', 'lead', 'call_rescheduled', 'CRE', false, false, true),
      ('lead', 'need_support', 'client', 'meeting_fixed', 'CRE', false, true, false),
      ('lead', 'need_support', 'lead', 'closed', 'CRE', true, false, false),

      ('client', 'meeting_fixed', 'client', 'meeting_complete', 'Sales', false, false, false),
      ('client', 'meeting_fixed', 'client', 'closed', 'Sales', true, false, false),
      ('client', 'meeting_complete', 'client', 'quotation_sent', 'Sales', false, false, false),
      ('client', 'meeting_complete', 'client', 'lost', 'Sales', true, false, false),
      ('client', 'quotation_sent', 'client', 'prospect', 'Sales', false, false, true),
      ('client', 'quotation_sent', 'client', 'sold', 'Sales', false, true, false),
      ('client', 'quotation_sent', 'client', 'lost', 'Sales', true, false, false),
      ('client', 'prospect', 'client', 'sold', 'Sales', false, true, false),
      ('client', 'prospect', 'client', 'lost', 'Sales', true, false, false),
      ('client', 'sold', 'client', 'measurement_scheduled', 'Measurement', false, true, true),
      ('client', 'measurement_scheduled', 'client', 'measurement_done', 'Measurement', false, false, false),
      ('client', 'measurement_done', 'project', 'material_ordered', 'Purchase', false, true, false),

      ('project', 'material_ordered', 'project', 'material_received', 'Purchase', false, false, false),
      ('project', 'material_received', 'project', 'making', 'Factory', false, true, false),
      ('project', 'making', 'project', 'ready_for_installation', 'Factory', false, false, false),
      ('project', 'ready_for_installation', 'project', 'out_for_installation', 'Installation', false, true, false),
      ('project', 'out_for_installation', 'project', 'installation_completed', 'Installation', false, false, false),
      ('project', 'installation_completed', 'project', 'handed_over', 'Installation', false, false, false),
      ('project', 'material_ordered', 'project', 'closed', 'Management', true, false, false),
      ('project', 'material_received', 'project', 'closed', 'Management', true, false, false),
      ('project', 'making', 'project', 'closed', 'Management', true, false, false),
      ('project', 'ready_for_installation', 'project', 'closed', 'Management', true, false, false),
      ('project', 'out_for_installation', 'project', 'closed', 'Management', true, false, false)
  ) AS t(from_stage_code, from_status_code, to_stage_code, to_status_code, department_name, requires_note, requires_assignment, requires_follow_up)
),
resolved_transitions AS (
  SELECT
    from_status.id AS from_status_id,
    to_status.id AS to_status_id,
    d.id AS allowed_department_id,
    t.requires_note,
    t.requires_assignment,
    t.requires_follow_up
  FROM transition_seed t
  JOIN public.pipeline_stages to_stage ON to_stage.code = t.to_stage_code
  JOIN public.pipeline_statuses to_status
    ON to_status.stage_id = to_stage.id
   AND to_status.code = t.to_status_code
  LEFT JOIN public.pipeline_stages from_stage ON from_stage.code = t.from_stage_code
  LEFT JOIN public.pipeline_statuses from_status
    ON from_status.stage_id = from_stage.id
   AND from_status.code = t.from_status_code
  LEFT JOIN public.departments d ON d.name = t.department_name
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
  WHERE existing.to_status_id = rt.to_status_id
    AND (
      existing.from_status_id = rt.from_status_id
      OR (existing.from_status_id IS NULL AND rt.from_status_id IS NULL)
    )
);

-- -----------------------------------------------------------------------------
-- 6. Add lifecycle columns to leads
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS current_stage_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS close_reason text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_to_client_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_to_project_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_priority_check'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_current_stage_id
  ON public.leads(current_stage_id);

CREATE INDEX IF NOT EXISTS idx_leads_current_status_id
  ON public.leads(current_status_id);

CREATE INDEX IF NOT EXISTS idx_leads_current_owner_id
  ON public.leads(current_owner_id);

CREATE INDEX IF NOT EXISTS idx_leads_current_department_id
  ON public.leads(current_department_id);

CREATE INDEX IF NOT EXISTS idx_leads_lifecycle_filter
  ON public.leads(current_stage_id, current_status_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. Operational lifecycle tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  primary_phone text,
  created_from_status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  converted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_lead_id_key UNIQUE (lead_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_no text UNIQUE,
  current_status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE SET NULL,
  current_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  project_manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  start_date date,
  expected_handover_date date,
  actual_handover_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_lead_id_key UNIQUE (lead_id)
);

CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  is_current boolean NOT NULL DEFAULT true,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT lead_assignments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  from_status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE SET NULL,
  to_status_id uuid REFERENCES public.pipeline_statuses(id) ON DELETE SET NULL,
  changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT lead_status_history_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'normal',
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT support_requests_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  quotation_no text UNIQUE,
  amount numeric(12, 2),
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  approved_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT quotations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  measured_at timestamptz,
  measurement_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  files text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT measurements_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_requests_priority_check'
      AND conrelid = 'public.support_requests'::regclass
  ) THEN
    ALTER TABLE public.support_requests
      ADD CONSTRAINT support_requests_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_requests_status_check'
      AND conrelid = 'public.support_requests'::regclass
  ) THEN
    ALTER TABLE public.support_requests
      ADD CONSTRAINT support_requests_status_check
      CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_status_check'
      AND conrelid = 'public.quotations'::regclass
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_status_check
      CHECK (status IN ('draft', 'sent', 'revised', 'approved', 'rejected', 'expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'measurements_status_check'
      AND conrelid = 'public.measurements'::regclass
  ) THEN
    ALTER TABLE public.measurements
      ADD CONSTRAINT measurements_status_check
      CHECK (status IN ('scheduled', 'rescheduled', 'done', 'cancelled'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_assignments_current_unique
  ON public.lead_assignments(lead_id, stage_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_clients_lead_id
  ON public.clients(lead_id);

CREATE INDEX IF NOT EXISTS idx_projects_lead_id
  ON public.projects(lead_id);

CREATE INDEX IF NOT EXISTS idx_projects_client_id
  ON public.projects(client_id);

CREATE INDEX IF NOT EXISTS idx_projects_current_status_id
  ON public.projects(current_status_id);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id
  ON public.lead_assignments(lead_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to
  ON public.lead_assignments(assigned_to)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_lead_assignments_department
  ON public.lead_assignments(department_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id
  ON public.lead_status_history(lead_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_requests_lead_id
  ON public.support_requests(lead_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_assigned_to
  ON public.support_requests(assigned_to)
  WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_quotations_lead_id
  ON public.quotations(lead_id);

CREATE INDEX IF NOT EXISTS idx_measurements_lead_id
  ON public.measurements(lead_id);

-- -----------------------------------------------------------------------------
-- 8. Lifecycle resolution and sync helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_pipeline_status_id(status_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT lower(trim(status_name)) AS value
  ),
  mapped AS (
    SELECT
      CASE value
        WHEN 'new' THEN 'lead'
        WHEN 'no response' THEN 'lead'
        WHEN 'number provided' THEN 'lead'
        WHEN 'message rescheduled' THEN 'lead'
        WHEN 'number collected' THEN 'lead'
        WHEN 'call reschedule' THEN 'lead'
        WHEN 'call rescheduled' THEN 'lead'
        WHEN 'ongoing' THEN 'lead'
        WHEN 'need support' THEN 'lead'
        WHEN 'close' THEN 'lead'
        WHEN 'closed' THEN 'lead'

        WHEN 'meeting fixed' THEN 'client'
        WHEN 'meeting complete' THEN 'client'
        WHEN 'quotation sent' THEN 'client'
        WHEN 'prospect' THEN 'client'
        WHEN 'sold' THEN 'client'
        WHEN 'lost' THEN 'client'
        WHEN 'measurement scheduled' THEN 'client'
        WHEN 'measurement done' THEN 'client'
        WHEN 'mesurement done' THEN 'client'
        WHEN 'measured' THEN 'client'

        WHEN 'material ordered' THEN 'project'
        WHEN 'material received' THEN 'project'
        WHEN 'making' THEN 'project'
        WHEN 'project in production' THEN 'project'
        WHEN 'ready for installation' THEN 'project'
        WHEN 'out for installation' THEN 'project'
        WHEN 'installation completed' THEN 'project'
        WHEN 'project complete' THEN 'project'
        WHEN 'handed over' THEN 'project'
        ELSE 'lead'
      END AS stage_code,
      CASE value
        WHEN 'new' THEN 'new'
        WHEN 'no response' THEN 'call_rescheduled'
        WHEN 'number provided' THEN 'number_collected'
        WHEN 'message rescheduled' THEN 'message_rescheduled'
        WHEN 'number collected' THEN 'number_collected'
        WHEN 'call reschedule' THEN 'call_rescheduled'
        WHEN 'call rescheduled' THEN 'call_rescheduled'
        WHEN 'ongoing' THEN 'ongoing'
        WHEN 'need support' THEN 'need_support'
        WHEN 'close' THEN 'closed'
        WHEN 'closed' THEN 'closed'

        WHEN 'meeting fixed' THEN 'meeting_fixed'
        WHEN 'meeting complete' THEN 'meeting_complete'
        WHEN 'quotation sent' THEN 'quotation_sent'
        WHEN 'prospect' THEN 'prospect'
        WHEN 'sold' THEN 'sold'
        WHEN 'lost' THEN 'lost'
        WHEN 'measurement scheduled' THEN 'measurement_scheduled'
        WHEN 'measurement done' THEN 'measurement_done'
        WHEN 'mesurement done' THEN 'measurement_done'
        WHEN 'measured' THEN 'measurement_done'

        WHEN 'material ordered' THEN 'material_ordered'
        WHEN 'material received' THEN 'material_received'
        WHEN 'making' THEN 'making'
        WHEN 'project in production' THEN 'making'
        WHEN 'ready for installation' THEN 'ready_for_installation'
        WHEN 'out for installation' THEN 'out_for_installation'
        WHEN 'installation completed' THEN 'installation_completed'
        WHEN 'project complete' THEN 'installation_completed'
        WHEN 'handed over' THEN 'handed_over'
        ELSE 'new'
      END AS status_code
    FROM normalized
  )
  SELECT s.id
  FROM mapped m
  JOIN public.pipeline_stages st ON st.code = m.stage_code
  JOIN public.pipeline_statuses s
    ON s.stage_id = st.id
   AND s.code = m.status_code
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.sync_lead_lifecycle_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_status_id uuid;
  resolved_status record;
  status_changed boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.current_status_id IS NULL THEN
      resolved_status_id := public.resolve_pipeline_status_id(COALESCE(NEW.status, 'New'));
      NEW.current_status_id := resolved_status_id;
    ELSE
      resolved_status_id := NEW.current_status_id;
    END IF;
    status_changed := true;
  ELSE
    IF NEW.current_status_id IS DISTINCT FROM OLD.current_status_id
      AND NEW.current_status_id IS NOT NULL THEN
      resolved_status_id := NEW.current_status_id;
      status_changed := true;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      resolved_status_id := public.resolve_pipeline_status_id(COALESCE(NEW.status, 'New'));
      NEW.current_status_id := resolved_status_id;
      status_changed := true;
    ELSIF NEW.current_status_id IS NULL THEN
      resolved_status_id := public.resolve_pipeline_status_id(COALESCE(NEW.status, 'New'));
      NEW.current_status_id := resolved_status_id;
      status_changed := true;
    ELSE
      resolved_status_id := NEW.current_status_id;
    END IF;
  END IF;

  SELECT
    s.id AS status_id,
    s.name AS status_name,
    s.stage_id,
    s.default_department_id,
    st.code AS stage_code,
    s.code AS status_code
  INTO resolved_status
  FROM public.pipeline_statuses s
  JOIN public.pipeline_stages st ON st.id = s.stage_id
  WHERE s.id = resolved_status_id;

  IF resolved_status.status_id IS NOT NULL THEN
    NEW.current_status_id := resolved_status.status_id;
    NEW.current_stage_id := resolved_status.stage_id;

    IF NEW.current_department_id IS NULL
      OR status_changed THEN
      NEW.current_department_id := resolved_status.default_department_id;
    END IF;

    IF resolved_status.stage_code = 'client'
      AND NEW.converted_to_client_at IS NULL THEN
      NEW.converted_to_client_at := now();
    END IF;

    IF resolved_status.stage_code = 'project'
      AND NEW.converted_to_project_at IS NULL THEN
      NEW.converted_to_project_at := now();
    END IF;

    IF resolved_status.status_code IN ('lost', 'closed', 'handed_over')
      AND NEW.closed_at IS NULL THEN
      NEW.closed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_lead_lifecycle_fields ON public.leads;
CREATE TRIGGER sync_lead_lifecycle_fields
BEFORE INSERT OR UPDATE OF status, current_status_id, current_department_id
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.sync_lead_lifecycle_fields();

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
      metadata
    )
    VALUES (
      NEW.id,
      NEW.current_stage_id,
      NEW.current_status_id,
      auth.uid(),
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
      metadata
    )
    VALUES (
      NEW.id,
      OLD.current_stage_id,
      NEW.current_stage_id,
      OLD.current_status_id,
      NEW.current_status_id,
      auth.uid(),
      jsonb_build_object('source', 'lead_update')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_lead_status_history ON public.leads;
CREATE TRIGGER log_lead_status_history
AFTER INSERT OR UPDATE OF current_status_id
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.log_lead_status_history();

-- Backfill current lifecycle fields for existing leads.
UPDATE public.leads
SET current_status_id = public.resolve_pipeline_status_id(status)
WHERE current_status_id IS NULL;

UPDATE public.leads l
SET
  current_stage_id = s.stage_id,
  current_department_id = COALESCE(l.current_department_id, s.default_department_id),
  current_owner_id = COALESCE(l.current_owner_id, l.sales_executive_id, l.cre_id)
FROM public.pipeline_statuses s
WHERE l.current_status_id = s.id
  AND (l.current_stage_id IS NULL OR l.current_department_id IS NULL OR l.current_owner_id IS NULL);

-- -----------------------------------------------------------------------------
-- 9. Timestamp triggers
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS set_pipeline_stages_updated_at ON public.pipeline_stages;
CREATE TRIGGER set_pipeline_stages_updated_at
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_pipeline_statuses_updated_at ON public.pipeline_statuses;
CREATE TRIGGER set_pipeline_statuses_updated_at
BEFORE UPDATE ON public.pipeline_statuses
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_support_requests_updated_at ON public.support_requests;
CREATE TRIGGER set_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_quotations_updated_at ON public.quotations;
CREATE TRIGGER set_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_measurements_updated_at ON public.measurements;
CREATE TRIGGER set_measurements_updated_at
BEFORE UPDATE ON public.measurements
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_stages_select_authenticated" ON public.pipeline_stages;
CREATE POLICY "pipeline_stages_select_authenticated"
  ON public.pipeline_stages
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "pipeline_stages_manage_admin" ON public.pipeline_stages;
CREATE POLICY "pipeline_stages_manage_admin"
  ON public.pipeline_stages
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role_permission('settings.manage'))
  WITH CHECK (public.is_admin() OR public.has_role_permission('settings.manage'));

DROP POLICY IF EXISTS "pipeline_statuses_select_authenticated" ON public.pipeline_statuses;
CREATE POLICY "pipeline_statuses_select_authenticated"
  ON public.pipeline_statuses
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "pipeline_statuses_manage_admin" ON public.pipeline_statuses;
CREATE POLICY "pipeline_statuses_manage_admin"
  ON public.pipeline_statuses
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role_permission('settings.manage'))
  WITH CHECK (public.is_admin() OR public.has_role_permission('settings.manage'));

DROP POLICY IF EXISTS "status_transitions_select_authenticated" ON public.status_transitions;
CREATE POLICY "status_transitions_select_authenticated"
  ON public.status_transitions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "status_transitions_manage_admin" ON public.status_transitions;
CREATE POLICY "status_transitions_manage_admin"
  ON public.status_transitions
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role_permission('settings.manage'))
  WITH CHECK (public.is_admin() OR public.has_role_permission('settings.manage'));

DROP POLICY IF EXISTS "clients_select_assigned" ON public.clients;
CREATE POLICY "clients_select_assigned"
  ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('client.view_all')
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = clients.lead_id
        AND (
          l.cre_id = auth.uid()
          OR l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "clients_manage_allowed" ON public.clients;
CREATE POLICY "clients_manage_allowed"
  ON public.clients
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('client.update')
    OR public.has_role_permission('client.assign')
  )
  WITH CHECK (
    public.is_admin()
    OR public.has_role_permission('client.update')
    OR public.has_role_permission('client.assign')
  );

DROP POLICY IF EXISTS "projects_select_assigned" ON public.projects;
CREATE POLICY "projects_select_assigned"
  ON public.projects
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('project.view_all')
    OR project_manager_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = projects.lead_id
        AND (
          l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.lead_assignments la
      WHERE la.lead_id = projects.lead_id
        AND la.assigned_to = auth.uid()
        AND la.is_current = true
    )
  );

DROP POLICY IF EXISTS "projects_manage_allowed" ON public.projects;
CREATE POLICY "projects_manage_allowed"
  ON public.projects
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('project.update')
    OR public.has_role_permission('project.assign')
  )
  WITH CHECK (
    public.is_admin()
    OR public.has_role_permission('project.update')
    OR public.has_role_permission('project.assign')
  );

DROP POLICY IF EXISTS "lead_assignments_select_related" ON public.lead_assignments;
CREATE POLICY "lead_assignments_select_related"
  ON public.lead_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('lead.view_all')
    OR public.has_role_permission('client.view_all')
    OR public.has_role_permission('project.view_all')
    OR assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = lead_assignments.lead_id
        AND (
          l.cre_id = auth.uid()
          OR l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "lead_assignments_manage_allowed" ON public.lead_assignments;
CREATE POLICY "lead_assignments_manage_allowed"
  ON public.lead_assignments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('lead.assign')
    OR public.has_role_permission('client.assign')
    OR public.has_role_permission('project.assign')
  )
  WITH CHECK (
    public.is_admin()
    OR public.has_role_permission('lead.assign')
    OR public.has_role_permission('client.assign')
    OR public.has_role_permission('project.assign')
  );

DROP POLICY IF EXISTS "lead_status_history_select_related" ON public.lead_status_history;
CREATE POLICY "lead_status_history_select_related"
  ON public.lead_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('lead.view_all')
    OR public.has_role_permission('client.view_all')
    OR public.has_role_permission('project.view_all')
    OR changed_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = lead_status_history.lead_id
        AND (
          l.cre_id = auth.uid()
          OR l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "lead_status_history_insert_allowed" ON public.lead_status_history;
CREATE POLICY "lead_status_history_insert_allowed"
  ON public.lead_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.has_role_permission('lead.change_status')
    OR public.has_role_permission('client.change_status')
    OR public.has_role_permission('project.change_status')
  );

DROP POLICY IF EXISTS "support_requests_select_related" ON public.support_requests;
CREATE POLICY "support_requests_select_related"
  ON public.support_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR requested_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = support_requests.lead_id
        AND (
          l.cre_id = auth.uid()
          OR l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "support_requests_manage_related" ON public.support_requests;
CREATE POLICY "support_requests_manage_related"
  ON public.support_requests
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR requested_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.has_role_permission('support_request.create')
  )
  WITH CHECK (
    public.is_admin()
    OR requested_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.has_role_permission('support_request.create')
  );

DROP POLICY IF EXISTS "quotations_select_related" ON public.quotations;
CREATE POLICY "quotations_select_related"
  ON public.quotations
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('client.view_all')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = quotations.lead_id
        AND (
          l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "quotations_manage_allowed" ON public.quotations;
CREATE POLICY "quotations_manage_allowed"
  ON public.quotations
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR public.has_role_permission('quotation.create')
    OR public.has_role_permission('quotation.update_own')
  )
  WITH CHECK (
    public.is_admin()
    OR created_by = auth.uid()
    OR public.has_role_permission('quotation.create')
    OR public.has_role_permission('quotation.update_own')
  );

DROP POLICY IF EXISTS "measurements_select_related" ON public.measurements;
CREATE POLICY "measurements_select_related"
  ON public.measurements
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_role_permission('client.view_all')
    OR measurement_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.leads l
      WHERE l.id = measurements.lead_id
        AND (
          l.sales_executive_id = auth.uid()
          OR l.current_owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "measurements_manage_allowed" ON public.measurements;
CREATE POLICY "measurements_manage_allowed"
  ON public.measurements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR measurement_by = auth.uid()
    OR public.has_role_permission('measurement.create')
    OR public.has_role_permission('measurement.update_assigned')
  )
  WITH CHECK (
    public.is_admin()
    OR measurement_by = auth.uid()
    OR public.has_role_permission('measurement.create')
    OR public.has_role_permission('measurement.update_assigned')
  );

-- -----------------------------------------------------------------------------
-- 11. Realtime support for lifecycle tables
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.lead_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.lead_status_history REPLICA IDENTITY FULL;
ALTER TABLE public.support_requests REPLICA IDENTITY FULL;
