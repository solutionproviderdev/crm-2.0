"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Hammer,
  Handshake,
  LucideIcon,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  Ruler,
  Star,
  TrendingDown,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import type {
  Lead,
  LifecycleStatusGroup,
  LifecycleStatusOption,
  LifecycleTransitionRule,
  User,
} from "@/lib/types";
import { StatusActionDialog } from "./status-modals/StatusActionDialog";

interface LifecycleActionPanelProps {
  lead: Lead;
  lifecycleStatusGroups?: LifecycleStatusGroup[];
  lifecycleTransitionRules?: LifecycleTransitionRule[];
  users?: User[];
  variant?: "panel" | "compact";
}

interface TransitionAction {
  rule: LifecycleTransitionRule;
  status: LifecycleStatusOption;
  group: LifecycleStatusGroup;
}

export const fallbackStatusGroups: LifecycleStatusGroup[] = [
  {
    id: "fallback-lead",
    code: "lead",
    name: "Lead",
    description: null,
    sort_order: 10,
    statuses: [
      "New",
      "Message Rescheduled",
      "Number Collected",
      "Call Rescheduled",
      "Ongoing",
      "Need Support",
      "Closed",
    ].map((name, index) => ({
      id: `fallback-lead-${index}`,
      code: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description: null,
      sort_order: index,
      default_department_id: null,
      is_terminal: name === "Closed",
      is_conversion_point: false,
    })),
  },
  {
    id: "fallback-client",
    code: "client",
    name: "Client",
    description: null,
    sort_order: 20,
    statuses: [
      "Meeting Fixed",
      "Meeting Complete",
      "Quotation Sent",
      "Prospect",
      "Sold",
      "Lost",
      "Closed",
      "Measurement Scheduled",
      "Measurement Done",
    ].map((name, index) => ({
      id: `fallback-client-${index}`,
      code: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description: null,
      sort_order: index,
      default_department_id: null,
      is_terminal: ["Lost", "Closed"].includes(name),
      is_conversion_point: ["Meeting Fixed", "Sold", "Measurement Done"].includes(name),
    })),
  },
  {
    id: "fallback-project",
    code: "project",
    name: "Project",
    description: null,
    sort_order: 30,
    statuses: [
      "Material Ordered",
      "Material Received",
      "Making",
      "Ready for Installation",
      "Out for Installation",
      "Installation Completed",
      "Handed Over",
      "Closed",
    ].map((name, index) => ({
      id: `fallback-project-${index}`,
      code: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description: null,
      sort_order: index,
      default_department_id: null,
      is_terminal: ["Handed Over", "Closed"].includes(name),
      is_conversion_point: name === "Handed Over",
    })),
  },
];

