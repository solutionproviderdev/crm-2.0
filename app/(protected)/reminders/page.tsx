import { Metadata } from "next";
import { getFollowUps } from "@/app/actions/follow-ups";
import { getAllActiveUsers } from "@/app/actions/leads/queries";
import { getCurrentUser } from "@/app/actions/auth";
import RemindersPageContent from "@/components/reminders/RemindersPageContent";
import { FollowUpWithLead } from "@/lib/types";
import { format, startOfDay, endOfDay } from "date-fns";
import { AlertCircle, Calendar } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Reminders & Follow-ups | CRM 2.0",
  description: "Track and manage your lead follow-ups and interactions.",
};

/**
 * RemindersSkeleton
 * Skeleton for the reminders dashboard
 */
function RemindersSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-slate-300" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * RemindersGridContent
 * Async component that fetches data. Receives todayStr as a prop so it does
 * NOT need to call `new Date()` or `connection()` itself — the dynamic scope
 * is already established by the outer page reading `searchParams`.
 *
 * Non-admin users are scoped to their own follow-ups on the initial server
 * render via `ownerId`. The client component re-fetches with the same scope
 * when the date or filters change.
 */
async function RemindersGridContent({ todayStr, today }: { todayStr: string; today: string }) {
  const todayDate = new Date(today);

  // getCurrentUser is needed to scope the initial server-side fetch for
  // non-admin users — without this, every user would see all follow-ups.
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.type === "Admin";
  const ownerId = isAdmin ? undefined : (currentUser?.id ?? undefined);

  const [remindersRes, usersRes] = await Promise.all([
    getFollowUps({
      startDate: startOfDay(todayDate).toISOString(),
      endDate: endOfDay(todayDate).toISOString(),
      ownerId,
    }),
    getAllActiveUsers()
  ]);

  if (!remindersRes.success || !usersRes.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Sync Error</h2>
        <p className="text-slate-400 font-bold mt-2 max-w-md">
          {(!remindersRes.success ? remindersRes.error : "") || (!usersRes.success ? usersRes.error : "") || "We couldn't synchronize your reminders at this moment. Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <RemindersPageContent
        initialReminders={(remindersRes.data || []) as FollowUpWithLead[]}
        initialUsers={usersRes.data || []}
        selectedDate={todayStr}
      />
    </div>
  );
}

/**
 * RemindersPage
 * Accepts `searchParams` so the route opts into dynamic rendering automatically.
 * `new Date()` is safe here because the dynamic scope is already established.
 */
export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Reading searchParams opts this page into dynamic rendering, which means
  // new Date() correctly returns the request-time date (not a static build time).
  await searchParams;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  return (
    <Suspense fallback={<RemindersSkeleton />}>
      <RemindersGridContent todayStr={todayStr} today={today.toISOString()} />
    </Suspense>
  );
}
