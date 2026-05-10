import { getSupportOperations } from "@/app/actions/leads";
import { SupportOperationsDashboard } from "@/components/workspace/SupportOperationsDashboard";

export const metadata = {
  title: "Support Requests | EaseIT CRM",
  description: "Active lifecycle support requests",
};

export default async function WorkspaceSupportRequestsPage() {
  const result = await getSupportOperations();

  if (!result.success) {
    return <WorkspaceError message={result.error} />;
  }

  return <SupportOperationsDashboard requests={result.data} />;
}

function WorkspaceError({ message }: { message: string }) {
  return (
    <div className="m-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
      Error loading support requests: {message}
    </div>
  );
}
