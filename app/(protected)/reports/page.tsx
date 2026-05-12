import { getLifecycleReports } from "@/app/actions/leads";
import { LifecycleReportsDashboard } from "@/components/reports/LifecycleReportsDashboard";

export const metadata = {
  title: "Reports | EaseIT CRM",
  description: "Lifecycle reports and bottleneck insights",
};

export default async function ReportsPage() {
  const result = await getLifecycleReports();

  if (!result.success) {
    return <ReportsError message={result.error} />;
  }

  return <LifecycleReportsDashboard data={result.data} />;
}

function ReportsError({ message }: { message: string }) {
  return (
    <div className="m-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
      Error loading reports: {message}
    </div>
  );
}
