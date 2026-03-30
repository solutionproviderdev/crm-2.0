-- =================================================================================
-- CRM 2.0 Lead Management Schema
-- =================================================================================

-- 1. Core Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cid TEXT UNIQUE, -- e.g., 'WA-28MAR26-001'
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    source TEXT NOT NULL, -- 'Facebook', 'WhatsApp', 'Web', 'Phone'
    profile_picture TEXT,
    
    -- Using simple text arrays for phones since people can have multiple numbers
    phones TEXT[] DEFAULT '{}',
    
    -- Structured JSONB (replicates embedded Mongoose objects directly)
    address JSONB DEFAULT '{}'::jsonb,
    project_status JSONB DEFAULT '{"status": null, "subStatus": null}'::jsonb,
    finance JSONB DEFAULT '{}'::jsonb,
    page_info JSONB DEFAULT '{}'::jsonb,
    whatsapp_info JSONB DEFAULT '{}'::jsonb,
    
    -- Legacy fields
    bot_responded BOOLEAN DEFAULT false,
    replied_from_system BOOLEAN DEFAULT false,
    ai_bot_reply BOOLEAN DEFAULT false,
    
    -- Foreign Keys for Assignment
    sales_executive_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cre_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    last_assigned TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CID Trigger Logic
CREATE OR REPLACE FUNCTION public.generate_lead_cid()
RETURNS TRIGGER AS $$
DECLARE
    src_code TEXT;
    date_str TEXT;
    seq_num INTEGER;
BEGIN
    -- If CID was explicitly provided, leave it alone
    IF NEW.cid IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Map source to abbreviation (matching legacy sourceMap)
    CASE NEW.source
        WHEN 'Facebook' THEN src_code := 'FB';
        WHEN 'WhatsApp' THEN src_code := 'WA';
        WHEN 'Web'      THEN src_code := 'WB';
        WHEN 'Phone'    THEN src_code := 'PH';
        ELSE src_code := 'UN';
    END CASE;

    -- Generate date string DDMonYY in exact uppercase (e.g. 28MAR26)
    date_str := UPPER(to_char(CURRENT_DATE, 'DDMonYY'));

    -- Find the highest sequence number for this specific prefix + date today
    SELECT COALESCE(
        MAX(CAST(NULLIF(SPLIT_PART(cid, '-', 3), '') AS INTEGER)), 0
    ) INTO seq_num
    FROM public.leads
    WHERE cid LIKE src_code || '-' || date_str || '-%';

    -- Build the format: WA-28MAR26-001
    NEW.cid := src_code || '-' || date_str || '-' || LPAD((seq_num + 1)::TEXT, 3, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_lead_cid ON public.leads;
CREATE TRIGGER trigger_generate_lead_cid
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.generate_lead_cid();


-- 3. Lead Comments Table (Replaces embedded comment[] schema)
CREATE TABLE IF NOT EXISTS public.lead_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    comment_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Follow-Ups / Reminders Table
CREATE TABLE IF NOT EXISTS public.lead_follow_ups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT, -- 'Call', 'Meeting', 'Reminder'
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Complete', 'Missed', 'Late Complete'
    time TIMESTAMPTZ NOT NULL,
    comment_id UUID REFERENCES public.lead_comments(id) ON DELETE SET NULL,
    ten_min_notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Row Level Security (RLS) policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all leads for global search and stats but filter safely in application
CREATE POLICY "Users can view all leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert leads" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update leads" ON public.leads
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Comments visibility
CREATE POLICY "Users can view all lead comments" ON public.lead_comments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert comments" ON public.lead_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Follow-up visibility
CREATE POLICY "Users can view all follow-ups" ON public.lead_follow_ups
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can execute follow-ups" ON public.lead_follow_ups
    FOR ALL USING (auth.role() = 'authenticated');
