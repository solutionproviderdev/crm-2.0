# Auth System Handoff

Source project: `crm-2.0`

Target use case: rebuild or migrate this authentication architecture into another Next.js project with Supabase.

Important scope notes:

- This document reflects the auth system currently implemented in this repo.
- The app uses Supabase email/password authentication with SSR cookie sessions.
- Public signup, forgot-password, reset-password, and auth callback routes are not implemented as standalone pages.
- User creation is primarily admin-driven from the protected Users module.
- Password change exists for already-authenticated users in protected settings.
- There is a legacy login action at `app/(auth)/login/actions.ts`; the current login page imports `login` from `app/actions/auth.ts`.

## 1. Auth Overview

### Auth Method

The app uses Supabase Auth with email/password credentials.

Main packages:

- `@supabase/ssr`
- `@supabase/supabase-js`

Session persistence uses Supabase SSR cookie handling through:

- browser client: `createBrowserClient`
- server client: `createServerClient`
- middleware session refresh: `createServerClient` inside Next middleware

### Supabase Auth Flow

The runtime auth flow is:

1. User submits email/password on `/login`.
2. Server action calls `supabase.auth.signInWithPassword`.
3. Supabase sets auth cookies through the SSR server client.
4. The action fetches or creates a matching row in `public.users`.
5. Inactive users are immediately signed out.
6. Active users are redirected client-side to `/dashboard`.
7. Middleware refreshes the session on future requests.
8. Protected layout loads the full `public.users` profile and role.

### Login Flow

Current login page:

- File: `app/(auth)/login/page.tsx`
- Action used: `app/actions/auth.ts -> login(formData)`
- Fields:
  - `email`
  - `password`
  - `remember` checkbox exists in UI but is not used by server logic
- Success behavior:
  - `router.replace("/dashboard")`
  - `router.refresh()`
- Failure behavior:
  - displays returned error string in a red alert box

Login server action behavior:

- Validates `email` and `password` are present.
- Calls `signInWithPassword`.
- Fetches `public.users` joined with `departments` and `roles`.
- If profile is missing, creates a just-in-time profile with:
  - `id = authData.user.id`
  - `email`
  - `name` from user metadata or email prefix
  - `type = "Operator"`
  - `account_status = "active"`
  - `employment_status = "trainee"`
- If `account_status !== "active"`, signs the user out and returns an error.

### Signup Flow

There is no public signup page in the current app.

Implemented user onboarding is admin-driven:

- Admin creates users from `/users/new`.
- `components/employees/AddEmployeeForm.tsx` collects user details and password.
- `lib/supabase/employees.ts -> createEmployee` delegates to `app/actions/users.ts -> createUser`.
- `createUser` uses `supabase.auth.admin.createUser`.
- `email_confirm: true` is set, so admin-created users are immediately confirmed.
- The database trigger creates a base `public.users` row after insertion into `auth.users`.
- The action then updates that row with full employee/profile details.

Bulk user import also exists:

- `components/users/BatchUserImportDialog.tsx`
- `app/actions/users.ts -> bulkCreateUsers`
- Uses `supabase.auth.admin.createUser` in batches.
- Rolls back by deleting the auth user if the profile update fails.

### Logout Flow

Logout is implemented as a server action:

- File: `app/actions/auth.ts`
- Export: `logout()`

Behavior:

1. Creates server Supabase client using request cookies.
2. Calls `supabase.auth.signOut()`.
3. Redirects to `/login`.

The UI entry point is:

- `components/layout/DashboardShell.tsx -> handleLogout`
- `components/layout/UserMenu.tsx -> Sign out menu item`

### Session Persistence Flow

Session persistence is cookie-based through Supabase SSR.

Flow:

1. Supabase stores session cookies after login.
2. `middleware.ts` delegates to `utils/supabase/middleware.ts -> updateSession`.
3. Middleware calls `supabase.auth.getUser()` to validate and refresh session cookies.
4. Middleware copies refreshed cookies to redirect responses.
5. Server components/actions use `utils/supabase/server.ts` with `next/headers` cookies.
6. Browser components use `utils/supabase/client.ts`.

### Protected Route Behavior

This app protects every route except `/login`, subject to matcher exclusions for static files.

Middleware behavior:

- Unauthenticated request to any non-`/login` path redirects to `/login`.
- Authenticated request to `/login` redirects to `/dashboard`.
- Authenticated requests to gated routes are checked against role permissions.
- Failed permission checks redirect to `/dashboard?access_denied=1`.

The protected route group also has a server-side guard:

- File: `app/(protected)/layout.tsx`
- It checks the Supabase session from cookies.
- If no session exists, redirects to `/login`.
- It fetches the `public.users` profile using the service role client.
- If profile is missing, signs out and redirects to `/login?error=profile_not_found`.

### Role/User Profile Handling

The app mirrors Supabase Auth users into a custom `public.users` table.

Role model:

- `public.users.type`: enum `Admin | Operator`
- `public.users.role_id`: FK to `public.roles.id`
- `public.roles.permissions`: JSONB permission map
- `public.departments`: optional grouping for roles/users

Access control layers:

- Middleware route gates use `lib/permissions.ts`.
- UI navigation filtering uses the same permission map.
- Database RLS uses `public.is_admin()` for admin-only table operations.
- Some admin server actions use the Supabase service role key only after checking the current user is Admin.

## 2. Dependencies

Auth-related packages from `package.json`:

### Supabase

- `@supabase/ssr` `^0.9.0`
  - Browser/server SSR clients.
  - Cookie-based session persistence in middleware and server actions.
- `@supabase/supabase-js` `^2.100.0`
  - Service role admin client.
  - Admin Auth API for creating/updating/deleting users.

### Next/React Runtime

- `next` `16.2.1`
- `react` `19.2.4`
- `react-dom` `19.2.4`

### Form and State Handling

