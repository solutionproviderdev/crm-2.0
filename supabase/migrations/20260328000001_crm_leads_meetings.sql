-- Enums
CREATE TYPE public.lead_status AS ENUM (
    'New', 'No Response', 'Number Provided', 'Message Rescheduled', 'Number Collected',
    'Call Reschedule', 'Ongoing', 'Meeting Fixed', 'Meeting Complete', 'Sold',
    'Prospect', 'Measured', 'Material Received', 'Project in Production',
    'Project Complete', 'Handed Over'
);

CREATE TYPE public.meeting_status AS ENUM (
    'Scheduled', 'Complete', 'Rescheduled', 'Postponed', 'Canceled', 'No Show'
);

CREATE TYPE public.project_location AS ENUM ('Inside Dhaka', 'Outside Dhaka');

-- Leads Table
CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phones TEXT[] NOT NULL,
    address TEXT,
    area TEXT,
    district TEXT,
    division TEXT,
    source TEXT DEFAULT 'Manual',
    status public.lead_status DEFAULT 'New',
    temperature INTEGER DEFAULT 50, -- 0-100 indicating hot/cold
    project_requirements TEXT,
    project_location public.project_location DEFAULT 'Inside Dhaka',
    assigned_cre_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_sales_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ
);

-- Calls Table (App Dialer Log)
CREATE TABLE public.calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    duration INTEGER DEFAULT 0, -- in seconds
    call_outcome TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings Table
CREATE TABLE public.meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    sales_rep_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status public.meeting_status DEFAULT 'Scheduled',
    notes TEXT,
    visit_charge NUMERIC(10, 2) DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting Analyses (AI Feedback)
CREATE TABLE public.meeting_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE UNIQUE,
    transcript TEXT,
    win_probability INTEGER CHECK (win_probability >= 0 AND win_probability <= 100),
    sentiment TEXT,
    objections TEXT[],
    next_steps TEXT[],
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_analyses ENABLE ROW LEVEL SECURITY;

-- Leads RLS: Admins and Management see all. CREs see theirs. Sales see theirs.
CREATE POLICY "Full access to admins and management on leads"
    ON public.leads FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND type IN ('Admin', 'Management')));

CREATE POLICY "CREs see their assigned leads"
    ON public.leads FOR SELECT TO authenticated
    USING (assigned_cre_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Sales see their assigned leads"
    ON public.leads FOR SELECT TO authenticated
    USING (assigned_sales_id = auth.uid());

-- Meeting RLS
CREATE POLICY "Full access to admins and management on meetings"
    ON public.meetings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND type IN ('Admin', 'Management')));

CREATE POLICY "Sales see their meetings"
    ON public.meetings FOR SELECT TO authenticated
    USING (sales_rep_id = auth.uid());

CREATE POLICY "CREs see meetings they booked"
    ON public.meetings FOR SELECT TO authenticated
    USING (created_by = auth.uid());
