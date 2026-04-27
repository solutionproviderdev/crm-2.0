-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Transform Studio tables
-- Purpose:   AI-powered kitchen cabinet visualisation feature.
--            Creates provider/model registry, preset library, job queue,
--            and per-zone generation step tracking.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── AI Provider credentials ────────────────────────────────────────────────
CREATE TABLE public.transform_ai_providers (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  provider_key        text        NOT NULL UNIQUE,
  api_key_encrypted   text        NOT NULL,
  is_active           boolean     NOT NULL DEFAULT true,
  added_by            uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at          timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT transform_ai_providers_pkey PRIMARY KEY (id)
);

-- ── Available models per provider ──────────────────────────────────────────
CREATE TABLE public.transform_ai_models (
  id                    uuid          NOT NULL DEFAULT gen_random_uuid(),
  provider_id           uuid          NOT NULL REFERENCES public.transform_ai_providers(id) ON DELETE CASCADE,
  model_id              text          NOT NULL,
  display_name          text          NOT NULL,
  supports_inpainting   boolean       NOT NULL DEFAULT true,
  cost_per_image_usd    numeric(8,6)  NOT NULL,
  is_active             boolean       NOT NULL DEFAULT true,
  created_at            timestamptz   NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT transform_ai_models_pkey PRIMARY KEY (id),
  CONSTRAINT transform_ai_models_provider_model_unique UNIQUE (provider_id, model_id)
);

-- ── Cabinet configuration presets ──────────────────────────────────────────
CREATE TABLE public.transform_presets (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  is_system   boolean     NOT NULL DEFAULT false,
  created_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  config      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT transform_presets_pkey PRIMARY KEY (id)
);

-- ── Main job table ─────────────────────────────────────────────────────────
CREATE TABLE public.transform_jobs (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  job_number          serial      UNIQUE,
  created_by          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status              text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','queued','processing','review','approved','failed')),
  current_step        text,
  preset_id           uuid        REFERENCES public.transform_presets(id) ON DELETE SET NULL,
  config_snapshot     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  source_file_path    text,
  zones               jsonb       DEFAULT '{}'::jsonb,
  output_image_path   text,
  ai_model_id         uuid        REFERENCES public.transform_ai_models(id) ON DELETE SET NULL,
  total_cost_usd      numeric(8,4),
  duration_seconds    integer,
  reviewer_id         uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  review_comment      text,
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at          timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT transform_jobs_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_transform_jobs_created_by ON public.transform_jobs(created_by, created_at DESC);
CREATE INDEX idx_transform_jobs_status ON public.transform_jobs(status);

-- ── Per-zone generation step tracking ─────────────────────────────────────
CREATE TABLE public.transform_generation_steps (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  job_id            uuid        NOT NULL REFERENCES public.transform_jobs(id) ON DELETE CASCADE,
  step_name         text        NOT NULL,
  status            text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','done','failed')),
  prompt_used       text,
  result_path       text,
  cost_usd          numeric(8,4),
  images_generated  integer     DEFAULT 1,
  error_message     text,
  started_at        timestamptz,
  completed_at      timestamptz,
  CONSTRAINT transform_generation_steps_pkey PRIMARY KEY (id),
  CONSTRAINT transform_generation_steps_job_step_unique UNIQUE (job_id, step_name)
);

CREATE INDEX idx_transform_steps_job_id ON public.transform_generation_steps(job_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.transform_ai_providers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transform_ai_models       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transform_presets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transform_jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transform_generation_steps ENABLE ROW LEVEL SECURITY;

-- ── Providers ──────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read providers"
  ON public.transform_ai_providers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage providers"
  ON public.transform_ai_providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND (
          u.type = 'Admin'
          OR (r.permissions->>'Transform Studio:Admin')::boolean = true
        )
    )
  );

-- ── Models ─────────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read models"
  ON public.transform_ai_models FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage models"
  ON public.transform_ai_models FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND (
          u.type = 'Admin'
          OR (r.permissions->>'Transform Studio:Admin')::boolean = true
        )
    )
  );

-- ── Presets ────────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read presets"
  ON public.transform_presets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own presets"
  ON public.transform_presets FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can update own non-system presets"
  ON public.transform_presets FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND is_system = false);

