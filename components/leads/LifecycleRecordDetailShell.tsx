"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  FileText,
  FolderKanban,
  History,
  Home,
  MessageCircle,
  Package,
  Phone,
  Ruler,
  ShieldCheck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils/cn";
import type {
  Department,
  Lead,
  LeadLifecycleTimeline,
  LifecycleStageCode,
  LifecycleStatusGroup,
  LifecycleTransitionRule,
  User,
} from "@/lib/types";
import { GeneralInfo } from "./GeneralInfo";
import { LeadStatusControl } from "./LeadStatusControl";
import { LeadPhoneNumbers } from "./LeadPhoneNumbers";
import { LeadAddressEditor } from "./LeadAddressEditor";
import { LeadRequirements } from "./LeadRequirements";
import { MeetingList } from "./MeetingList";
import { LeadCommentsTab } from "./tabs/LeadCommentsTab";
import { LeadFollowUpTab } from "./tabs/LeadFollowUpTab";
import { LeadFinanceTab } from "./tabs/LeadFinanceTab";
import { LeadCallLogTab } from "./tabs/LeadCallLogTab";
import { AssignmentPanel } from "./AssignmentPanel";

interface LifecycleRecordDetailShellProps {
  lead: Lead;
  users: User[];
  lifecycleStatusGroups: LifecycleStatusGroup[];
  lifecycleTransitionRules: LifecycleTransitionRule[];
  timeline: LeadLifecycleTimeline;
  departments: Department[];
}

interface LifecycleContext {
  stageCode: LifecycleStageCode;
  stageName: string;
  statusName: string;
  owner: User | null;
  departmentName: string;
}

const legacyStatusNames: Record<string, string> = {
  "Call Reschedule": "Call Rescheduled",
  Close: "Closed",
  "Mesurement Done": "Measurement Done",
};

function normalizeStatusName(status: string) {
  return legacyStatusNames[status] || status;
}

function getLifecycleContext(
  lead: Lead,
  users: User[],
  groups: LifecycleStatusGroup[]
): LifecycleContext {
  const flattened = groups.flatMap((group) =>
    group.statuses.map((status) => ({ group, status }))
  );
  const normalized = normalizeStatusName(lead.status || "New");
  const currentById = lead.current_status_id
    ? flattened.find((item) => item.status.id === lead.current_status_id)
    : undefined;
  const current = currentById || flattened.find((item) => item.status.name === normalized);
  const ownerId = lead.current_owner_id || lead.sales_executive_id || lead.cre_id;
  const owner = users.find((user) => user.id === ownerId) || null;

  return {
    stageCode: current?.group.code || "lead",
    stageName: current?.group.name || "Lead",
    statusName: current?.status.name || normalized,
    owner,
    departmentName: owner?.department?.name || "Unassigned",
  };
}

function getDefaultTab(stageCode: LifecycleStageCode) {
  if (stageCode === "client") return "meeting";
  if (stageCode === "project") return "production";
  return "overview";
}

