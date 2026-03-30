-- =================================================================================
-- CRM 2.0 Meeting Booking Expansion
-- =================================================================================

-- 1. Add requirements to leads (Legacy used an array)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb;

-- 2. Add project_location to lead_meetings (Inside, Outside)
ALTER TABLE public.lead_meetings 
ADD COLUMN IF NOT EXISTS project_location TEXT DEFAULT 'Inside';

-- 3. Document the additions
COMMENT ON COLUMN public.leads.requirements IS 'Array of client requirements/tags';
COMMENT ON COLUMN public.lead_meetings.project_location IS 'Meeting location context: Inside or Outside';
