-- ── Storage Configuration ─────────────────────────────────────

-- 1. Ensure bucket is public for URL serving
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-media';

-- 2. Clean up previous restrictive policies
DROP POLICY IF EXISTS "user_media_upload_admin" ON storage.objects;
DROP POLICY IF EXISTS "user_media_select_authenticated" ON storage.objects;

-- 3. Create granular access policies

-- Allow anyone to VIEW media (since bucket is public, this is mainly for clarity/future proofing)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-media');

-- Allow authenticated users to UPLOAD their own profile assets
-- Path structure: profiles/{user_id}/*
CREATE POLICY "Users can upload own profile assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-media' AND 
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to UPDATE their own profile assets
CREATE POLICY "Users can update own profile assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'user-media' AND 
    (storage.foldername(name))[1] = 'profiles' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow admins to manage EVERYTHING (branding, other users' assets)
CREATE POLICY "Admins can manage all media"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'user-media' AND 
    public.is_admin()
)
WITH CHECK (
    bucket_id = 'user-media' AND 
    public.is_admin()
);
