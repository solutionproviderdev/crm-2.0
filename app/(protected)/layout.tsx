import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RealtimeNotificationProvider } from "@/components/providers/RealtimeProvider";
import { BrandProvider } from "@/components/providers/BrandProvider";
import { getSiteSettings } from "@/app/actions/settings";
import { Toaster } from "@/components/ui/sonner";
import type { User, SiteSettings } from "@/lib/types";
import { Suspense } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Default settings used while real settings are loading or on error.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: SiteSettings = {
  id: "main",
  company_name: "EaseIT CRM",
  brand_logo_url: null,
  primary_color: "#046288",
  secondary_color: "#034e6d",
  updated_at: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// LayoutContent - Async component that fetches user profile.
//
// WHY THIS PATTERN:
// - The middleware already validates the JWT with Supabase servers and
//   refreshes the session cookie on every request.
// - `getSession()` reads the refreshed cookie — no extra network call.
// - `getUser()` in the old layout made a second network round-trip, causing
//   the "Blocking Route" error because it was outside a Suspense boundary.
// - By wrapping this component in <Suspense>, the outer shell (HTML, nav
//   skeleton) can stream to the browser instantly while the DB fetch runs.
// ─────────────────────────────────────────────────────────────────────────────
async function LayoutContent({ children }: { children: React.ReactNode }) {
  // Step 1: Read auth user from cookie (no network call — cookie was refreshed
  // by middleware). We use the user client just for session reading.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Step 2: Fetch the full user profile from the DB using the admin client
  // (avoids RLS round-trips; profile is only fetched for the session user).
  const adminSupabase = createAdminClient();
  const { data: user, error: profileError } = await adminSupabase
    .from("users")
    .select(`
      *,
      department:departments(id, name),
      role:roles(id, name, permissions)
    `)
    .eq("id", session.user.id)
    .single();

  // STOPS REDIRECT LOOP: Auth session exists but profile is missing →
  // sign out before redirecting so middleware doesn't loop back here.
  if (profileError || !user) {
    await supabase.auth.signOut();
    redirect("/login?error=profile_not_found");
  }

  const settingsResult = await getSiteSettings();
  const settings = settingsResult.success
    ? settingsResult.data!
    : DEFAULT_SETTINGS;

  return (
    <BrandProvider settings={settings}>
      <DashboardShell user={user as User} settings={settings}>
        <RealtimeNotificationProvider userId={user.id}>
          {children}
          <Toaster position="bottom-right" />
        </RealtimeNotificationProvider>
      </DashboardShell>
    </BrandProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardLayout - Static shell.
//
// The <Suspense> here allows Next.js to immediately stream the root HTML
// frame to the browser. Once LayoutContent resolves, it streams the full UI.
// This eliminates the "Blocking Route" error for every page under /(protected).
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
