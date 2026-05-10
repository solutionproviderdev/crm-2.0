import Link from "next/link";
import { AlertTriangle, ArrowRight, Building2, Inbox, TimerReset, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import type { WorkspaceLeadSummary } from "@/lib/types";

interface AssignmentOperationsData {
  departmentWorkload: {
    departmentId: string | null;
    departmentName: string;
    total: number;
    urgent: number;
    high: number;
    unassigned: number;
  }[];
  unassignedRecords: WorkspaceLeadSummary[];
  staleAssignments: WorkspaceLeadSummary[];
}

interface AssignmentOperationsDashboardProps {
  data: AssignmentOperationsData;
}

export function AssignmentOperationsDashboard({
  data,
}: AssignmentOperationsDashboardProps) {
  const totalAssigned = data.departmentWorkload.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-8">
      <header className="space-y-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
              Assignment Operations
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              Ownership And Workload
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Department load, unassigned records, and stale assignments that need manager attention.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Tracked" value={totalAssigned} tone="blue" />
            <Metric label="Unassigned" value={data.unassignedRecords.length} tone="amber" />
            <Metric label="Stale" value={data.staleAssignments.length} tone="red" />
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
          {[
            { href: "/workspace/inbox", label: "Inbox" },
            { href: "/workspace/my-tasks", label: "My Tasks" },
            { href: "/workspace/follow-ups", label: "Follow-ups" },
            { href: "/workspace/support-requests", label: "Support" },
            { href: "/workspace/assignments", label: "Assignments" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center rounded-xl px-4 text-xs font-black transition",
                item.href === "/workspace/assignments"
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-none shadow-sm xl:col-span-3">
          <CardHeader className="border-b bg-slate-50/60 dark:bg-slate-900/60">
            <CardTitle className="flex items-center gap-2 text-sm font-black">
              <Building2 className="h-4 w-4 text-[var(--brand-primary)]" />
              Department Workload
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {data.departmentWorkload.length === 0 ? (
              <EmptyState text="No workload records found." />
            ) : (
              data.departmentWorkload.map((department) => (
                <div
                  key={department.departmentId || "none"}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {department.departmentName}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {department.total} active records
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full font-black">
                      {department.total}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniMetric label="Urgent" value={department.urgent} tone="red" />
                    <MiniMetric label="High" value={department.high} tone="amber" />
                    <MiniMetric label="Open" value={department.unassigned} tone="blue" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <OperationsSection
          title="Unassigned Records"
          icon={Inbox}
          count={data.unassignedRecords.length}
        >
          <LeadList leads={data.unassignedRecords} empty="No unassigned records." />
        </OperationsSection>

        <OperationsSection
          title="Stale Assignments"
          icon={TimerReset}
          count={data.staleAssignments.length}
        >
          <LeadList leads={data.staleAssignments} empty="No stale assignments older than 7 days." />
        </OperationsSection>

        <OperationsSection
          title="Manager Attention"
          icon={AlertTriangle}
          count={data.unassignedRecords.length + data.staleAssignments.length}
        >
          <div className="space-y-3 p-4">
            <AttentionRow label="Assign owner" count={data.unassignedRecords.length} />
            <AttentionRow label="Review stale owner" count={data.staleAssignments.length} />
            <AttentionRow
              label="Priority overload"
              count={data.departmentWorkload.reduce(
                (sum, row) => sum + row.urgent + row.high,
                0
              )}
            />
          </div>
        </OperationsSection>
      </div>
    </div>
  );
}

function OperationsSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: LucideIcon;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/60 py-4 dark:bg-slate-900/60">
        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
          {title}
        </CardTitle>
        <Badge variant="outline" className="rounded-full font-black">
          {count}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function LeadList({
  leads,
  empty,
}: {
  leads: WorkspaceLeadSummary[];
  empty: string;
}) {
  if (leads.length === 0) return <EmptyState text={empty} />;

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {leads.map((lead) => (
        <Link
          key={lead.id}
          href={`/leads/${lead.id}`}
          className="group flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                {lead.name}
              </p>
              <PriorityBadge priority={lead.priority || "normal"} />
            </div>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">
              {lead.cid || "No CID"} / {lead.current_owner?.name || "Unassigned"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[var(--brand-primary)]" />
        </Link>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "red" | "amber";
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30",
    red: "border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30",
  };

  return (
    <div className={cn("rounded-xl border p-3", tones[tone])}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "red" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30",
    red: "bg-red-50 text-red-700 dark:bg-red-950/30",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30",
  };

  return (
    <div className={cn("rounded-lg p-2 text-center", tones[tone])}>
      <p className="text-base font-black">{value}</p>
      <p className="text-[9px] font-black uppercase">{label}</p>
    </div>
  );
}

function AttentionRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
        {count}
      </Badge>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: WorkspaceLeadSummary["priority"] }) {
  const className =
    priority === "urgent"
      ? "bg-red-100 text-red-700"
      : priority === "high"
        ? "bg-orange-100 text-orange-700"
        : priority === "low"
          ? "bg-slate-100 text-slate-600"
          : "bg-blue-100 text-blue-700";

  return (
    <Badge className={cn("rounded-full text-[10px] font-black hover:bg-current", className)}>
      {priority}
    </Badge>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center p-8 text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}
