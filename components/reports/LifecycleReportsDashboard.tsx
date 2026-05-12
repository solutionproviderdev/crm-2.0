import { Activity, AlertTriangle, BarChart3, CheckCircle2, Inbox, TrendingUp, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LifecycleReportsDashboardProps {
  data: {
    stageCounts: { stage: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    sourceCounts: { source: string; count: number }[];
    lostCount: number;
    handedOverCount: number;
    unassignedCount: number;
    staleAssignmentCount: number;
    recentStatusChanges: {
      id: string;
      changed_at: string;
      note: string | null;
      to_status?: { name: string } | null;
      to_stage?: { name: string } | null;
      changed_by_user?: { name: string } | null;
    }[];
    conversionFunnel: {
      totalLeads: number;
      convertedToClient: number;
      convertedToProject: number;
      clientConversionRate: number;
      projectConversionRate: number;
    };
    lostReasons: { reason: string; count: number }[];
  };
}

export function LifecycleReportsDashboard({ data }: LifecycleReportsDashboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
          Reports
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
          Lifecycle Reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Current lifecycle position, source quality, assignment gaps, and recent movement.
        </p>
      </header>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Lost" value={data.lostCount} icon={AlertTriangle} tone="red" />
        <Metric label="Handed Over" value={data.handedOverCount} icon={CheckCircle2} tone="green" />
        <Metric label="Unassigned" value={data.unassignedCount} icon={Inbox} tone="amber" />
        <Metric label="Stale Assignments" value={data.staleAssignmentCount} icon={Activity} tone="blue" />
      </div>

      {/* Conversion funnel */}
      <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
          <CardTitle className="flex items-center gap-2 text-sm font-black">
            <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FunnelStep
              label="Total Leads"
              value={data.conversionFunnel.totalLeads}
              rate={100}
              accent="bg-slate-500"
            />
            <FunnelStep
              label="Converted to Client"
              value={data.conversionFunnel.convertedToClient}
              rate={data.conversionFunnel.clientConversionRate}
              accent="bg-blue-500"
            />
            <FunnelStep
              label="Converted to Project"
              value={data.conversionFunnel.convertedToProject}
              rate={data.conversionFunnel.projectConversionRate}
              accent="bg-[var(--brand-primary)]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ListCard title="By Stage" rows={data.stageCounts.map((row) => [row.stage, row.count])} />
        <ListCard title="By Status" rows={data.statusCounts.slice(0, 10).map((row) => [row.status, row.count])} />
        <ListCard title="By Source" rows={data.sourceCounts.map((row) => [row.source, row.count])} />
      </div>

      {/* Lost reasons + recent movement */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
            <CardTitle className="flex items-center gap-2 text-sm font-black">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Lost Reason Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {data.lostReasons.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No lost leads recorded.</p>
            ) : (
              (() => {
                const maxLost = Math.max(...data.lostReasons.map((r) => r.count), 1);
                return data.lostReasons.map(({ reason, count }) => (
                  <div key={reason} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">{reason}</p>
                      <Badge variant="outline" className="rounded-full text-[10px] font-black">{count}</Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-red-400" style={{ width: `${(count / maxLost) * 100}%` }} />
                    </div>
                  </div>
                ));
              })()
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
            <CardTitle className="flex items-center gap-2 text-sm font-black">
              <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" />
              Recent Lifecycle Movement
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {data.recentStatusChanges.length === 0 ? (
              <div className="p-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                No lifecycle history recorded yet.
              </div>
            ) : (
              data.recentStatusChanges.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {item.to_stage?.name || "Lifecycle"} / {item.to_status?.name || "Status changed"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {new Date(item.changed_at).toLocaleString()} by {item.changed_by_user?.name || "System"}
                    </p>
                    {item.note && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "red" | "green" | "amber" | "blue";
}) {
  const tones = {
    red: "border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
    green: "border-green-100 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
    blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <Icon className="h-4 w-4" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  rate,
  accent,
}: {
  label: string;
  value: number;
  rate: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full ${accent}`} style={{ width: `${rate}%` }} />
        </div>
        <span className="text-xs font-black text-slate-600 dark:text-slate-300">{rate}%</span>
      </div>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(...rows.map((row) => row[1]), 1);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-sm font-black">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data.</p>
        ) : (
          rows.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">{label}</p>
                <Badge variant="outline" className="rounded-full text-[10px] font-black">{value}</Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
