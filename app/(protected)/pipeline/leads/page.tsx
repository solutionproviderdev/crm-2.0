import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  getAllActiveUsers,
  getLifecycleStatusGroups,
  getLifecycleTransitionRules,
  getPipelineLeads,
} from "@/app/actions/leads";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadPipelineContent } from "@/components/leads/pipeline/LeadPipelineContent";
import { LEAD_STAGES } from "@/lib/pipeline-stages";

export const metadata = {
  title: "Lead Pipeline | EaseIT CRM",
  description: "Lead-stage records grouped by lifecycle status",
};

async function LeadPipelinePageContent() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: userProfile } = await adminClient
    .from("users")
    .select("id, type")
    .eq("id", session.user.id)
    .single();

  const isAdmin = userProfile?.type === "Admin";
  const userId = session.user.id;

  const lifecycleResult = await getLifecycleStatusGroups();
  const lifecycleStatusGroups = lifecycleResult.success ? lifecycleResult.data : [];
  const leadStages = lifecycleResult.success
    ? lifecycleResult.data
        .find((group) => group.code === "lead")
        ?.statuses.map((status) => status.name) ?? [...LEAD_STAGES]
    : [...LEAD_STAGES];

  const [pipelineResult, usersResult, transitionResult] = await Promise.all([
    getPipelineLeads({
      stages: leadStages,
      stageCode: "lead",
      userId,
      isAdmin,
    }),
    getAllActiveUsers(),
    getLifecycleTransitionRules(),
  ]);

  if (!pipelineResult.success) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center font-medium text-red-700">
        Error loading pipeline: {pipelineResult.error}
      </div>
    );
  }

  return (
    <LeadPipelineContent
      initialData={pipelineResult.data}
      stages={leadStages}
      users={usersResult.success ? usersResult.data : []}
      userId={userId}
      isAdmin={isAdmin}
      lifecycleStatusGroups={lifecycleStatusGroups}
      lifecycleTransitionRules={transitionResult.success ? transitionResult.data : []}
    />
  );
}

function LeadPipelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeadPipelinePage() {
  return (
    <div className="mx-auto w-full px-4 py-8">
      <Suspense fallback={<LeadPipelineSkeleton />}>
        <LeadPipelinePageContent />
      </Suspense>
    </div>
  );
}
