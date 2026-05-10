import { getCalendarOperations } from "@/app/actions/leads";
import { CalendarOperationsDashboard } from "@/components/calendar/CalendarOperationsDashboard";

export const metadata = {
  title: "Calendar | EaseIT CRM",
  description: "Unified calendar for meetings, follow-ups, measurements, and installations",
};

export default async function CalendarPage() {
  const result = await getCalendarOperations();

  if (!result.success) {
    return <CalendarError message={result.error} />;
  }

  return <CalendarOperationsDashboard data={result.data} />;
}

function CalendarError({ message }: { message: string }) {
  return (
    <div className="m-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
      Error loading calendar: {message}
    </div>
  );
}