export function LifecycleRecordDetailShell({
  lead,
  users,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
  timeline,
  departments,
}: LifecycleRecordDetailShellProps) {
  const context = getLifecycleContext(lead, users, lifecycleStatusGroups);

  return (
    <div className="flex min-h-full flex-col bg-slate-50/60 dark:bg-slate-950">
      <LifecycleDetailHeader lead={lead} context={context} />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 space-y-6">
            <StageTabs
              lead={lead}
              users={users}
              lifecycleStatusGroups={lifecycleStatusGroups}
              lifecycleTransitionRules={lifecycleTransitionRules}
              stageCode={context.stageCode}
              timeline={timeline}
            />
          </section>

          <aside className="space-y-6">
            <AssignmentPanel
              lead={lead}
              users={users}
              departments={departments}
              assignments={timeline.assignments}
            />
            <LeadStatusControl
              lead={lead}
              lifecycleStatusGroups={lifecycleStatusGroups}
              lifecycleTransitionRules={lifecycleTransitionRules}
              users={users}
            />
            <LifecycleTimelinePanel timeline={timeline} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function LifecycleDetailHeader({
  lead,
  context,
}: {
  lead: Lead;
  context: LifecycleContext;
}) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1 rounded-full">
            <Link href="/leads" aria-label="Back to leads">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                {lead.name}
              </h1>
              <Badge variant="outline" className="rounded-full bg-white font-black text-[var(--brand-primary)] dark:bg-slate-950">
                {lead.cid || "Pending CID"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span>{lead.source}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Created {new Date(lead.created_at).toLocaleDateString()}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{lead.phones?.[0] || "No phone recorded"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[760px]">
          <HeaderMetric icon={FolderKanban} label="Stage" value={context.stageName} />
          <HeaderMetric icon={CheckCircle2} label="Status" value={context.statusName} />
          <HeaderMetric icon={UserRound} label="Owner" value={context.owner?.name || "Unassigned"} />
          <HeaderMetric icon={ShieldCheck} label="Department" value={context.departmentName} />
          <HeaderMetric icon={ShieldCheck} label="Priority" value={lead.priority || "normal"} />
        </div>
      </div>
    </header>
  );
}

function HeaderMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-black capitalize text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function StageTabs({
  lead,
  users,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
  stageCode,
  timeline,
}: {
  lead: Lead;
  users: User[];
  lifecycleStatusGroups: LifecycleStatusGroup[];
  lifecycleTransitionRules: LifecycleTransitionRule[];
  stageCode: LifecycleStageCode;
  timeline: LeadLifecycleTimeline;
}) {
  const tabs = getTabsForStage(stageCode);

  return (
    <Tabs defaultValue={getDefaultTab(stageCode)} className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-10 rounded-xl px-3 text-xs font-black data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white"
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="m-0">
        <GeneralInfo
          lead={lead}
          allUsers={users}
          lifecycleStatusGroups={lifecycleStatusGroups}
          lifecycleTransitionRules={lifecycleTransitionRules}
        />
      </TabsContent>
      <TabsContent value="contact" className="m-0">
        <ContactPanel lead={lead} />
      </TabsContent>
      <TabsContent value="meeting" className="m-0">
        <MeetingList meetings={lead.meetings || []} leadId={lead.id} />
      </TabsContent>
      <TabsContent value="quotation" className="m-0">
        <PlaceholderPanel icon={FileText} title="Quotation" text="Quotation records will attach here as the client workflow matures." />
      </TabsContent>
      <TabsContent value="measurement" className="m-0">
        <PlaceholderPanel icon={Ruler} title="Measurement" text="Measurement schedule and completion details will live here." />
      </TabsContent>
      <TabsContent value="materials" className="m-0">
        <PlaceholderPanel icon={Package} title="Materials" text="Material ordering and receiving data will be connected in a later phase." />
      </TabsContent>
      <TabsContent value="production" className="m-0">
        <ProjectOperationsPanel lead={lead} />
      </TabsContent>
      <TabsContent value="installation" className="m-0">
        <PlaceholderPanel icon={Wrench} title="Installation" text="Installation schedule, dispatch, and completion notes will appear here." />
      </TabsContent>
      <TabsContent value="files" className="m-0">
        <PlaceholderPanel icon={Home} title="Files" text="Project files, drawings, and handover documents will be grouped here." />
      </TabsContent>
      <TabsContent value="finance" className="m-0">
        <TallCard>
          <LeadFinanceTab lead={lead} />
        </TallCard>
      </TabsContent>
      <TabsContent value="followups" className="m-0">
        <TallCard>
          <LeadFollowUpTab lead={lead} />
        </TallCard>
      </TabsContent>
      <TabsContent value="comments" className="m-0">
        <TallCard>
          <LeadCommentsTab lead={lead} />
        </TallCard>
      </TabsContent>
      <TabsContent value="activity" className="m-0">
        <ActivityPanel lead={lead} timeline={timeline} />
      </TabsContent>
      <TabsContent value="calls" className="m-0">
        <TallCard>
          <LeadCallLogTab lead={lead} />
        </TallCard>
      </TabsContent>
    </Tabs>
  );
}

function getTabsForStage(stageCode: LifecycleStageCode) {
  if (stageCode === "client") {
    return [
      { value: "overview", label: "Overview", icon: ClipboardList },
      { value: "meeting", label: "Meeting", icon: CalendarDays },
      { value: "quotation", label: "Quotation", icon: FileText },
      { value: "finance", label: "Finance", icon: Coins },
      { value: "measurement", label: "Measurement", icon: Ruler },
      { value: "followups", label: "Follow-ups", icon: History },
      { value: "activity", label: "Activity", icon: Activity },
    ];
  }

  if (stageCode === "project") {
    return [
      { value: "overview", label: "Overview", icon: ClipboardList },
      { value: "materials", label: "Materials", icon: Package },
      { value: "production", label: "Production", icon: BriefcaseBusiness },
      { value: "installation", label: "Installation", icon: Wrench },
      { value: "finance", label: "Finance", icon: Coins },
      { value: "files", label: "Files", icon: FileText },
      { value: "activity", label: "Activity", icon: Activity },
    ];
  }

  return [
    { value: "overview", label: "Overview", icon: ClipboardList },
    { value: "contact", label: "Contact", icon: Phone },
    { value: "followups", label: "Follow-ups", icon: History },
    { value: "comments", label: "Comments", icon: MessageCircle },
    { value: "activity", label: "Activity", icon: Activity },
  ];
}

function ContactPanel({ lead }: { lead: Lead }) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-black">Contact And Requirements</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <LeadPhoneNumbers lead={lead} />
          <LeadAddressEditor lead={lead} />
        </div>
        <LeadRequirements lead={lead} />
      </CardContent>
    </Card>
  );
}

