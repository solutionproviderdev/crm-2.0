import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { getCurrentUser } from "@/app/actions/auth";
import { getWorkspaceInbox } from "@/app/actions/workspace";

export const metadata = {
  title: "My Tasks | EaseIT CRM",
  description: "Assigned lifecycle records",
};

export default async function WorkspaceMyTasksPage() {
  const user = await getCurrentUser();
  const result = await getWorkspaceInbox({
    userId: user?.id,
    isAdmin: user?.type === "Admin",
  });

  if (!result.success) {
    return <WorkspaceError message={result.error} />;
  }

  return <WorkspaceDashboard data={result.data} view="my-tasks" />;
}

function WorkspaceError({ message }: { message: string }) {
  return (
    <div className="m-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
      Error loading tasks: {message}
    </div>
  );
}
