-- 1. First create the auth.users entry for the sentinel
-- (Required because public.users.id has FK to auth.users.id)
-- Do this MANUALLY in Supabase Dashboard:
--   Authentication → Users → "Add User"
--   Email: deleted-user@system.internal
--   Password: (any strong random password, will never be used)
--   Copy the generated UUID → use it below as [SENTINEL_UUID]

-- 2. Insert sentinel into public.users
INSERT INTO public.users (
  id,
  type,
  name,
  email,
  account_status,
  employment_status
)
VALUES (
  '45ae1570-0751-441d-b93c-1690ae2eda74',   -- paste the UUID from step above
  'Operator',
  '[Deleted User]',
  'deleted-user@system.internal',
  'inactive',
  'terminated'
)
ON CONFLICT (id) DO NOTHING;

-- Store the sentinel UUID as a comment for reference:
-- SENTINEL_USER_ID = '45ae1570-0751-441d-b93c-1690ae2eda74'
