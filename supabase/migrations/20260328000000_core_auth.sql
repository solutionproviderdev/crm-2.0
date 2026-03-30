-- ============================================================
-- CRM 2.0 — Core Auth Schema (Idempotent Version)
-- Clean relational schema replacing old embedded MongoDB docs
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('Admin', 'Operator');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_gender') THEN
        CREATE TYPE public.user_gender AS ENUM ('Male', 'Female', 'Other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE public.user_status AS ENUM ('Active', 'Inactive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE public.document_type AS ENUM (
            'resume', 'nid_copy', 'academic_document', 'bank_account', 'agreement', 'other'
        );
    END IF;
END $$;

-- ── Departments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT        NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Roles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID        REFERENCES public.departments(id) ON DELETE SET NULL,
    name          TEXT        NOT NULL,
    description   TEXT,
    permissions   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (department_id, name)
);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id                  UUID            PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    type                public.user_type NOT NULL DEFAULT 'Operator',
    status              public.user_status NOT NULL DEFAULT 'Active',
    -- Personal
    name                TEXT            NOT NULL,
    nickname            TEXT,
    email               TEXT            UNIQUE NOT NULL,
    personal_phone      TEXT,
    office_phone        TEXT,
    gender              public.user_gender,
    address             TEXT,
    date_of_birth       DATE,
    -- Organization
    department_id       UUID            REFERENCES public.departments(id) ON DELETE SET NULL,
    role_id             UUID            REFERENCES public.roles(id) ON DELETE SET NULL,
    -- Employment
    joining_date        DATE            DEFAULT CURRENT_DATE,
    current_salary      NUMERIC(12, 2),
    working_procedure   TEXT,
    -- Media
    profile_picture     TEXT,
    cover_photo         TEXT,
    -- Guardian
    guardian_name       TEXT,
    guardian_phone      TEXT,
    guardian_relation   TEXT,
    -- Timestamps
    created_at          TIMESTAMPTZ     DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     DEFAULT NOW()
);

-- ── User Documents ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_documents (
    id          UUID                    DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID                    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type        public.document_type    NOT NULL,
    label       TEXT,
    storage_path TEXT                   NOT NULL,
    created_at  TIMESTAMPTZ             DEFAULT NOW()
);

-- ── User Social Links ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_social_links (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    platform    TEXT        NOT NULL,
    url         TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Activity Logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity    TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Auth Trigger Function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'type')::public.user_type, 'Operator'::public.user_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Re-create Trigger ─────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Timestamp Trigger Function ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Re-create Timestamp Triggers ──────────────────────────────
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_departments_updated_at ON public.departments;
CREATE TRIGGER set_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_roles_updated_at ON public.roles;
CREATE TRIGGER set_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs  ENABLE ROW LEVEL SECURITY;

-- ── Permissions Helper ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND type = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Policies ──────────────────────────────────────────────────
-- Departments
DROP POLICY IF EXISTS "departments_select_authenticated" ON public.departments;
CREATE POLICY "departments_select_authenticated" ON public.departments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "departments_all_admin" ON public.departments;
CREATE POLICY "departments_all_admin" ON public.departments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Roles
DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;
CREATE POLICY "roles_select_authenticated" ON public.roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "roles_all_admin" ON public.roles;
CREATE POLICY "roles_all_admin" ON public.roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Users
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
CREATE POLICY "users_select_authenticated" ON public.users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "users_all_admin" ON public.users;
CREATE POLICY "users_all_admin" ON public.users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Storage ───────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('user-media', 'user-media', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "user_media_upload_admin" ON storage.objects;
CREATE POLICY "user_media_upload_admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-media' AND public.is_admin());
DROP POLICY IF EXISTS "user_media_select_authenticated" ON storage.objects;
CREATE POLICY "user_media_select_authenticated" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'user-media');

-- ============================================================
-- ── SEED DATA ───────────────────────────────────────────────
-- ============================================================

-- 1. Departments
INSERT INTO public.departments (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Administration', 'Company administration and HR'),
    ('00000000-0000-0000-0000-000000000002', 'Sales', 'Sales team and client relations'),
    ('00000000-0000-0000-0000-000000000003', 'CRE', 'Customer Relationship Executives'),
    ('00000000-0000-0000-0000-000000000004', 'Operations', 'Operations and project management')
ON CONFLICT (id) DO NOTHING;

-- 2. Default Roles
-- Administration -> Full Admin
INSERT INTO public.roles (name, department_id, description, permissions) VALUES
    ('Super Admin', '00000000-0000-0000-0000-000000000001', 'System administrator with full access', 
     '{
        "User Management": {
            "All Users": true,
            "Create User": true,
            "Departments": true,
            "Roles": true
        }
     }'::jsonb)
ON CONFLICT (department_id, name) DO NOTHING;

-- Sales -> Sales Executive
INSERT INTO public.roles (name, department_id, description, permissions) VALUES
    ('Sales Executive', '00000000-0000-0000-0000-000000000002', 'Handles leads and quotations', 
     '{
        "User Management": {
            "All Users": true,
            "Create User": false,
            "Departments": false,
            "Roles": false
        }
     }'::jsonb)
ON CONFLICT (department_id, name) DO NOTHING;