function ProjectOperationsPanel({ lead }: { lead: Lead }) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-black">Production Context</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoTile label="Current Phase" value={lead.project_status?.status || "Unknown"} />
        <InfoTile label="Current Milestone" value={lead.project_status?.subStatus || "None"} />
        <InfoTile label="Project Value" value={`৳${(lead.finance?.projectValue || 0).toLocaleString()}`} />
        <InfoTile label="Client Budget" value={`৳${(lead.finance?.clientsBudget || 0).toLocaleString()}`} />
      </CardContent>
    </Card>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function PlaceholderPanel({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <Card className="border-dashed shadow-sm">
      <CardContent className="flex min-h-64 flex-col items-center justify-center p-10 text-center">
        <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500 dark:bg-slate-900">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">{text}</p>
      </CardContent>
    </Card>
  );
}

function ActivityPanel({
  lead,
  timeline,
}: {
  lead: Lead;
  timeline: LeadLifecycleTimeline;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <LifecycleTimelinePanel timeline={timeline} only="status" />
      <LifecycleTimelinePanel timeline={timeline} only="assignments" />
      <div className="lg:col-span-2">
        <TallCard>
          <LeadCallLogTab lead={lead} />
        </TallCard>
      </div>
    </div>
  );
}

function LifecycleTimelinePanel({
  timeline,
  only,
}: {
  timeline: LeadLifecycleTimeline;
  only?: "status" | "assignments";
}) {
  const showStatus = !only || only === "status";
  const showAssignments = !only || only === "assignments";

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <Activity className="h-4 w-4 text-[var(--brand-primary)]" />
          {only === "assignments" ? "Assignment Timeline" : only === "status" ? "Status Timeline" : "Lifecycle History"}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[520px] space-y-6 overflow-y-auto">
        {showStatus && (
          <TimelineSection
            title="Status Changes"
            empty="No lifecycle status changes recorded yet."
            items={timeline.statusHistory.map((item) => ({
              id: item.id,
              title: item.to_status?.name || "Status changed",
              subtitle: `${item.from_status?.name || "Initial"} -> ${item.to_status?.name || "Unknown"}`,
              meta: `${new Date(item.changed_at).toLocaleString()} by ${item.changed_by_user?.name || "System"}`,
              note: item.note,
            }))}
          />
        )}
        {showAssignments && (
          <TimelineSection
            title="Assignments"
            empty="No assignment history recorded yet."
            items={timeline.assignments.map((item) => ({
              id: item.id,
              title: item.assigned_user?.name || "Unassigned",
              subtitle: `${item.department?.name || "No department"} / ${item.status?.name || "Any status"}`,
              meta: `${new Date(item.assigned_at).toLocaleString()} by ${item.assigned_by_user?.name || "System"}`,
              note: item.reason,
              active: item.is_current,
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TimelineSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    note?: string | null;
    active?: boolean;
  }[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <Badge variant="outline" className="rounded-full text-[10px] font-black">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          {empty}
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((item, index) => (
            <div key={item.id} className="relative pb-5 pl-7">
              {index < items.length - 1 && (
                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
              )}
              <div
                className={cn(
                  "absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm dark:border-slate-950",
                  item.active ? "bg-[var(--brand-primary)]" : "bg-slate-300"
                )}
              />
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.subtitle}</p>
                  </div>
                  {item.active && (
                    <Badge className="shrink-0 rounded-full bg-green-100 text-[10px] font-black text-green-700 hover:bg-green-100">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.meta}</p>
                {item.note && (
                  <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TallCard({ children }: { children: ReactNode }) {
  return (
    <Card className="h-[calc(100vh-17rem)] min-h-[520px] overflow-hidden border-none shadow-sm">
      {children}
    </Card>
  );
}
