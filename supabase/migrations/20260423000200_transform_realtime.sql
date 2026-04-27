-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Enable Supabase Realtime on Transform Studio tables
--
-- This enables the postgres_changes publication for transform_jobs and
-- transform_generation_steps so that the JobProgressTracker component can
-- receive live updates without polling.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add tables to the supabase_realtime publication
-- (The publication already exists in every Supabase project)
ALTER PUBLICATION supabase_realtime ADD TABLE public.transform_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transform_generation_steps;
