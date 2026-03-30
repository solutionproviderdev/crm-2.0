-- ── Users Table Enhancement ───────────────────────────────────────────────
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system' 
CHECK (theme_preference IN ('light', 'dark', 'system'));

-- ── Site Settings Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  company_name TEXT NOT NULL DEFAULT 'EaseIT CRM',
  brand_logo_url TEXT,
  primary_color TEXT DEFAULT '#046288',
  secondary_color TEXT DEFAULT '#034e6d',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ── RLS for Site Settings ────────────────────────────────────────────────
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site settings
CREATE POLICY "Allow public read access to site settings"
ON site_settings FOR SELECT
TO authenticated
USING (true);

-- Only Admins can update site settings
CREATE POLICY "Allow Admin to update site settings"
ON site_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.type = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.type = 'Admin'
  )
);

-- ── Initial Setup ────────────────────────────────────────────────────────
INSERT INTO site_settings (id, company_name, primary_color, secondary_color)
VALUES ('main', 'EaseIT CRM', '#046288', '#034e6d')
ON CONFLICT (id) DO NOTHING;
