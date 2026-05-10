import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Handshake,
  Inbox,
  PhoneCall,
  Ruler,
  Truck,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import type {
  WorkspaceFollowUpItem,
  WorkspaceInboxData,
  WorkspaceLeadSummary,
  WorkspaceMeasurementItem,
  WorkspaceMeetingItem,
  WorkspaceSupportRequest,
} from "@/lib/types";

type WorkspaceView = "inbox" | "my-tasks" | "follow-ups" | "support-requests";

interface WorkspaceDashboardProps {
  data: WorkspaceInboxData;
  view: WorkspaceView;
}

const workspaceTabs = [
  { href: "/workspace/inbox", label: "Inbox", value: "inbox", icon: Inbox },
  { href: "/workspace/my-tasks", label: "My Tasks", value: "my-tasks", icon: ClipboardList },
  { href: "/workspace/follow-ups", label: "Follow-ups", value: "follow-ups", icon: CalendarClock },
  { href: "/workspace/support-requests", label: "Support", value: "support-requests", icon: AlertTriangle },
  { href: "/workspace/assignments", label: "Assignments", value: "assignments", icon: Users },
] as const;

export function WorkspaceDashboard({ data, view }: WorkspaceDashboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-8">
      <WorkspaceHeader activeView={view} data={data} />

      {view === "inbox" && <InboxView data={data} />}
      {view === "my-tasks" && <MyTasksView data={data.myTasks} />}
      {view === "follow-ups" && (
        <FollowUpsView
          overdue={data.overdueFollowUps}
          today={data.dueTodayFollowUps}
        />
      )}
      {view === "support-requests" && (
        <SupportRequestsView requests={data.supportRequests} />
      )}
    </div>
  );
}