- Native `FormData` and React state are used by the login form.
- `react-hook-form` `^7.72.0` is installed but not used by the current login screen.

### Validation

- No dedicated validation library is used for auth.
- Validation is manual:
  - login: email/password required
  - password update: passwords match, minimum 6 characters
  - user import: custom parsing/validation utilities

### Cookie/Session Packages

- No standalone cookie package is used.
- Cookie handling uses:
  - `next/headers`
  - `NextRequest`
  - `NextResponse`
  - `@supabase/ssr`

### Auth UI Dependencies

- `lucide-react` `^1.7.0`
  - login icons, user menu icons, security/settings icons
- `next-themes` `^0.4.6`
  - user theme preference UI in account menu/settings
- `sonner` `^2.0.7`
  - password update/profile update toast notifications
- Radix UI wrappers:
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-slot`
  - plus local `components/ui/*`
- Styling:
  - `tailwindcss`
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`

## 3. Environment Variables

### Required For Current Auth

The code currently uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

If Project A uses the conventional anon key name, either:

- rename usages in the copied files to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or
- define both env vars with the same anon/publishable key.

| Variable | Used By | Client Safe | Required | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `utils/supabase/*`, realtime provider, scripts | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | browser/server/middleware Supabase clients | Yes | Yes | Supabase anon/publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Not used by current code | Yes | Recommended alias | Conventional Supabase anon key name for Project A |
| `SUPABASE_SERVICE_ROLE_KEY` | `utils/supabase/admin.ts`, user admin actions, scripts | No | Yes for admin user management/protected layout | Service role key that bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | legacy `app/(auth)/login/actions.ts -> resendConfirmation` | Yes | Only if using resend confirmation action | Builds email confirmation redirect URL |
| `NEXT_PUBLIC_SENTINEL_USER_ID` | lead queries and system constants patterns | Yes | Optional/auth-adjacent | Excludes deleted-user sentinel from lookups |

### Auth-Adjacent Non-Core Variables

These are not needed for basic auth but exist in the repo:

- `TRANSFORM_EDGE_FUNCTION_URL`
- Deno Edge Function secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Example `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional if using deleted-user sentinel patterns
NEXT_PUBLIC_SENTINEL_USER_ID=00000000-0000-0000-0000-000000000000
```

Security classification:

- Safe for browser:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- Server-only:
  - `SUPABASE_SERVICE_ROLE_KEY`

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components or `NEXT_PUBLIC_*`.

## 4. Supabase Setup

### Required Auth Providers

Current app requires:

- Email/password provider enabled.

No OAuth providers are implemented in code:

- No `signInWithOAuth`
- No auth callback route
- No provider buttons on login page

### Email/Password Settings

Recommended settings to match current app:

- Enable Email provider.
- Enable password login.
- Public signup may be disabled if all users are admin-created.
- If admin creates users with `email_confirm: true`, email confirmation is not required for those accounts.

### Redirect URL Settings

Current production login flow does not rely on a callback URL.

If using the legacy resend confirmation action, configure:

- Site URL: value of `NEXT_PUBLIC_SITE_URL`
- Redirect URL: `${NEXT_PUBLIC_SITE_URL}/login`

Recommended Supabase Auth redirect URLs for Project A:

```text
http://localhost:3000/login
http://localhost:3000/auth/callback
https://your-domain.com/login
https://your-domain.com/auth/callback
```

Only `/login` is implemented in this repo. `/auth/callback` is included above as a recommended target if Project A adds OAuth or magic-link/password-reset callbacks.

### Email Confirmation Behavior

Implemented behavior:

- Admin-created users call `auth.admin.createUser({ email_confirm: true })`.
- JIT profile provisioning handles users that exist in Auth but are missing from `public.users`.
- Legacy `resendConfirmation(email)` exists in `app/(auth)/login/actions.ts`, but the current login page does not use it.

### Password Reset Behavior

There is no public forgot-password or reset-password route.

Implemented password behavior:

- Authenticated users can change their own password at `/settings/security`.
- Admins can update another user's password via `app/actions/users.ts -> adminUpdatePassword`, though a full dedicated UI for that specific action was not identified in the auth screen scan.

To add public password reset in Project A:

1. Add forgot-password page that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
2. Add callback/update-password page that calls `supabase.auth.updateUser({ password })`.
3. Add redirect URLs in Supabase Dashboard.

### Storage Policies Related To Auth

`user-media` bucket is used for profile pictures and cover photos.

Initial core migration creates:

- bucket: `user-media`
- initial public flag: `false`
- insert policy: admin-only upload
- select policy: authenticated users can read

Later migration `20260329000001_storage_fixes.sql` changes user-media behavior:

- sets `user-media` bucket public
- applies granular policies for authenticated user media and branding uploads

The app stores profile image URLs on:

- `public.users.profile_picture`
- `public.users.cover_photo`

### RLS Policies Related To Auth

Core RLS:

- `public.users`: authenticated users can select; users can update own row; admins can do all.
- `public.departments`: authenticated users can select; admins can do all.
- `public.roles`: authenticated users can select; admins can do all.
- `public.site_settings`: authenticated users can select; admins can update.

Admin check:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND type = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

## 5. Database Schema

### Auth Mirror Table: `public.users`

Current schema from `supabase/sql/currentstage.sql`:

```sql
CREATE TABLE public.users (
  id uuid NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'Operator'::user_type,
  name text NOT NULL,
  nickname text,
  email text NOT NULL UNIQUE,
  personal_phone text,
  office_phone text,
  gender USER-DEFINED,
  address text,
  date_of_birth date,
  department_id uuid,
  role_id uuid,
  joining_date date DEFAULT CURRENT_DATE,
  current_salary numeric,
  working_procedure text,
  profile_picture text,
  cover_photo text,
  guardian_name text,
  guardian_phone text,
  guardian_relation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  theme_preference text DEFAULT 'system'::text
    CHECK (theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  employment_status USER-DEFINED NOT NULL DEFAULT 'trainee'::employment_status_enum,
  account_status USER-DEFINED NOT NULL DEFAULT 'active'::account_status_enum,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
```

Notes:

- `id` mirrors `auth.users.id`.
- Current snapshot FK does not show `ON DELETE CASCADE`; the original migration did. Verify live DB before relying on cascade behavior.
- `status` was removed and replaced by:
  - `account_status`
  - `employment_status`

### `public.departments`

```sql
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
```

### `public.roles`

```sql
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
```

The initial migration also defined:

```sql
UNIQUE (department_id, name)
```

Verify this exists in Project A after migration if role uniqueness matters.

### `public.user_documents`

```sql
CREATE TABLE public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  label text,
  storage_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_documents_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### `public.user_social_links`

```sql
CREATE TABLE public.user_social_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_social_links_pkey PRIMARY KEY (id),
  CONSTRAINT user_social_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### `public.user_activity_logs`

```sql
CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### Enums

Core migration creates:

```sql
CREATE TYPE public.user_type AS ENUM ('Admin', 'Operator');
CREATE TYPE public.user_gender AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE public.document_type AS ENUM (
  'resume', 'nid_copy', 'academic_document', 'bank_account', 'agreement', 'other'
);
```

Legacy enum originally created and later removed from users:

```sql
CREATE TYPE public.user_status AS ENUM ('Active', 'Inactive');
```

Employee status migration creates:

```sql
CREATE TYPE employment_status_enum AS ENUM (
  'trainee',
  'probationary',
  'permanent',
  'contract',
  'part_time',
  'internship',
  'resigned',
  'terminated',
  'retired',
  'suspended',
  'on_notice_period',
  'absconded',
  'deceased',
  'transferred',
  'deputed'
);

CREATE TYPE account_status_enum AS ENUM (
  'active',
  'inactive',
  'pending',
  'locked',
  'archived'
);
```

### Auth Trigger

Migration: `supabase/migrations/20260328000000_core_auth.sql`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'type')::public.user_type, 'Operator'::public.user_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to:

- `public.users`
- `public.departments`
- `public.roles`

### Core RLS Policies

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
```

Policies:

```sql
CREATE POLICY "departments_select_authenticated"
ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments_all_admin"
ON public.departments FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "roles_select_authenticated"
ON public.roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_all_admin"
ON public.roles FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "users_select_authenticated"
ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_update_own"
ON public.users FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "users_all_admin"
ON public.users FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### Seed Data

Initial departments:

- Administration
- Sales
- CRE
- Operations

Initial roles:

- Super Admin
- Sales Executive

Caution: the initial seed permission keys use `"User Management"` but the current application permission map uses `"User"`. Project A should seed roles with the current `lib/permissions.ts` shape, not blindly rely on the old seed JSON.

Deleted user sentinel:

- Migration: `20260412135600_add_deleted_user_sentinel.sql`
- Requires manually creating an `auth.users` entry first.
- Inserts `public.users` row for `deleted-user@system.internal`.

## 6. File Map

### Core Supabase Client Files

#### `utils/supabase/client.ts`

- Responsibility: browser Supabase client.
- Key export: `createClient()`.
- Dependencies:
  - `@supabase/ssr -> createBrowserClient`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- Copy/adapt:
  - Copy directly if Project A uses same env var names.
  - Adapt key name to `NEXT_PUBLIC_SUPABASE_ANON_KEY` if needed.

#### `utils/supabase/server.ts`

- Responsibility: server Supabase client for Server Components and Server Actions.
- Key export: `createClient(cookieStore)`.
- Dependencies:
  - `@supabase/ssr -> createServerClient`
  - `next/headers -> cookies`
- Copy/adapt:
  - Copy directly for Next App Router.
  - Check Next version cookie API; this project uses async `cookies()`.

#### `utils/supabase/middleware.ts`

- Responsibility: session refresh, auth redirect, route permission enforcement.
- Key export: `updateSession(request)`.
- Dependencies:
  - `@supabase/ssr`
  - `next/server`
  - `lib/permissions`
- Copy/adapt:
  - Adapt public route list and permission route map to Project A routes.
  - Keep cookie-copy logic on redirects.

#### `utils/supabase/admin.ts`

- Responsibility: service role Supabase client.
- Key export: `createAdminClient()`.
- Dependencies:
  - `@supabase/supabase-js`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Copy/adapt:
  - Copy, but enforce server-only usage.
  - Do not import into client components.

### Middleware

#### `middleware.ts`

- Responsibility: Next root middleware entry point.
- Key export: `middleware(request)`.
- Config:
  - excludes `_next/static`, `_next/image`, favicon, image files.
- Copy/adapt:
  - Copy for App Router.
  - Update matcher if Project A has public API routes or assets.

### Auth Routes

#### `app/(auth)/layout.tsx`

- Responsibility: simple route group layout for auth pages.
- Key export: default `AuthLayout`.
- Copy/adapt:
  - Optional; can copy directly.

#### `app/(auth)/login/page.tsx`

- Responsibility: login UI.
- Key behavior:
  - Client component.
  - Calls `app/actions/auth.ts -> login`.
  - Redirects to `/dashboard` on success.
  - Shows inline error state on failure.
- Dependencies:
  - `next/navigation`
  - `lucide-react`
  - `app/actions/auth`
  - Tailwind classes and inline style block
- Copy/adapt:
  - Adapt branding, target redirect route, and UI styling.
  - Remove unused remember checkbox or implement persistence behavior if needed.
  - Wire forgot password button if Project A implements password reset.

#### `app/(auth)/login/actions.ts`

- Responsibility: legacy login action and resend confirmation.
- Key exports:
  - `login(prevState, formData)`
  - `resendConfirmation(email)`
- Current usage:
  - Not used by `app/(auth)/login/page.tsx`.
- Copy/adapt:
  - Do not copy unless using `useActionState` style login or resend confirmation.
  - If copied, align with current `app/actions/auth.ts` to avoid duplicate login implementations.

### Auth Server Actions

#### `app/actions/auth.ts`

- Responsibility: current login/logout/current-user actions.
- Key exports:
  - `login(formData)`
  - `logout()`
  - `getCurrentUser()`
- Dependencies:
  - `next/headers`
  - `next/navigation`
  - `utils/supabase/server`
  - `lib/types`
- Copy/adapt:
  - Copy and adapt profile table name/columns if Project A differs.
  - Keep JIT provisioning only if desired.
  - Adapt inactive account behavior to Project A policy.

#### `app/actions/users.ts`

- Responsibility: user management and admin auth operations.
- Auth-related exports:
  - `createUser`
  - `bulkCreateUsers`
  - `deleteUser`
  - `adminUpdatePassword`
  - `updateOwnPassword`
  - `getUsers`
  - `getUserById`
- Dependencies:
  - service role client
  - standard server client
  - user/role/department schema
- Copy/adapt:
  - Adapt heavily if Project A user model differs.
  - Keep admin check before service role usage.

#### `lib/supabase/employees.ts`

- Responsibility: employee wrappers around user actions.
- Key exports:
  - `createEmployee`
  - `updateEmployee`
  - `getEmployees`
  - status helpers
- Copy/adapt:
  - Do not copy unless Project A has employee/user management module.

### Protected Layout And Providers

#### `app/(protected)/layout.tsx`

- Responsibility:
  - session check
  - profile load
  - protected shell wrapping
  - profile-missing signout
- Dependencies:
  - `createClient`
  - `createAdminClient`
  - `DashboardShell`
  - `BrandProvider`
  - `RealtimeNotificationProvider`
  - `getSiteSettings`
- Copy/adapt:
  - Adapt to Project A shell/providers.
  - If avoiding service role here, ensure RLS allows current user profile read.

#### `components/providers/UserProvider.tsx`

- Responsibility: client-side current user context.
- Key exports:
  - `UserProvider`
  - `useUser`
- Copy/adapt:
  - Copy if Project A needs current profile in client components.
  - Adapt `User` type import.

#### `components/layout/DashboardShell.tsx`

- Responsibility:
  - dashboard shell
  - navigation filtering by permission
  - logout handler
  - access-denied toast
  - wraps `UserProvider`
- Dependencies:
  - `app/actions/auth -> logout`
  - `lib/permissions`
  - `TopNavbar`
  - `UserProvider`
- Copy/adapt:
  - Adapt heavily to Project A layout and routes.

#### `components/layout/UserMenu.tsx`

- Responsibility:
  - user avatar menu
  - profile/settings links
  - theme switcher
  - sign out button
- Dependencies:
  - Radix dropdown/avatar wrappers
  - `next-themes`
  - `lucide-react`
- Copy/adapt:
  - Adapt links and UI dependencies.

#### `components/layout/TopNavbar.tsx`

- Responsibility:
  - top nav rendering
  - displays brand and current nav links
  - hosts `UserMenu`
- Copy/adapt:
  - Adapt layout-specific routes/branding.

### Permission Files

#### `lib/permissions.ts`

- Responsibility:
  - defines all permission resources/actions
  - maps permission keys to route prefixes
  - exports route checking helpers
- Key exports:
  - `ALL_PERMISSIONS`
  - `PermissionMap`
  - `PUBLIC_DASHBOARD_ROUTES`
  - `PERMISSION_ROUTE_MAP`
  - `getAllowedRoutes`
  - `isRouteAllowed`
- Copy/adapt:
  - Adapt required for Project A routes.

#### `lib/types.ts`

- Responsibility: TypeScript models for users, roles, departments, action results, and business data.
- Auth-related exports:
  - `User`
  - `Role`
  - `Department`
  - `CreateUserInput`
  - `UpdateUserInput`
  - `ActionResult`
- Copy/adapt:
  - Extract only auth/user types if Project A has different business domain.

#### `constants/employeeStatus.ts`

- Responsibility: allowed account/employment statuses and display helpers.
- Copy/adapt:
  - Copy if retaining `account_status` and `employment_status`.

### Account UI

#### `app/(protected)/settings/security/page.tsx`

- Responsibility: authenticated password update UI.
- Key action:
  - `updateOwnPassword(currentPassword, newPassword)`
- Validation:
  - new/confirm match
  - new password at least 6 characters
- Copy/adapt:
  - Copy if Project A has protected settings.

#### `app/(protected)/settings/profile/page.tsx`

- Responsibility:
  - current user nickname
  - avatar/cover upload
  - theme preference
- Auth relevance:
  - consumes `useUser`
  - updates `public.users`
- Copy/adapt:
  - Adapt if Project A needs profile management.

### Admin User Creation UI

#### `app/(protected)/users/new/page.tsx`

- Responsibility: loads departments/roles and renders user creation form.
- Copy/adapt:
  - Copy only if Project A supports admin-created users.

#### `components/employees/AddEmployeeForm.tsx`

- Responsibility: form for creating a user/auth account.
- Fields:
  - name
  - nickname
  - email
  - password
  - type
  - account status
  - employment status
  - department
  - role
  - personal/office details
- Copy/adapt:
  - Adapt heavily for Project A.

#### `components/users/BatchUserImportDialog.tsx`

- Responsibility: bulk create users from CSV/XLSX.
- Auth behavior:
  - calls `bulkCreateUsers`
  - each row creates Supabase Auth user and profile row
- Copy/adapt:
  - Do not copy unless Project A needs bulk user onboarding.

### Not Present

The following requested file categories do not exist in this repo:

- `app/signup/*`
- `app/reset-password/*`
- `app/forgot-password/*`
- `app/auth/callback/*`
- `app/api/auth/*`
- `hooks/useAuth*`
- `providers/AuthProvider`
- standalone protected route component

Current equivalents:

- `UserProvider` is a profile context, not a full auth provider.
- Middleware and `(protected)/layout.tsx` perform route protection.

## 7. Auth Flow Diagrams

### Login

```text
User opens /login
→ LoginPage renders email/password form
→ User submits form
→ app/actions/auth.login(formData)
→ create server Supabase client from cookies
→ supabase.auth.signInWithPassword({ email, password })
→ Supabase writes auth cookies through SSR client
→ action fetches public.users + department + role
→ if profile missing, create JIT public.users row
→ if account_status is not active, signOut and return error
→ return user
→ client router.replace("/dashboard")
→ middleware validates refreshed session
→ protected layout loads profile
→ dashboard renders
```

### Signup / User Creation

Current implemented admin-created flow:

```text
Admin opens /users/new
→ AddEmployeeForm collects email/password/profile/role fields
→ createEmployee(input)
→ app/actions/users.createUser(input)
→ verify current user is authenticated Admin
→ create service role client
→ supabase.auth.admin.createUser({ email, password, email_confirm: true, metadata })
→ auth.users insert fires on_auth_user_created trigger
→ public.handle_new_user inserts base public.users row
→ server action updates public.users with full profile
→ UI redirects to /users/{id}
```

Public signup is not implemented. If Project A needs it:

```text
User submits signup form
→ supabase.auth.signUp({ email, password, options.data })
→ Supabase sends confirmation email if confirmations enabled
→ auth.users insert fires trigger after confirmation/user creation
→ public.users profile is created
→ user confirms email
→ redirect to configured URL
→ user logs in
```

### Logout

```text
User opens account menu
→ clicks Sign out
→ DashboardShell.handleLogout()
→ app/actions/auth.logout()
→ server Supabase client from cookies
→ supabase.auth.signOut()
→ redirect("/login")
→ middleware allows /login
```

### Password Reset

Not implemented as public reset flow.

Implemented authenticated password update:

```text
User opens /settings/security
→ enters current password, new password, confirmation
→ client validates match and minimum length
→ updateOwnPassword(currentPassword, newPassword)
→ action calls supabase.auth.getUser()
→ re-authenticates with signInWithPassword({ email, currentPassword })
→ calls supabase.auth.updateUser({ password: newPassword })
→ toast success/error
```

Recommended public reset flow for Project A:

```text
User requests password reset
→ supabase.auth.resetPasswordForEmail(email, { redirectTo })
→ user clicks email link
→ callback/update-password page receives recovery session
→ user submits new password
→ supabase.auth.updateUser({ password })
→ redirect to /login or /dashboard
```

### Protected Route

```text
Browser requests protected path
→ middleware.ts calls updateSession(request)
→ create Supabase middleware client with request cookies
→ supabase.auth.getUser() validates/refreshes session
→ if no user and path is not /login, redirect to /login
→ if user and path is /login, redirect to /dashboard
→ if route is public authenticated route, allow
→ if route is gated, fetch users.type and role_id
→ if Admin, allow
→ else fetch roles.permissions
→ isRouteAllowed(pathname, permissions, false)
→ allow or redirect to /dashboard?access_denied=1
```

## 8. Middleware / Session Handling

### Exact Middleware Files

- `middleware.ts`
- `utils/supabase/middleware.ts`

### Matcher Config

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Implication:

- Middleware runs on almost every route except static/image files.
- API routes are matched by root matcher, but `utils/supabase/middleware.ts` explicitly skips permission checks for `/api`.
- Since `/api` is not treated as public before auth check, unauthenticated API requests may still be redirected unless route matching is adjusted.

### Session Refresh

`updateSession` creates:

```ts
const supabase = createServerClient(supabaseUrl, supabaseKey, {
  cookies: {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      supabaseResponse = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options)
      );
    },
  },
});
```

Then:

```ts
const { data: { user } } = await supabase.auth.getUser();
```

`getUser()` validates the JWT with Supabase and refreshes cookies when needed.

### Cookie Handling On Redirects

When redirecting, the middleware copies cookies from `supabaseResponse` to the redirect response:

```ts
supabaseResponse.cookies.getAll().forEach((cookie) => {
  redirectResponse.cookies.set(cookie.name, cookie.value);
});
```

This is important. Without copying cookies, session refresh can be lost during redirects.

### Protected Route Detection

Current logic:

```ts
const isPublicRoute = pathname === "/login";
```

Everything except `/login` requires authentication.

Authenticated public routes:

```ts
export const PUBLIC_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/profile",
  "/reminders",
  "/chat",
  "/settings",
];
```

Gated routes are values from `PERMISSION_ROUTE_MAP`.

### Redirect Rules

- No user + path not `/login`:
  - redirect to `/login`
- User + path `/login`:
  - redirect to `/dashboard`
- User + gated path + no permission:
  - redirect to `/dashboard?access_denied=1`

### Server vs Client Supabase Clients

Browser client:

- File: `utils/supabase/client.ts`
- Uses `createBrowserClient`.
- Used in client components for direct browser-side Supabase calls.

Server client:

- File: `utils/supabase/server.ts`
- Uses `createServerClient`.
- Requires cookie store.
- Used in Server Actions and Server Components.

Middleware client:

- File: `utils/supabase/middleware.ts`
- Uses `createServerClient`.
- Manually wires request/response cookies.

Admin client:

- File: `utils/supabase/admin.ts`
- Uses `@supabase/supabase-js createClient`.
- Uses service role key.
- Bypasses RLS.
- Must be used only server-side after app-level authorization.

## 9. UI Screens / Components

### Login Page

File: `app/(auth)/login/page.tsx`

Fields:

- email
- password
- remember checkbox, not wired

Controls:

- password visibility toggle
- submit button
- forgot password button, not wired

Validation:

- HTML `required`
- server checks email/password presence

Error states:

- action error displayed in red alert
- invalid credentials show Supabase message or fallback

Loading state:

- React `useTransition`
- submit button disabled
- spinner icon and "Signing in..."

Redirect:

- success redirects to `/dashboard`

Styling:

- Tailwind utility classes
- inline component-scoped style block
- `lucide-react` icons

### Signup Page

Not implemented.

Equivalent admin-create UI:

- `app/(protected)/users/new/page.tsx`
- `components/employees/AddEmployeeForm.tsx`

### Forgot Password Page

Not implemented.

Login page has a "Forgot password?" button with no click handler.

### Reset Password Page

Not implemented.

### Auth Callback Page

Not implemented.

No OAuth, magic link, or exchange-code callback route exists.

### User Avatar/Menu

File: `components/layout/UserMenu.tsx`

Displays:

- avatar image from `user.profile_picture`
- fallback initials
- user name
- user type

Menu actions:

- My Profile -> `/users/{user.id}`
- Settings -> `/settings`
- theme controls
- Sign out

### Logout Button

Implemented as dropdown menu item in `UserMenu`.

Flow:

- `UserMenu` receives `onLogout`.
- `DashboardShell` passes `handleLogout`.
- `handleLogout` sets loading state and calls `logout()` server action.

### Loading/Error States

Login:

- pending spinner
- inline error alert

Security settings:

- save spinner
- toast success/error

Access denied:

- middleware redirects with query `access_denied=1`
- `DashboardShell` shows bottom toast

## 10. Implementation Instructions For Project A

### Step 1: Install Packages

```bash
npm install @supabase/ssr @supabase/supabase-js lucide-react sonner next-themes
```

If copying the existing UI wrappers, also install the Radix packages used by those components:

```bash
npm install @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-slot
```

If using the broader local UI system, also align:

```bash
npm install class-variance-authority clsx tailwind-merge
```

### Step 2: Add Environment Variables

Add `.env.local` values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use one naming convention consistently. The copied code expects `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

### Step 3: Copy Supabase Client Utilities

Copy/adapt:

- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/middleware.ts`
- `utils/supabase/admin.ts`

Adapt imports if Project A does not use `@/*` path alias.

### Step 4: Add Middleware

Copy/adapt:

- `middleware.ts`
- `lib/permissions.ts`

Change:

- public unauthenticated routes
- protected route prefixes
- permission route mappings
- redirect destinations
- API route handling if Project A has public APIs

### Step 5: Add Database Migrations

Bring over auth-related SQL from:

- `supabase/migrations/20260328000000_core_auth.sql`
- `supabase/migrations/20260329000000_settings_and_branding.sql` if using theme/site settings
- `supabase/migrations/20260329000001_storage_fixes.sql` if using profile media
- `supabase/migrations/20260412124611_add_employee_status_fields.sql` if using account/employment statuses
- `supabase/migrations/20260412135600_add_deleted_user_sentinel.sql` only if using deleted-user sentinel behavior

Apply in order.

### Step 6: Add Auth Actions

Copy/adapt:

- `app/actions/auth.ts`

If supporting admin-created users:

- `app/actions/users.ts`
- `lib/supabase/employees.ts`
- `constants/employeeStatus.ts`
- relevant user types from `lib/types.ts`

### Step 7: Add Routes

Copy/adapt:

- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(protected)/layout.tsx`

Change:

- success redirect route
- protected shell/provider imports
- branding/settings dependencies
- user profile query columns if schema differs

### Step 8: Add Providers/Layout Integration

From root layout:

- `ThemeProvider` from `components/providers/theme-provider`
- `Toaster` from `components/ui/sonner`

From protected layout/shell:

- `UserProvider`
- `DashboardShell`
- `UserMenu`

If Project A already has layout/providers, integrate only:

- Supabase session guard
- current user fetch
- user context
- logout action

### Step 9: Configure Supabase Dashboard

In Supabase Dashboard:

1. Enable Email provider.
2. Decide whether public signup is allowed.
3. If admin-created users only, keep public signup disabled if desired.
4. Add Site URL:
   - `http://localhost:3000`
   - production domain
5. Add Redirect URLs:
   - `http://localhost:3000/login`
   - production `/login`
   - optional `/auth/callback` if Project A adds callback flows
6. Ensure service role key is available only to server environment.
7. Create storage bucket/policies if using user media.

### Step 10: Test

Run:

```bash
npm run dev
npm run build
npm run lint
```

Then manually test the checklist in section 13.

## 11. Copy / Adapt Checklist

### Copy Directly

These can usually be copied with minimal changes:

- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/admin.ts`
- `middleware.ts`
- `components/providers/UserProvider.tsx`
- `constants/employeeStatus.ts` if keeping same statuses

### Adapt Required

These depend on Project A routes/schema/UI:

- `utils/supabase/middleware.ts`
  - adapt route protection and permission mapping
- `lib/permissions.ts`
  - replace CRM routes/resources with Project A routes/resources
- `app/actions/auth.ts`
  - adapt profile table columns and redirect behavior
- `app/(auth)/login/page.tsx`
  - adapt branding, destination route, forgot-password behavior
- `app/(protected)/layout.tsx`
  - replace CRM shell, branding, realtime provider, settings dependency
- `components/layout/DashboardShell.tsx`
  - replace nav items and shell layout
- `components/layout/TopNavbar.tsx`
  - replace branding/nav/search behavior
- `components/layout/UserMenu.tsx`
  - replace profile/settings links
- `lib/types.ts`
  - extract only user/role/department/action types
- `app/actions/users.ts`
  - adapt if user schema differs
- `components/employees/AddEmployeeForm.tsx`
  - adapt if Project A uses admin-created users
- `app/(protected)/settings/security/page.tsx`
  - adapt styling/routes, keep password action logic

### Do Not Copy Unless Needed

- CRM-specific modules:
  - leads
  - meetings
  - transform studio
  - chat
  - dashboard metrics
  - utility map
- `components/users/BatchUserImportDialog.tsx` unless bulk user import is required.
- `lib/supabase/employees.ts` unless Project A models users as employees.
- `app/(auth)/login/actions.ts` unless Project A wants its resend-confirmation logic.
- `supabase/functions/*`; these are Transform Studio, not core auth.

## 12. Integration Risks

### Next.js Version Differences

This repo uses Next.js `16.2.1` and async `cookies()`.

If Project A uses an older Next version:

- `cookies()` may not be async.
- Cache Components behavior may differ.
- Middleware/session APIs may need adjustment.

### App Router vs Pages Router

This implementation assumes App Router:

- `app/`
- Server Actions
- route groups
- Server Components
- `next/navigation`

For Pages Router, rewrite:

- middleware can stay similar
- actions become API routes
- layouts/providers differ

### Supabase SSR Package Version

This repo uses `@supabase/ssr ^0.9.0`.

Cookie handling signatures can change between versions. Validate:

- `getAll`
- `setAll`
- middleware response copying

### Middleware Cookie Handling

Dropping redirect cookie copy can cause session refresh bugs.

Keep this pattern:

```ts
supabaseResponse.cookies.getAll().forEach((cookie) => {
  redirectResponse.cookies.set(cookie.name, cookie.value);
});
```

### RLS / Profile Trigger Mismatch

The app assumes:

- every `auth.users` row has a matching `public.users` row
- trigger `on_auth_user_created` exists
- login can create missing profile as fallback

If Project A uses `profiles` instead of `users`, update all queries/actions.

### Route Conflicts

Current middleware protects all routes except `/login`.

Project A likely needs public routes such as:

- `/`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`
- public API routes

Update `isPublicRoute`.

### UI Dependency Mismatch

The login page uses mostly plain HTML/Tailwind, but user menu/settings use local UI wrappers. If Project A lacks these wrappers, either copy `components/ui/*` dependencies or rewrite UI.

### Env Var Mismatch

Current code uses:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

Many Supabase examples use:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Choose one and update all client/server/middleware files consistently.

### Service Role Overuse

`app/(protected)/layout.tsx` uses service role to fetch current user's profile. This is functional but requires `SUPABASE_SERVICE_ROLE_KEY` at runtime. Project A can avoid this by relying on RLS and using the normal server client, if policies support it.

### Permission Seed Mismatch

Initial migration seed permissions do not match current `lib/permissions.ts`. Update seed data before relying on role gates.

## 13. Testing Checklist

### Manual Auth Tests

- [ ] Login with valid active user.
- [ ] Login with invalid password shows error.
- [ ] Login with missing email/password shows validation error.
- [ ] Authenticated user visiting `/login` redirects to `/dashboard`.
- [ ] Unauthenticated user visiting protected route redirects to `/login`.
- [ ] Refreshing protected page keeps session.
- [ ] Logout clears session and redirects to `/login`.
- [ ] Browser back after logout does not expose protected page.
- [ ] Expired session redirects to `/login`.
- [ ] Missing profile signs out and redirects to `/login?error=profile_not_found`.
- [ ] User with `account_status !== active` is signed out and blocked.
- [ ] Current user profile loads with department and role.
- [ ] Admin can access gated routes.
- [ ] Operator without permission redirects to `/dashboard?access_denied=1`.
- [ ] Operator nav hides unauthorized routes.

### Signup/User Creation Tests

- [ ] Admin creates user from `/users/new`.
- [ ] Created auth user can log in.
- [ ] Created `public.users` row has expected role/department/status.
- [ ] Duplicate email returns useful error.
- [ ] Non-admin cannot create user.
- [ ] Bulk user import creates valid users.
- [ ] Bulk import rolls back auth user if profile update fails.

### Password Tests

- [ ] Authenticated password update succeeds with correct current password.
- [ ] Incorrect current password returns error.
- [ ] New/confirm mismatch blocked client-side.
- [ ] New password shorter than 6 characters blocked client-side.
- [ ] Old password no longer works after update.
- [ ] New password works after logout/login.

### Public Password Reset Tests

Only applicable if Project A adds reset flow:

- [ ] Request reset email.
- [ ] Reset email link lands on callback/update page.
- [ ] New password updates Supabase Auth user.
- [ ] Expired reset link handles error.

### Supabase/RLS Tests

- [ ] `on_auth_user_created` trigger creates `public.users`.
- [ ] `public.is_admin()` returns true for Admin user.
- [ ] Authenticated user can select users/roles/departments.
- [ ] Non-admin cannot update other users via normal client.
- [ ] Admin can manage users/roles/departments.
- [ ] Service role-only operations are not exposed client-side.

## 14. Code Snippets

### Supabase Browser Client

```ts
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
```

### Supabase Server Client

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component; middleware handles refresh.
          }
        },
      },
    },
  );
};
```

### Supabase Admin Client

```ts
import { createClient } from "@supabase/supabase-js";

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase Admin Environment Variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
```

### Middleware Entry

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Middleware Auth Check Core

```ts
const { data: { user } } = await supabase.auth.getUser();
const pathname = request.nextUrl.pathname;
const isPublicRoute = pathname === "/login";

if (!isPublicRoute && !user) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}

if (pathname === "/login" && user) {
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}
```

### User Provider

```tsx
"use client";

import * as React from "react";
import type { User } from "@/lib/types";

const UserContext = React.createContext<{
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
} | undefined>(undefined);

export function UserProvider({
  initialUser,
  children
}: {
  initialUser: User;
  children: React.ReactNode
}) {
  const [user, setUser] = React.useState<User | null>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
```

### Login Handler

```ts
"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult, User } from "@/lib/types";

export async function login(formData: FormData): Promise<ActionResult<User>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Invalid email or password",
    };
  }

  const { data: userFromFetch, error: userError } = await supabase
    .from("users")
    .select("*, department:departments(*), role:roles(*)")
    .eq("id", authData.user.id)
    .single();

  let user = userFromFetch;

  if (userError || !user) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
        type: "Operator",
        account_status: "active",
        employment_status: "trainee",
      })
      .select("*, department:departments(*), role:roles(*)")
      .single();

    if (createError) {
      return {
        success: false,
        error: "Authenticated successfully but profile sync failed. Contact admin.",
      };
    }
    user = newUser;
  }

  if (user.account_status !== "active") {
    await supabase.auth.signOut();
    return { success: false, error: "Your account is not active. Contact admin." };
  }

  return { success: true, data: user as User };
}
```

### Logout Handler

```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
```

### Admin Signup/User Creation Handler

```ts
export async function createUser(input: CreateUserInput): Promise<ActionResult<User>> {
  const supabase = await getServiceRoleClient();

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
        type: input.type,
      },
    });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Failed to create auth user" };
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      nickname: input.nickname || null,
      type: input.type,
      account_status: input.account_status || "active",
      employment_status: input.employment_status || "trainee",
      department_id: input.department_id || null,
      role_id: input.role_id || null,
    })
    .eq("id", authData.user.id)
    .select("*, department:departments(*), role:roles(*)")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as User };
}
```

### Protected Route Layout Example

```tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const adminSupabase = createAdminClient();
  const { data: user, error } = await adminSupabase
    .from("users")
    .select("*, department:departments(id, name), role:roles(id, name, permissions)")
    .eq("id", session.user.id)
    .single();

  if (error || !user) {
    await supabase.auth.signOut();
    redirect("/login?error=profile_not_found");
  }

  return <>{children}</>;
}
```

### Public Signup Handler To Add In Project A

Not present in current repo; use this only if Project A needs public signup:

```ts
"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        type: "Operator",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

### Password Reset Snippets To Add In Project A

Forgot password:

```ts
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
});
```

Update password:

```ts
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

### Environment Example

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### SQL Schema / Trigger / Policies

Minimum auth SQL:

```sql
CREATE TYPE public.user_type AS ENUM ('Admin', 'Operator');
CREATE TYPE public.user_gender AS ENUM ('Male', 'Female', 'Other');

CREATE TABLE public.departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (department_id, name)
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.user_type NOT NULL DEFAULT 'Operator',
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  profile_picture text,
  cover_photo text,
  theme_preference text DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  account_status account_status_enum NOT NULL DEFAULT 'active',
  employment_status employment_status_enum NOT NULL DEFAULT 'trainee',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'type')::public.user_type, 'Operator'::public.user_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND type = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_authenticated"
ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_update_own"
ON public.users FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "users_all_admin"
ON public.users FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "departments_select_authenticated"
ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments_all_admin"
ON public.departments FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "roles_select_authenticated"
ON public.roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_all_admin"
ON public.roles FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
```

Adjust this SQL to include enum creation for `account_status_enum` and `employment_status_enum` before creating `public.users`.

## 15. Final Summary

### Exact Files To Bring Into Project A

Minimum auth/session files:

- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/middleware.ts`
- `utils/supabase/admin.ts`
- `middleware.ts`
- `app/actions/auth.ts`
- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(protected)/layout.tsx` adapted to Project A shell
- `components/providers/UserProvider.tsx`
- `lib/permissions.ts` adapted to Project A routes
- auth-related pieces from `lib/types.ts`

If using current user menu/profile/password UI:

- `components/layout/UserMenu.tsx`
- `components/layout/TopNavbar.tsx` or Project A equivalent
- `components/layout/DashboardShell.tsx` or Project A equivalent
- `app/(protected)/settings/security/page.tsx`
- `app/(protected)/settings/profile/page.tsx`
- `components/ui/avatar.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/sonner.tsx`

If using admin-created users:

- `app/actions/users.ts`
- `lib/supabase/employees.ts`
- `app/(protected)/users/new/page.tsx`
- `components/employees/AddEmployeeForm.tsx`
- `constants/employeeStatus.ts`
- `types/employee.ts`

### Exact Commands To Run

```bash
npm install @supabase/ssr @supabase/supabase-js lucide-react sonner next-themes
npm install @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
```

If Project A already has UI components, install only the missing packages actually used.

Run local checks:

```bash
npm run lint
npm run build
npm run dev
```

Apply Supabase migrations:

```bash
supabase db push
```

Or paste the auth-related SQL into the Supabase SQL Editor in migration order.

### Exact Supabase Dashboard Settings

Configure:

1. Authentication -> Providers -> Email:
   - Enable Email provider.
   - Enable password sign-in.
   - Decide whether public signup is enabled. Disable it if users are admin-created only.
2. Authentication -> URL Configuration:
   - Site URL local: `http://localhost:3000`
   - Site URL production: `https://your-domain.com`
   - Redirect URLs:
     - `http://localhost:3000/login`
     - `https://your-domain.com/login`
     - optional if adding callback flows:
       - `http://localhost:3000/auth/callback`
       - `https://your-domain.com/auth/callback`
       - `http://localhost:3000/reset-password`
       - `https://your-domain.com/reset-password`
3. Project Settings -> API:
   - Copy Project URL to `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy anon/publishable key to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
   - Copy service role key to `SUPABASE_SERVICE_ROLE_KEY` on server only.
4. Storage:
   - Create/configure `user-media` bucket if copying profile media.
   - Apply storage policies from migrations.
5. Database:
   - Confirm `public.users`, `public.roles`, `public.departments` exist.
   - Confirm `on_auth_user_created` trigger exists on `auth.users`.
   - Confirm RLS is enabled and policies are present.
   - Confirm at least one Admin user exists.

The smallest viable migration is: Supabase client utilities, middleware, login page/action, protected layout guard, `public.users` mirror table, `handle_new_user` trigger, and `is_admin`/RLS policies. Everything else should be adapted based on Project A's routes and user model.