const statusIconMap: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  New: { icon: Star, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  "Message Rescheduled": { icon: MessageCircle, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  "Number Collected": { icon: Phone, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  "Call Reschedule": { icon: Phone, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  "Call Rescheduled": { icon: Phone, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  Ongoing: { icon: Clock, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  "Need Support": { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
  Close: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30" },
  Closed: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30" },
  "Meeting Fixed": { icon: Calendar, color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-950/30" },
  "Meeting Complete": { icon: Check, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  "Quotation Sent": { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  Prospect: { icon: Eye, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  Sold: { icon: Handshake, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
  Lost: { icon: TrendingDown, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
  "Mesurement Done": { icon: Ruler, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  "Measurement Scheduled": { icon: Calendar, color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950/30" },
  "Measurement Done": { icon: Ruler, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  "Material Ordered": { icon: Package, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  "Material Received": { icon: PackageCheck, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  Making: { icon: Hammer, color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30" },
  "Ready for Installation": { icon: Check, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  "Out for Installation": { icon: Truck, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  "Installation Completed": { icon: Check, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  "Handed Over": { icon: MapPin, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
};

const actionLabelMap: Record<string, string> = {
  "Message Rescheduled": "Reschedule Message",
  "Number Collected": "Save Number",
  "Call Rescheduled": "Schedule Call",
  Ongoing: "Mark Ongoing",
  "Need Support": "Request Support",
  "Meeting Fixed": "Fix Meeting",
  "Meeting Complete": "Complete Meeting",
  "Quotation Sent": "Send Quotation",
  Prospect: "Mark Prospect",
  Sold: "Mark Sold",
  Lost: "Mark Lost",
  Closed: "Close Record",
  "Measurement Scheduled": "Schedule Measurement",
  "Measurement Done": "Complete Measurement",
  "Material Ordered": "Order Material",
  "Material Received": "Confirm Material",
  Making: "Start Making",
  "Ready for Installation": "Mark Ready",
  "Out for Installation": "Dispatch Installation",
  "Installation Completed": "Complete Installation",
  "Handed Over": "Hand Over",
};

const legacyStatusNames: Record<string, string> = {
  "Call Reschedule": "Call Rescheduled",
  Close: "Closed",
  "Mesurement Done": "Measurement Done",
};

const getStatusConfig = (status: string) =>
  statusIconMap[status] || { icon: Star, color: "text-slate-600", bgColor: "bg-slate-50 dark:bg-slate-900" };

const normalizeStatusName = (status: string) => legacyStatusNames[status] || status;

function flattenStatuses(groups: LifecycleStatusGroup[]) {
  return groups.flatMap((group) =>
    group.statuses.map((status) => ({
      status,
      group,
    }))
  );
}

function getOwner(lead: Lead, users: User[]) {
  const ownerId = lead.current_owner_id || lead.sales_executive_id || lead.cre_id;
  return users.find((user) => user.id === ownerId) || null;
}

function getRequirementBadges(rule: LifecycleTransitionRule) {
  return [
    rule.requires_note ? "Note" : null,
    rule.requires_assignment ? "Assign" : null,
    rule.requires_follow_up ? "Follow-up" : null,
  ].filter(Boolean);
}

export function LifecycleActionPanel({
  lead,
  lifecycleStatusGroups,
  lifecycleTransitionRules = [],
  users = [],
  variant = "panel",
}: LifecycleActionPanelProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<TransitionAction | null>(null);

  const statusGroups = lifecycleStatusGroups?.length
    ? lifecycleStatusGroups
    : fallbackStatusGroups;

  const lifecycle = useMemo(() => {
    const flattened = flattenStatuses(statusGroups);
    const normalizedLeadStatus = normalizeStatusName(lead.status || "New");
    const currentById = lead.current_status_id
      ? flattened.find((item) => item.status.id === lead.current_status_id)
      : undefined;
    const currentByName = flattened.find((item) => item.status.name === normalizedLeadStatus);
    const current = currentById || currentByName || flattened[0];
    const statusById = new Map(flattened.map((item) => [item.status.id, item]));

    const actions = lifecycleTransitionRules
      .filter((rule) => rule.from_status_id === current?.status.id)
      .map((rule) => {
        const target = statusById.get(rule.to_status_id);
        if (!target) return null;
        return {
          rule,
          status: target.status,
          group: target.group,
        };
      })
      .filter((action): action is TransitionAction => Boolean(action));

    return {
      currentStatus: current?.status,
      currentGroup: current?.group,
      actions,
    };
  }, [lead.current_status_id, lead.status, lifecycleTransitionRules, statusGroups]);

  const currentStatusName = lifecycle.currentStatus?.name || normalizeStatusName(lead.status || "New");
  const currentGroupName = lifecycle.currentGroup?.name || "Lead";
  const owner = getOwner(lead, users);
  const departmentName = owner?.department?.name || "Unassigned";
  const { icon: CurrentIcon, color, bgColor } = getStatusConfig(currentStatusName);
  const terminal = lifecycle.currentStatus?.is_terminal;

  const openAction = (action: TransitionAction) => {
    setSelectedAction(action);
    setDialogOpen(true);
  };

  if (variant === "compact") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 rounded-xl border-slate-200 px-3 font-bold shadow-sm",
                bgColor,
                color
              )}
            >
              <CurrentIcon className="h-4 w-4" />
              <span className="hidden xl:inline">{currentGroupName} / </span>
              <span>{currentStatusName}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-2xl p-1">
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Valid Next Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {lifecycle.actions.length > 0 ? (
              lifecycle.actions.map((action) => (
                <ActionMenuItem key={action.rule.id} action={action} onSelect={openAction} />
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-slate-500">
                {terminal ? "This record is terminal." : "No valid next action configured."}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <StatusActionDialog
          isOpen={isDialogOpen}
          onClose={() => setDialogOpen(false)}
          lead={lead}
          targetStatus={selectedAction?.status.name || ""}
          targetStatusId={selectedAction?.status.id}
          targetStageId={selectedAction?.group.id}
          targetTransition={selectedAction?.rule}
          users={users}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Lifecycle
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full bg-slate-50 px-3 py-1 font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {currentGroupName}
              </Badge>
              <Badge className={cn("rounded-full px-3 py-1 font-black", bgColor, color)}>
                <CurrentIcon className="mr-1.5 h-3.5 w-3.5" />
                {currentStatusName}
              </Badge>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-slate-500 dark:bg-slate-900">
            <UserRound className="h-4 w-4" />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="font-black uppercase tracking-wider text-slate-400">Owner</p>
            <p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">
              {owner?.name || "Unassigned"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="font-black uppercase tracking-wider text-slate-400">Department</p>
            <p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">
              {departmentName}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Available Actions
          </p>
          {lifecycle.actions.length > 0 ? (
            <div className="grid gap-2">
              {lifecycle.actions.map((action) => (
                <ActionButton key={action.rule.id} action={action} onSelect={openAction} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              {terminal ? "This lifecycle record is complete." : "No valid next transition is configured from this status."}
            </div>
          )}
        </div>
      </div>

      <StatusActionDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        lead={lead}
        targetStatus={selectedAction?.status.name || ""}
        targetStatusId={selectedAction?.status.id}
        targetStageId={selectedAction?.group.id}
        targetTransition={selectedAction?.rule}
        users={users}
      />
    </>
  );
}

function ActionButton({
  action,
  onSelect,
}: {
  action: TransitionAction;
  onSelect: (action: TransitionAction) => void;
}) {
  const config = getStatusConfig(action.status.name);
  const Icon = config.icon;
  const badges = getRequirementBadges(action.rule);

  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
          {actionLabelMap[action.status.name] || action.status.name}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Move to {action.group.name} / {action.status.name}
        </p>
      </div>
      {badges.length > 0 && (
        <div className="flex shrink-0 flex-col gap-1">
          {badges.map((badge) => (
            <Badge key={badge} variant="outline" className="h-5 rounded-full px-2 text-[9px] font-black">
              {badge}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}

function ActionMenuItem({
  action,
  onSelect,
}: {
  action: TransitionAction;
  onSelect: (action: TransitionAction) => void;
}) {
  const config = getStatusConfig(action.status.name);
  const Icon = config.icon;

  return (
    <DropdownMenuItem
      onClick={() => onSelect(action)}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"
    >
      <Icon className={cn("h-4 w-4", config.color)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{actionLabelMap[action.status.name] || action.status.name}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {action.group.name} / {action.status.name}
        </p>
      </div>
    </DropdownMenuItem>
  );
}
