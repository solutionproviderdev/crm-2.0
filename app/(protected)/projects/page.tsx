import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { IMPLEMENTATION_STAGES } from "@/lib/pipeline-stages";
import { getPipelineLeads, getAllActiveUsers } from "@/app/actions/leads";
import { ProjectPipelineContent } from "@/components/leads/pipeline/ProjectPipelineContent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Project Pipeline | EaseIT CRM",
  description: "Implementation-stage leads grouped by project stage",
};

async function ProjectPipelinePageContent() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");

  // Fetch user profile to determine admin status and user ID
  const adminClient = createAdminClient();
  const { data: userProfile } = await adminClient
    .from("users")
    .select("id, type")
    .eq("id", session.user.id)
    .single();

  const isAdmin = userProfile?.type === "Admin";
  const userId = session.user.id;

  const [pipelineResult, usersResult] = await Promise.all([
    getPipelineLeads({
      stages: IMPLEMENTATION_STAGES,
      userId,
      isAdmin,
    }),
    getAllActiveUsers(),
  ]);

  if (!pipelineResult.success) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        Error loading pipeline: {pipelineResult.error}
      </div>
    );
  }

  const users = usersResult.success ? usersResult.data : [];

  return (
    <ProjectPipelineContent
      initialData={pipelineResult.data}
      users={users}
      userId={userId}
      isAdmin={isAdmin}
    />
  );
}

function ProjectPipelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectPipelinePage() {
  return (
    <div className="mx-auto py-8 px-4 w-full">
      <Suspense fallback={<ProjectPipelineSkeleton />}>
        <ProjectPipelinePageContent />
      </Suspense>
    </div>
  );
}
