import { getAssignmentOperations } from "@/app/actions/leads";
import { AssignmentOperationsDashboard } from "@/components/workspace/AssignmentOperationsDashboard";

export const metadata = {
  title: "Assignment Operations | EaseIT CRM",
  description: "Department workload, unassigned records, and stale assignments",
};

export default async function WorkspaceAssignmentsPage() {
  const result = await getAssignmentOperations();

  if (!result.success) {
    return <WorkspaceError message={result.error} />;
  }

  return <AssignmentOperationsDashboard data={result.data} />;
}

function WorkspaceError({ message }: { message: string }) {
  return (
    <div className="m-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
      Error loading assignment operations: {message}
    </div>
  );
}
