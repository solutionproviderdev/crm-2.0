import {
  getDepartments,
  getLifecycleStatusGroups,
  getLifecycleTransitionRules,
} from "@/app/actions/leads";
import { PipelineSettingsDashboard } from "@/components/settings/PipelineSettingsDashboard";

export const metadata = {
  title: "Status Transitions | EaseIT CRM",
  description: "Lifecycle transition rule settings",
};

export default async function StatusTransitionsSettingsPage() {
  const [groupsResult, transitionsResult, departmentsResult] = await Promise.all([
    getLifecycleStatusGroups(),
    getLifecycleTransitionRules(),
    getDepartments(),
  ]);

  if (!groupsResult.success) return <SettingsError message={groupsResult.error} />;
  if (!transitionsResult.success) return <SettingsError message={transitionsResult.error} />;
  if (!departmentsResult.success) return <SettingsError message={departmentsResult.error} />;

  return (
    <PipelineSettingsDashboard
      groups={groupsResult.data}
      transitions={transitionsResult.data}
      departments={departmentsResult.data}
      mode="transitions"
    />
  );
}

function SettingsError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
      Error loading transition settings: {message}
    </div>
  );
}
