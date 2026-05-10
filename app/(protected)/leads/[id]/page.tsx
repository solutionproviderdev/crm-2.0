import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LifecycleRecordDetailShell } from "@/components/leads/LifecycleRecordDetailShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getLeadDetails,
  getAllActiveUsers,
  getLifecycleStatusGroups,
  getLifecycleTransitionRules,
  getLeadLifecycleTimeline,
  getDepartments,
} from "@/app/actions/leads";
import { getCurrentUser } from "@/app/actions/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * LeadDetailsContent
 * ─────────────────────────────────────────────────────────────────────────────
 * Async Server Component that owns all dynamic data fetching.
 * Kept separate from the page export so it can be streamed inside <Suspense>,
 * preventing a blocking route error in Next.js 16.
 */
async function LeadDetailsContent({ id }: { id: string }) {
  const user = await getCurrentUser();
  const [
    result,
    usersRes,
    lifecycleRes,
    lifecycleTransitionsRes,
    lifecycleTimelineRes,
    departmentsRes,
  ] = await Promise.all([
    getLeadDetails(id, { userId: user?.id, isAdmin: user?.type === "Admin" }),
    getAllActiveUsers(),
    getLifecycleStatusGroups(),
    getLifecycleTransitionRules(),
    getLeadLifecycleTimeline(id),
    getDepartments(),
  ]);

  if (!result.success || !result.data) notFound();

  const lead = result.data;
  const allUsers = usersRes.success ? usersRes.data : [];
  const lifecycleStatusGroups = lifecycleRes.success ? lifecycleRes.data : [];
  const lifecycleTransitionRules = lifecycleTransitionsRes.success
    ? lifecycleTransitionsRes.data
    : [];
  const timeline = lifecycleTimelineRes.success
    ? lifecycleTimelineRes.data
    : { statusHistory: [], assignments: [] };
  const departments = departmentsRes.success ? departmentsRes.data : [];

  return (
    <LifecycleRecordDetailShell
      lead={lead}
      users={allUsers}
      lifecycleStatusGroups={lifecycleStatusGroups}
      lifecycleTransitionRules={lifecycleTransitionRules}
      timeline={timeline}
      departments={departments}
    />
  );
}

/**
 * LeadDetailsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Static shell — only unwraps `params`, then hands off to the async component
 * inside <Suspense> so the route is never blocked.
 */
export default async function LeadDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full bg-slate-50/50 animate-pulse">
          <div className="h-16 border-b bg-white shrink-0" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
              <div className="lg:col-span-4">
                <Skeleton className="h-[600px] w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LeadDetailsContent id={id} />
    </Suspense>
  );
}
