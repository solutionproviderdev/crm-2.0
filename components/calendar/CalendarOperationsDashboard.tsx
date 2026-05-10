"use client";

import Link from "next/link";
import { useState } from "react";
import { Handshake, PhoneCall, Ruler, Truck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  WorkspaceFollowUpItem,
  WorkspaceLeadSummary,
  WorkspaceMeasurementItem,
  WorkspaceMeetingItem,
} from "@/lib/types";

type Scope = "my" | "department" | "all";

interface CalendarOperationsDashboardProps {
  userId: string;
  userDepartmentId: string | null;
  data: {
    meetings: WorkspaceMeetingItem[];
    followUps: WorkspaceFollowUpItem[];
    measurements: WorkspaceMeasurementItem[];
    installations: WorkspaceLeadSummary[];
  };
}

export function CalendarOperationsDashboard({
  userId,
  userDepartmentId,
  data,
}: CalendarOperationsDashboardProps) {
  const [scope, setScope] = useState<Scope>("my");

  const meetings = filterMeetings(data.meetings, scope, userId, userDepartmentId);
  const followUps = filterFollowUps(data.followUps, scope, userId, userDepartmentId);
  const measurements = filterMeasurements(data.measurements, scope, userId, userDepartmentId);
  const installations = filterInstallations(data.installations, scope, userId, userDepartmentId);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
          Calendar
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
          Scheduled Work
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Meetings, follow-ups, measurements, and installation work in one place.
        </p>
      </header>

      {/* Scope filter tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 w-fit">
        {(["my", "department", "all"] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors ${
              scope === s
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {s === "my" ? "My" : s === "department" ? "Department" : "All"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CalendarSection title="Meetings" icon={Handshake} count={meetings.length}>
          {meetings.map((item) => (
            <CalendarRow
              key={item.id}
              href={`/leads/${item.lead_id}`}
              title={item.lead?.name || "Unknown lead"}
              meta={`${item.date} / ${item.slot} / ${item.sales_executive?.name || "Unassigned"}`}
              badge={item.status}
            />
          ))}
        </CalendarSection>

        <CalendarSection title="Follow-ups" icon={PhoneCall} count={followUps.length}>
          {followUps.map((item) => (
            <CalendarRow
              key={item.id}
              href={`/leads/${item.lead_id}`}
              title={item.lead?.name || "Unknown lead"}
              meta={`${new Date(item.time).toLocaleString()} / ${item.type}`}
              badge={item.status}
            />
          ))}
        </CalendarSection>

        <CalendarSection title="Measurements" icon={Ruler} count={measurements.length}>
          {measurements.map((item) => (
            <CalendarRow
              key={item.id}
              href={`/leads/${item.lead_id}`}
              title={item.lead?.name || "Unknown lead"}
              meta={`${item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : "No schedule"} / ${item.measurement_user?.name || "Unassigned"}`}
              badge={item.status}
            />
          ))}
        </CalendarSection>

        <CalendarSection title="Installations" icon={Truck} count={installations.length}>
          {installations.map((lead) => (
            <CalendarRow
              key={lead.id}
              href={`/leads/${lead.id}`}
              title={lead.name}
              meta={`${lead.cid || "No CID"} / ${lead.current_owner?.name || "Unassigned"}`}
              badge={lead.status}
            />
          ))}
        </CalendarSection>
      </div>
    </div>
  );
}

// ── Filter helpers ─────────────────────────────────────────────────────────

function filterMeetings(
  items: WorkspaceMeetingItem[],
  scope: Scope,
  userId: string,
  deptId: string | null,
): WorkspaceMeetingItem[] {
  if (scope === "all") return items;
  if (scope === "my") return items.filter((i) => i.sales_executive?.id === userId);
  if (scope === "department" && deptId)
    return items.filter((i) => i.lead?.current_department_id === deptId);
  return items;
}

function filterFollowUps(
  items: WorkspaceFollowUpItem[],
  scope: Scope,
  userId: string,
  deptId: string | null,
): WorkspaceFollowUpItem[] {
  if (scope === "all") return items;
  if (scope === "my") return items.filter((i) => i.assigned_user?.id === userId);
  if (scope === "department" && deptId)
    return items.filter((i) => i.lead?.current_department_id === deptId);
  return items;
}

function filterMeasurements(
  items: WorkspaceMeasurementItem[],
  scope: Scope,
  userId: string,
  deptId: string | null,
): WorkspaceMeasurementItem[] {
  if (scope === "all") return items;
  if (scope === "my") return items.filter((i) => i.measurement_user?.id === userId);
  if (scope === "department" && deptId)
    return items.filter((i) => i.lead?.current_department_id === deptId);
  return items;
}

function filterInstallations(
  items: WorkspaceLeadSummary[],
  scope: Scope,
  userId: string,
  deptId: string | null,
): WorkspaceLeadSummary[] {
  if (scope === "all") return items;
  if (scope === "my") return items.filter((i) => i.current_owner?.id === userId);
  if (scope === "department" && deptId)
    return items.filter((i) => i.current_department_id === deptId);
  return items;
}

// ── Sub-components ────────────────────────────────────────────────────────

function CalendarSection({
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
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50/70 py-4 dark:border-slate-800 dark:bg-slate-900/60">
        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
          {title}
        </CardTitle>
        <Badge variant="outline" className="rounded-full font-black">
          {count}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {count === 0 ? (
          <div className="flex min-h-40 items-center justify-center p-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            No scheduled items.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarRow({
  href,
  title,
  meta,
  badge,
}: {
  href: string;
  title: string;
  meta: string;
  badge: string;
}) {
  return (
    <Link href={href} className="block p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{meta}</p>
        </div>
        <Badge className="shrink-0 rounded-full bg-slate-100 text-[10px] font-black text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200">
          {badge}
        </Badge>
      </div>
    </Link>
  );
}
