-- =================================================================================
-- CRM 2.0 Lead Management Expansion
-- =================================================================================

-- 1. Lead Meetings Table (Replaces 'Meeting' collection and lead.meetings array)
CREATE TABLE IF NOT EXISTS public.lead_meetings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    date DATE NOT NULL,
    slot TEXT NOT NULL, -- e.g. '10:00 AM'
    status TEXT NOT NULL DEFAULT 'Fixed', -- 'Fixed', 'Postponed', 'Rescheduled', 'Canceled', 'Complete', 'Sold', etc.
    meeting_flow_status TEXT, -- 'Confirmed', 'Leaved', 'Arrived', 'Ongoing', 'Completed', 'Canceled'
    
    visit_charge NUMERIC(12, 2) DEFAULT 0,
    
    -- Location tracking (JSONB for leavingFrom and arrivedAt)
    locations JSONB DEFAULT '{}'::jsonb,
    
    audit_fields JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Lead Payments Table (Replaces lead.finance.payments array)
CREATE TABLE IF NOT EXISTS public.lead_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'Cash', 'Cheque', 'Bank Transfer', 'Bkash', etc.
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_status TEXT NOT NULL DEFAULT 'Paid', -- 'Paid', 'Unpaid', 'Pending'
    payment_note TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Lead Call Logs Table (Replaces lead.callLogs array)
CREATE TABLE IF NOT EXISTS public.lead_call_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    recipient_number TEXT NOT NULL,
    call_type TEXT NOT NULL, -- 'Incoming', 'Outgoing'
    status TEXT NOT NULL DEFAULT 'Received', -- 'Missed', 'Received'
    call_duration TEXT, -- Formatted duration e.g. '2m 30s'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.lead_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_call_logs ENABLE ROW LEVEL SECURITY;

-- 5. Basic RLS Policies
CREATE POLICY "Users can view lead meetings" ON public.lead_meetings
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage lead meetings" ON public.lead_meetings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view lead payments" ON public.lead_payments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage lead payments" ON public.lead_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view lead call logs" ON public.lead_call_logs
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage lead call logs" ON public.lead_call_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_lead_meetings_lead_id ON public.lead_meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_payments_lead_id ON public.lead_payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_call_logs_lead_id ON public.lead_call_logs(lead_id);
