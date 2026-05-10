-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL,
  name text NOT NULL,
  visit_charge numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT areas_pkey PRIMARY KEY (id),
  CONSTRAINT areas_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id)
);
CREATE TABLE public.chat_participants (
  chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  last_read_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_participants_pkey PRIMARY KEY (chat_id, user_id),
  CONSTRAINT chat_participants_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  primary_phone text,
  created_from_status_id uuid,
  owner_id uuid,
  converted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT clients_created_from_status_id_fkey FOREIGN KEY (created_from_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT clients_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.districts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT districts_pkey PRIMARY KEY (id),
  CONSTRAINT districts_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id)
);
CREATE TABLE public.divisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT divisions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lead_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT lead_activity_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id)
);
CREATE TABLE public.lead_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  stage_id uuid,
  status_id uuid,
  department_id uuid,
  assigned_to uuid,
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  unassigned_at timestamp with time zone,
  is_current boolean NOT NULL DEFAULT true,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT lead_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT lead_assignments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_assignments_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id),
  CONSTRAINT lead_assignments_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT lead_assignments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT lead_assignments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT lead_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.lead_call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  recorded_by uuid,
  recipient_number text NOT NULL,
  call_type text NOT NULL,
  status text NOT NULL DEFAULT 'Received'::text,
  call_duration text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_call_logs_pkey PRIMARY KEY (id),
  CONSTRAINT lead_call_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_call_logs_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id)
);
CREATE TABLE public.lead_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  comment_by uuid NOT NULL,
  comment text NOT NULL,
  images ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_comments_pkey PRIMARY KEY (id),
  CONSTRAINT lead_comments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_comments_comment_by_fkey FOREIGN KEY (comment_by) REFERENCES public.users(id)
);
CREATE TABLE public.lead_follow_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  type text,
  status text NOT NULL DEFAULT 'Pending'::text,
  time timestamp with time zone NOT NULL,
  comment_id uuid,
  ten_min_notification_sent boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  assigned_to uuid,
  CONSTRAINT lead_follow_ups_pkey PRIMARY KEY (id),
  CONSTRAINT lead_follow_ups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_follow_ups_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.lead_comments(id),
  CONSTRAINT lead_follow_ups_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);