function WorkspaceHeader({
  activeView,
  data,
}: {
  activeView: WorkspaceView;
  data: WorkspaceInboxData;
}) {
  const openWork =
    data.myTasks.length +
    data.overdueFollowUps.length +
    data.dueTodayFollowUps.length +
    data.supportRequests.length;

  return (
    <header className="space-y-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
            Workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
            Daily Work Inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Assigned work, overdue follow-ups, support requests, meetings,
            measurements, and installation items in one operating surface.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Open Work" value={openWork} tone="blue" />
          <Metric label="Overdue" value={data.overdueFollowUps.length} tone="red" />
          <Metric label="Unassigned" value={data.unassignedRecords.length} tone="amber" />
          <Metric label="Support" value={data.supportRequests.length} tone="purple" />
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
        {workspaceTabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition",
              activeView === item.value
                ? "bg-[var(--brand-primary)] text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function InboxView({ data }: { data: WorkspaceInboxData }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <WorkspaceSection
        title="My Assigned Records"
        icon={UserRound}
        count={data.myTasks.length}
        href="/workspace/my-tasks"
      >
        <LeadList leads={data.myTasks} empty="No assigned records." />
      </WorkspaceSection>

      <WorkspaceSection
        title="Follow-ups"
        icon={CalendarClock}
        count={data.overdueFollowUps.length + data.dueTodayFollowUps.length}
        href="/workspace/follow-ups"
      >
        <FollowUpList
          items={[...data.overdueFollowUps, ...data.dueTodayFollowUps]}
          empty="No pending follow-ups."
        />
      </WorkspaceSection>

      <WorkspaceSection
        title="Support Requests"
        icon={AlertTriangle}
        count={data.supportRequests.length}
        href="/workspace/support-requests"
      >
        <SupportList requests={data.supportRequests} empty="No active support requests." />
      </WorkspaceSection>

      <WorkspaceSection title="Unassigned Records" icon={Inbox} count={data.unassignedRecords.length}>
        <LeadList leads={data.unassignedRecords} empty="No unassigned records." />
      </WorkspaceSection>

      <WorkspaceSection title="Today Meetings" icon={Handshake} count={data.todayMeetings.length}>
        <MeetingList items={data.todayMeetings} empty="No meetings today." />
      </WorkspaceSection>

      <WorkspaceSection title="Measurements" icon={Ruler} count={data.upcomingMeasurements.length}>
        <MeasurementList items={data.upcomingMeasurements} empty="No scheduled measurements." />
      </WorkspaceSection>

      <WorkspaceSection title="Installations" icon={Truck} count={data.upcomingInstallations.length}>
        <LeadList leads={data.upcomingInstallations} empty="No installation work queued." />
      </WorkspaceSection>
    </div>
  );
}

function MyTasksView({ data }: { data: WorkspaceLeadSummary[] }) {
  return (
    <WorkspaceSection title="My Assigned Records" icon={ClipboardList} count={data.length} full>
      <LeadList leads={data} empty="No assigned records." large />
    </WorkspaceSection>
  );
}

function FollowUpsView({
  overdue,
  today,
}: {
  overdue: WorkspaceFollowUpItem[];
  today: WorkspaceFollowUpItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <WorkspaceSection title="Overdue Follow-ups" icon={AlertTriangle} count={overdue.length}>
        <FollowUpList items={overdue} empty="No overdue follow-ups." large />
      </WorkspaceSection>
      <WorkspaceSection title="Due Today" icon={CalendarClock} count={today.length}>
        <FollowUpList items={today} empty="No follow-ups due today." large />
      </WorkspaceSection>
    </div>
  );
}

function SupportRequestsView({
  requests,
}: {
  requests: WorkspaceSupportRequest[];
}) {
  return (
    <WorkspaceSection title="Active Support Requests" icon={AlertTriangle} count={requests.length} full>
      <SupportList requests={requests} empty="No active support requests." large />
    </WorkspaceSection>
  );
}

function WorkspaceSection({
  title,
  icon: Icon,
  count,
  href,
  children,
  full,
}: {
  title: string;
  icon: LucideIcon;
  count: number;
  href?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950", full && "xl:col-span-3")}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50/60 py-4 dark:border-slate-800 dark:bg-slate-900/60">
        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full font-black">
            {count}
          </Badge>
          {href && (
            <Link href={href} className="text-xs font-black text-[var(--brand-primary)]">
              View
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function LeadList({
  leads,
  empty,
  large,
}: {
  leads: WorkspaceLeadSummary[];
  empty: string;
  large?: boolean;
}) {
  if (leads.length === 0) return <EmptyState text={empty} />;

  return (
    <div className={cn("divide-y divide-slate-100 dark:divide-slate-800", large && "grid grid-cols-1 divide-y-0 md:grid-cols-2 xl:grid-cols-3")}>
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
              <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px] font-black">
                {lead.cid || "No CID"}
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {lead.status} / {lead.current_owner?.name || lead.cre?.name || lead.sales_executive?.name || "Unassigned"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[var(--brand-primary)]" />
        </Link>
      ))}
    </div>
  );
}

function FollowUpList({
  items,
  empty,
  large,
}: {
  items: WorkspaceFollowUpItem[];
  empty: string;
  large?: boolean;
}) {
  if (items.length === 0) return <EmptyState text={empty} />;

  return (
    <div className={cn("divide-y divide-slate-100 dark:divide-slate-800", large && "grid grid-cols-1 divide-y-0")}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/leads/${item.lead_id}`}
          className="flex gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <div className="mt-1 rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/30">
            <PhoneCall className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
              {item.lead?.name || "Unknown lead"}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {new Date(item.time).toLocaleString()} / {item.type}
            </p>
          </div>
          <Badge className="h-6 shrink-0 rounded-full bg-amber-100 text-[10px] font-black text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300">
            {item.status}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function SupportList({
  requests,
  empty,
  large,
}: {
  requests: WorkspaceSupportRequest[];
  empty: string;
  large?: boolean;
}) {
  if (requests.length === 0) return <EmptyState text={empty} />;

  return (
    <div className={cn("divide-y divide-slate-100 dark:divide-slate-800", large && "grid grid-cols-1 divide-y-0 md:grid-cols-2")}>
      {requests.map((request) => (
        <Link
          key={request.id}
          href={`/leads/${request.lead_id}`}
          className="block p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                {request.subject}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {request.lead?.name || "Unknown lead"} / {request.department?.name || "No department"}
              </p>
            </div>
            <PriorityBadge priority={request.priority} />
          </div>
          {request.description && (
            <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{request.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}

function MeetingList({
  items,
  empty,
}: {
  items: WorkspaceMeetingItem[];
  empty: string;
}) {
  if (items.length === 0) return <EmptyState text={empty} />;

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <Link key={item.id} href={`/leads/${item.lead_id}`} className="block p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900">
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
            {item.lead?.name || "Unknown lead"}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {item.date} / {item.slot} / {item.sales_executive?.name || "Unassigned"}
          </p>
        </Link>
      ))}
    </div>
  );
}

function MeasurementList({
  items,
  empty,
}: {
  items: WorkspaceMeasurementItem[];
  empty: string;
}) {
  if (items.length === 0) return <EmptyState text={empty} />;

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <Link key={item.id} href={`/leads/${item.lead_id}`} className="block p-4 transition hover:bg-slate-50 dark:hover:bg-slate-900">
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
            {item.lead?.name || "Unknown lead"}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : "No schedule"} / {item.measurement_user?.name || "Unassigned"}
          </p>
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
  tone: "blue" | "red" | "amber" | "purple";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
    red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
    amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
    purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900",
  };

  return (
    <div className={cn("rounded-xl border p-3", tones[tone])}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: WorkspaceSupportRequest["priority"];
}) {
  const className =
    priority === "urgent"
      ? "bg-red-100 text-red-700"
      : priority === "high"
        ? "bg-orange-100 text-orange-700"
      : priority === "low"
          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";

  return (
    <Badge className={cn("rounded-full text-[10px] font-black hover:bg-current", className)}>
      {priority}
    </Badge>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center p-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
      {text}
    </div>
  );
}
