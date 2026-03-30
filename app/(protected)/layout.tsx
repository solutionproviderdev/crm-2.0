import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RealtimeNotificationProvider } from "@/components/providers/RealtimeProvider";
import { BrandProvider } from "@/components/providers/BrandProvider";
import { getSiteSettings } from "@/app/actions/settings";
import { Toaster } from "@/components/ui/sonner";
import type { User, SiteSettings } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: user, error: profileError } = await supabase
    .from("users")
    .select(`
      *,
      department:departments(id, name),
      role:roles(id, name, permissions)
    `)
    .eq("id", authUser.id)
    .single();

  // STOPS REDIRECT LOOP: If Auth session exists but Profile is missing, 
  // we must sign out before redirecting back to /login.
  // Otherwise middleware will just push them back here.
  if (profileError || !user) {
    await supabase.auth.signOut();
    redirect("/login?error=profile_not_found");
  }

  const settingsResult = await getSiteSettings();
  const settings = settingsResult.success ? settingsResult.data : {
    id: "main",
    company_name: "EaseIT CRM",
    brand_logo_url: null,
    primary_color: "#046288",
    secondary_color: "#034e6d",
    updated_at: new Date().toISOString()
  } as SiteSettings;

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
