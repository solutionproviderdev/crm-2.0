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
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_sales_executive_id_fkey FOREIGN KEY (sales_executive_id) REFERENCES public.users(id),
  CONSTRAINT leads_cre_id_fkey FOREIGN KEY (cre_id) REFERENCES public.users(id)
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