CREATE TABLE public.lead_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  sales_executive_id uuid,
  date date NOT NULL,
  slot text NOT NULL,
  status text NOT NULL DEFAULT 'Fixed'::text,
  meeting_flow_status text,
  visit_charge numeric DEFAULT 0,
  locations jsonb DEFAULT '{}'::jsonb,
  audit_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  project_location text DEFAULT 'Inside'::text,
  CONSTRAINT lead_meetings_pkey PRIMARY KEY (id),
  CONSTRAINT lead_meetings_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_meetings_sales_executive_id_fkey FOREIGN KEY (sales_executive_id) REFERENCES public.users(id)
);
CREATE TABLE public.lead_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  recorded_by uuid,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  payment_status text NOT NULL DEFAULT 'Paid'::text,
  payment_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_payments_pkey PRIMARY KEY (id),
  CONSTRAINT lead_payments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id)
);
CREATE TABLE public.lead_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  from_stage_id uuid,
  to_stage_id uuid,
  from_status_id uuid,
  to_status_id uuid,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT lead_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT lead_status_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_status_history_from_stage_id_fkey FOREIGN KEY (from_stage_id) REFERENCES public.pipeline_stages(id),
  CONSTRAINT lead_status_history_to_stage_id_fkey FOREIGN KEY (to_stage_id) REFERENCES public.pipeline_stages(id),
  CONSTRAINT lead_status_history_from_status_id_fkey FOREIGN KEY (from_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT lead_status_history_to_status_id_fkey FOREIGN KEY (to_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT lead_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cid text UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'New'::text,
  source text NOT NULL,
  profile_picture text,
  phones ARRAY DEFAULT '{}'::text[],
  address jsonb DEFAULT '{}'::jsonb,
  project_status jsonb DEFAULT '{"status": null, "subStatus": null}'::jsonb,
  finance jsonb DEFAULT '{}'::jsonb,
  page_info jsonb DEFAULT '{}'::jsonb,
  whatsapp_info jsonb DEFAULT '{}'::jsonb,
  bot_responded boolean DEFAULT false,
  replied_from_system boolean DEFAULT false,
  ai_bot_reply boolean DEFAULT false,
  sales_executive_id uuid,
  cre_id uuid,
  last_assigned timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  requirements jsonb DEFAULT '[]'::jsonb,
  current_stage_id uuid,
  current_status_id uuid,
  current_owner_id uuid,
  current_department_id uuid,
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  lost_reason text,
  close_reason text,
  closed_at timestamp with time zone,
  converted_to_client_at timestamp with time zone,
  converted_to_project_at timestamp with time zone,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_sales_executive_id_fkey FOREIGN KEY (sales_executive_id) REFERENCES public.users(id),
  CONSTRAINT leads_cre_id_fkey FOREIGN KEY (cre_id) REFERENCES public.users(id),
  CONSTRAINT leads_current_stage_id_fkey FOREIGN KEY (current_stage_id) REFERENCES public.pipeline_stages(id),
  CONSTRAINT leads_current_status_id_fkey FOREIGN KEY (current_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT leads_current_owner_id_fkey FOREIGN KEY (current_owner_id) REFERENCES public.users(id),
  CONSTRAINT leads_current_department_id_fkey FOREIGN KEY (current_department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  client_id uuid,
  scheduled_at timestamp with time zone,
  measured_at timestamp with time zone,
  measurement_by uuid,
  status text NOT NULL DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'rescheduled'::text, 'done'::text, 'cancelled'::text])),
  notes text,
  files ARRAY NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT measurements_pkey PRIMARY KEY (id),
  CONSTRAINT measurements_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT measurements_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT measurements_measurement_by_fkey FOREIGN KEY (measurement_by) REFERENCES public.users(id)
);
CREATE TABLE public.meeting_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slot_text text NOT NULL UNIQUE,
  display_order integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meeting_slots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pipeline_statuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL,
  default_department_id uuid,
  is_terminal boolean NOT NULL DEFAULT false,
  is_conversion_point boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pipeline_statuses_pkey PRIMARY KEY (id),
  CONSTRAINT pipeline_statuses_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id),
  CONSTRAINT pipeline_statuses_default_department_id_fkey FOREIGN KEY (default_department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE,
  client_id uuid,
  project_no text UNIQUE,
  current_status_id uuid,
  current_department_id uuid,
  project_manager_id uuid,
  start_date date,
  expected_handover_date date,
  actual_handover_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT projects_current_status_id_fkey FOREIGN KEY (current_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT projects_current_department_id_fkey FOREIGN KEY (current_department_id) REFERENCES public.departments(id),
  CONSTRAINT projects_project_manager_id_fkey FOREIGN KEY (project_manager_id) REFERENCES public.users(id)
);
CREATE TABLE public.quotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  client_id uuid,
  quotation_no text UNIQUE,
  amount numeric,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'revised'::text, 'approved'::text, 'rejected'::text, 'expired'::text])),
  sent_at timestamp with time zone,
  approved_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quotations_pkey PRIMARY KEY (id),
  CONSTRAINT quotations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT quotations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT quotations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.site_settings (
  id text NOT NULL DEFAULT 'main'::text CHECK (id = 'main'::text),
  company_name text NOT NULL DEFAULT 'EaseIT CRM'::text,
  brand_logo_url text,
  primary_color text DEFAULT '#046288'::text,
  secondary_color text DEFAULT '#034e6d'::text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT site_settings_pkey PRIMARY KEY (id),
  CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.status_transitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_status_id uuid,
  to_status_id uuid NOT NULL,
  allowed_department_id uuid,
  allowed_role_id uuid,
  requires_note boolean NOT NULL DEFAULT false,
  requires_assignment boolean NOT NULL DEFAULT false,
  requires_follow_up boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT status_transitions_pkey PRIMARY KEY (id),
  CONSTRAINT status_transitions_from_status_id_fkey FOREIGN KEY (from_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT status_transitions_to_status_id_fkey FOREIGN KEY (to_status_id) REFERENCES public.pipeline_statuses(id),
  CONSTRAINT status_transitions_allowed_department_id_fkey FOREIGN KEY (allowed_department_id) REFERENCES public.departments(id),
  CONSTRAINT status_transitions_allowed_role_id_fkey FOREIGN KEY (allowed_role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.support_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  requested_by uuid,
  assigned_to uuid,
  department_id uuid,
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'cancelled'::text])),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_requests_pkey PRIMARY KEY (id),
  CONSTRAINT support_requests_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT support_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT support_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT support_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.transform_ai_models (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  model_id text NOT NULL,
  display_name text NOT NULL,
  supports_inpainting boolean NOT NULL DEFAULT true,
  cost_per_image_usd numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT transform_ai_models_pkey PRIMARY KEY (id),
  CONSTRAINT transform_ai_models_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.transform_ai_providers(id)
);
CREATE TABLE public.transform_ai_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_key text NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  added_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT transform_ai_providers_pkey PRIMARY KEY (id),
  CONSTRAINT transform_ai_providers_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id)
);
CREATE TABLE public.transform_generation_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  step_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'done'::text, 'failed'::text])),
  prompt_used text,
  result_path text,
  cost_usd numeric,
  images_generated integer DEFAULT 1,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT transform_generation_steps_pkey PRIMARY KEY (id),
  CONSTRAINT transform_generation_steps_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.transform_jobs(id)
);
CREATE TABLE public.transform_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_number integer NOT NULL DEFAULT nextval('transform_jobs_job_number_seq'::regclass) UNIQUE,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'queued'::text, 'processing'::text, 'review'::text, 'approved'::text, 'failed'::text])),
  current_step text,
  preset_id uuid,
  config_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_file_path text,
  zones jsonb DEFAULT '{}'::jsonb,
  output_image_path text,
  ai_model_id uuid,
  total_cost_usd numeric,
  duration_seconds integer,
  reviewer_id uuid,
  review_comment text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT transform_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT transform_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT transform_jobs_preset_id_fkey FOREIGN KEY (preset_id) REFERENCES public.transform_presets(id),
  CONSTRAINT transform_jobs_ai_model_id_fkey FOREIGN KEY (ai_model_id) REFERENCES public.transform_ai_models(id),
  CONSTRAINT transform_jobs_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.transform_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT transform_presets_pkey PRIMARY KEY (id),
  CONSTRAINT transform_presets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  label text,
  storage_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_documents_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_social_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_social_links_pkey PRIMARY KEY (id),
  CONSTRAINT user_social_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'Operator'::user_type,
  name text NOT NULL,
  nickname text,
  email text NOT NULL UNIQUE,
  personal_phone text,
  office_phone text,
  gender USER-DEFINED,
  address text,
  date_of_birth date,
  department_id uuid,
  role_id uuid,
  joining_date date DEFAULT CURRENT_DATE,
  current_salary numeric,
  working_procedure text,
  profile_picture text,
  cover_photo text,
  guardian_name text,
  guardian_phone text,
  guardian_relation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  theme_preference text DEFAULT 'system'::text CHECK (theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  employment_status USER-DEFINED NOT NULL DEFAULT 'trainee'::employment_status_enum,
  account_status USER-DEFINED NOT NULL DEFAULT 'active'::account_status_enum,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);