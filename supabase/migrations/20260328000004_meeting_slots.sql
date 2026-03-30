-- =================================================================================
-- Meeting Slots Master Table
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.meeting_slots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_text TEXT NOT NULL UNIQUE, -- e.g. '10:00 AM'
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with hourly slots from 10 AM to 7 PM
INSERT INTO public.meeting_slots (slot_text, display_order) VALUES
    ('10:00 AM', 1),
    ('11:00 AM', 2),
    ('12:00 PM', 3),
    ('01:00 PM', 4),
    ('02:00 PM', 5),
    ('03:00 PM', 6),
    ('04:00 PM', 7),
    ('05:00 PM', 8),
    ('06:00 PM', 9),
    ('07:00 PM', 10)
ON CONFLICT (slot_text) DO NOTHING;

-- RLS
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view meeting slots"
    ON public.meeting_slots FOR SELECT
    TO authenticated
    USING (true);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_meeting_slots_display_order ON public.meeting_slots(display_order);
