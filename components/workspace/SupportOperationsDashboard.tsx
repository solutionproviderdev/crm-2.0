"use client";

import Link from "next/link";
import { useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { updateSupportRequest } from "@/app/actions/leads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import type { WorkspaceSupportRequest } from "@/lib/types";

interface SupportOperationsDashboardProps {
  requests: WorkspaceSupportRequest[];
}

const statusLabels: Record<WorkspaceSupportRequest["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const statusOrder: WorkspaceSupportRequest["status"][] = [
  "open",
  "in_progress",
  "resolved",
  "cancelled",
];

export function SupportOperationsDashboard({ requests }: SupportOperationsDashboardProps) {
  const grouped = statusOrder.map((status) => ({
    status,
    items: requests.filter((request) => request.status === status),
  }));

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
          Workspace
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
          Support Requests
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Operational support created from Need Support status changes.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {grouped.map((group) => (
          <div
            key={group.status}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {statusLabels[group.status]}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950 dark:text-slate-50">
              {group.items.length}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {grouped.map((group) => (
          <SupportColumn key={group.status} status={group.status} requests={group.items} />
        ))}
      </div>
    </div>
  );
}

function SupportColumn({
  status,
  requests,
}: {
  status: WorkspaceSupportRequest["status"];
  requests: WorkspaceSupportRequest[];
}) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="border-b border-slate-200 bg-slate-50/70 py-4 dark:border-slate-800 dark:bg-slate-900/60">
        <CardTitle className="flex items-center justify-between gap-3 text-sm font-black">
          <span>{statusLabels[status]}</span>
          <Badge variant="outline" className="rounded-full font-black">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {requests.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No requests.
          </div>
        ) : (
          requests.map((request) => <SupportCard key={request.id} request={request} />)
        )}
      </CardContent>
    </Card>
  );
}

function SupportCard({ request }: { request: WorkspaceSupportRequest }) {
  const [isPending, startTransition] = useTransition();

  function changeStatus(status: WorkspaceSupportRequest["status"]) {
    startTransition(async () => {
      const result = await updateSupportRequest({
        id: request.id,
        status,
        assignedTo: request.assigned_to,
        departmentId: request.department_id,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Support request marked ${statusLabels[status].toLowerCase()}`);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/leads/${request.lead_id}`}
            className="line-clamp-2 text-sm font-black text-slate-950 hover:text-[var(--brand-primary)] dark:text-slate-50"
          >
            {request.subject}
          </Link>
          <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {request.lead?.name || "Unknown lead"}
          </p>
        </div>
        <PriorityBadge priority={request.priority} />
      </div>

      {request.description && (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {request.description}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-1 gap-2 text-xs">
        <Meta label="Department" value={request.department?.name || "No department"} />
        <Meta label="Assigned" value={request.assigned_user?.name || "Unassigned"} />
        <Meta label="Requested By" value={request.requested_by_user?.name || "System"} />
        {request.resolved_at && (
          <Meta label="Resolved" value={new Date(request.resolved_at).toLocaleString()} />
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === "open" && (
          <Button size="sm" variant="outline" onClick={() => changeStatus("in_progress")} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
            Start
          </Button>
        )}
        {(request.status === "open" || request.status === "in_progress") && (
          <>
            <Button size="sm" onClick={() => changeStatus("resolved")} disabled={isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => changeStatus("cancelled")} disabled={isPending}>
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-black uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="truncate text-right font-bold text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: WorkspaceSupportRequest["priority"] }) {
  const className =
    priority === "urgent"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
      : priority === "high"
        ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300"
        : priority === "low"
          ? "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300";

  return (
    <Badge variant="outline" className={cn("rounded-full text-[10px] font-black", className)}>
      <AlertTriangle className="mr-1 h-3 w-3" />
      {priority}
    </Badge>
  );
}
