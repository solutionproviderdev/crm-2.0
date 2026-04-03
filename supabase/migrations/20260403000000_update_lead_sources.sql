-- Update the lead CID generation function to handle new sources and their abbreviations.
-- This ensures that leads from Instagram (IG), Referral (RF), and Website (WB) 
-- get correctly prefixed Lead IDs.

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

    -- Map source to abbreviation
    CASE NEW.source
        WHEN 'Facebook'   THEN src_code := 'FB';
        WHEN 'WhatsApp'   THEN src_code := 'WA';
        WHEN 'Website'    THEN src_code := 'WB';
        WHEN 'Web'        THEN src_code := 'WB'; -- Legacy support
        WHEN 'Referral'   THEN src_code := 'RF';
        WHEN 'Instagram'  THEN src_code := 'IG';
        WHEN 'Phone'      THEN src_code := 'PH';
        ELSE src_code := 'UN';
    END CASE;

    -- Generate date string DDMonYY in exact uppercase (e.g. 03APR26)
    date_str := UPPER(to_char(CURRENT_DATE, 'DDMonYY'));

    -- Find the highest sequence number for this specific prefix + date today
    SELECT COALESCE(
        MAX(CAST(NULLIF(SPLIT_PART(cid, '-', 3), '') AS INTEGER)), 0
    ) INTO seq_num
    FROM public.leads
    WHERE cid LIKE src_code || '-' || date_str || '-%';

    -- Build the format: WA-03APR26-001
    NEW.cid := src_code || '-' || date_str || '-' || LPAD((seq_num + 1)::TEXT, 3, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing 'Web' leads to 'Website' to maintain consistency with the new source list.
UPDATE public.leads SET source = 'Website' WHERE source = 'Web';