-- ── Jobs ───────────────────────────────────────────────────────────────────
CREATE POLICY "Operators see own jobs, reviewers see all"
  ON public.transform_jobs FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND (
          u.type = 'Admin'
          OR (r.permissions->>'Transform Studio:Review & Approve Jobs')::boolean = true
        )
    )
  );

CREATE POLICY "Operators create own jobs"
  ON public.transform_jobs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Operators update own jobs, reviewers update any"
  ON public.transform_jobs FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND (
          u.type = 'Admin'
          OR (r.permissions->>'Transform Studio:Review & Approve Jobs')::boolean = true
        )
    )
  );

-- ── Generation steps ───────────────────────────────────────────────────────
CREATE POLICY "Steps visible to job owner and reviewers"
  ON public.transform_generation_steps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transform_jobs j
      WHERE j.id = job_id
        AND (
          j.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
              AND (
                u.type = 'Admin'
                OR (r.permissions->>'Transform Studio:Review & Approve Jobs')::boolean = true
              )
          )
        )
    )
  );

CREATE POLICY "Operators insert steps for own jobs"
  ON public.transform_generation_steps FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transform_jobs j
      WHERE j.id = job_id AND j.created_by = auth.uid()
    )
  );

-- ── Service role bypass ────────────────────────────────────────────────────
CREATE POLICY "Service role full access to jobs"
  ON public.transform_jobs FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to steps"
  ON public.transform_generation_steps FOR ALL TO service_role USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('transform-sources', 'transform-sources', false, 20971520, ARRAY['image/jpeg','image/png','image/webp']),
  ('transform-outputs', 'transform-outputs', false, 20971520, ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;

-- Source images: owner can upload
CREATE POLICY "Users upload own source images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'transform-sources'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own source images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'transform-sources'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role reads all sources"
  ON storage.objects FOR SELECT TO service_role
  USING (bucket_id = 'transform-sources');

-- Output images
CREATE POLICY "Service role writes outputs"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'transform-outputs');

CREATE POLICY "Users read own outputs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'transform-outputs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins and reviewers can read all outputs
CREATE POLICY "Reviewers read all outputs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'transform-outputs'
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND (
          u.type = 'Admin'
          OR (r.permissions->>'Transform Studio:Review & Approve Jobs')::boolean = true
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA — System Presets
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.transform_presets (name, is_system, config) VALUES
(
  'Preset A — Matte White',
  true,
  '{
    "roomType": "kitchen",
    "finishType": "matte",
    "colorCode": "SP-WH01",
    "colorName": "Matte White",
    "handleStyle": "slim silver",
    "countertopMaterial": "quartz",
    "countertopThicknessMm": 20,
    "countertopColor": "warm beige",
    "backsplashDescription": "cream ceramic 60x30cm subway tile",
    "styleTags": ["modern", "minimal"],
    "moodTags": ["clean", "bright"]
  }'::jsonb
),
(
  'Preset B — Two-Tone Oak',
  true,
  '{
    "roomType": "kitchen",
    "finishType": "two-tone",
    "colorCode": "SP-OK03",
    "colorName": "Wood-Texture Oak Lower, Matte White Upper",
    "handleStyle": "J-profile",
    "countertopMaterial": "quartz",
    "countertopThicknessMm": 20,
    "countertopColor": "light grey",
    "backsplashDescription": "white metro tile 30x10cm",
    "styleTags": ["warm contemporary", "Scandinavian"],
    "moodTags": ["cozy", "lived-in"]
  }'::jsonb
),
(
  'Preset C — Gloss Graphite',
  true,
  '{
    "roomType": "kitchen",
    "finishType": "high-gloss",
    "colorCode": "SP-GR07",
    "colorName": "High-Gloss Graphite",
    "handleStyle": "handleless G-profile",
    "countertopMaterial": "sintered stone",
    "countertopThicknessMm": 12,
    "countertopColor": "dark anthracite",
    "backsplashDescription": "large format porcelain 60x120cm dark grey",
    "styleTags": ["modern", "minimal", "luxury"],
    "moodTags": ["premium", "bold"]
  }'::jsonb
);
