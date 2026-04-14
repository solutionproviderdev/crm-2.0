"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus,
  ArrowRightLeft,
  MessageSquare,
  Phone,
  CreditCard,
  PhoneCall,
  AlarmClock,
  CheckCircle2,
  DollarSign,
  Activity,
  BarChart3,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import type { LeadActivityLog } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Action metadata map — maps typed action strings to icon + colour + label
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_META: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  "lead.created": {
    icon: UserPlus,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    label: "Lead created",
  },
  "lead.status_changed": {
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Status changed",
  },
  "lead.assigned.cre": {
    icon: Briefcase,
    color: "text-violet-600",
    bg: "bg-violet-100",
    label: "CRE assigned",
  },
  "lead.assigned.sales": {
    icon: TrendingUp,
    color: "text-orange-600",
    bg: "bg-orange-100",
    label: "Sales assigned",
  },
  "lead.assigned.bulk": {
    icon: TrendingUp,
    color: "text-orange-600",
    bg: "bg-orange-100",
    label: "Bulk assigned",
  },
  "lead.comment_added": {
    icon: MessageSquare,
    color: "text-sky-600",
    bg: "bg-sky-100",
    label: "Comment added",
  },
  "lead.phone_added": {
    icon: Phone,
    color: "text-teal-600",
    bg: "bg-teal-100",
    label: "Phone added",
  },
  "lead.payment_recorded": {
    icon: CreditCard,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Payment recorded",
  },
  "lead.call_logged": {
    icon: PhoneCall,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    label: "Call logged",
  },
  "lead.follow_up_created": {
    icon: AlarmClock,
    color: "text-amber-600",
    bg: "bg-amber-100",
    label: "Follow-up created",
  },
  "lead.follow_up_updated": {
    icon: AlarmClock,
    color: "text-amber-600",
    bg: "bg-amber-100",
    label: "Follow-up updated",
  },
  "lead.meeting_created": {
    icon: CheckCircle2,
    color: "text-cyan-600",
    bg: "bg-cyan-100",
    label: "Meeting scheduled",
  },
  "lead.meeting_rescheduled": {
    icon: CheckCircle2,
    color: "text-cyan-600",
    bg: "bg-cyan-100",
    label: "Meeting rescheduled",
  },
  "lead.meeting_status_changed": {
    icon: CheckCircle2,
    color: "text-cyan-600",
    bg: "bg-cyan-100",
    label: "Meeting updated",
  },
  "lead.meeting_completed": {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    label: "Meeting completed",
  },
  "lead.sold": {
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Lead sold 🎉",
  },
  "lead.project_status_changed": {
    icon: BarChart3,
    color: "text-purple-600",
    bg: "bg-purple-100",
    label: "Project status updated",
  },
};

const DEFAULT_META = {
  icon: Activity,
  color: "text-muted-foreground",
  bg: "bg-muted",
  label: "Activity",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for generating human-readable descriptions from metadata
// ─────────────────────────────────────────────────────────────────────────────
function getActivityDescription(log: LeadActivityLog): string {
  const m = log.metadata as Record<string, unknown>;
  switch (log.action) {
    case "lead.status_changed":
      if (m.from && m.to) return `Status: "${m.from}" → "${m.to}"`;
      if (m.to) return `Status changed to "${m.to}"`;
      return "";
    case "lead.assigned.cre":
      return "New CRE assigned to lead";
    case "lead.assigned.sales":
      return "New sales executive assigned";
    case "lead.assigned.bulk":
      return `Bulk-assigned (${m.totalInBatch ?? ""} leads) as ${m.role}`;
    case "lead.payment_recorded":
      if (m.amount) return `৳${Number(m.amount).toLocaleString()} recorded via ${m.method}`;
      return "";
    case "lead.call_logged":
      if (m.callType) return `${m.callType} call — ${m.status}`;
      return "";
    case "lead.follow_up_created":
      return m.type ? `${m.type} follow-up scheduled` : "Follow-up scheduled";
    case "lead.follow_up_updated":
      return m.newStatus ? `Follow-up marked as ${m.newStatus}` : "";
    case "lead.meeting_rescheduled":
      return m.to
        ? `Rescheduled to ${(m.to as Record<string, string>).slot}`
        : "Meeting rescheduled";
    case "lead.meeting_status_changed":
      if (m.from && m.to) return `Meeting: "${m.from}" → "${m.to}"`;
      return "";
    case "lead.project_status_changed":
      const to = m.to as Record<string, string> | undefined;
      if (to?.status) return `${to.status}${to.subStatus ? ` → ${to.subStatus}` : ""}`;
      return "";
    case "lead.sold":
      if (m.soldAmount) return `Sold for ৳${Number(m.soldAmount).toLocaleString()}`;
      return "";
    default:
      return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single activity row
// ─────────────────────────────────────────────────────────────────────────────
function ActivityItem({
  log,
}: {
  log: LeadActivityLog & { lead?: { id: string; name: string; cid?: string } | null };
}) {
  const meta = ACTION_META[log.action] ?? DEFAULT_META;
  const Icon = meta.icon;
  const description = getActivityDescription(log);
  const actor = log.actor as { id: string; name: string; profile_picture: string | null } | null;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Icon bubble — uses semantic muted bg pair */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">
            {meta.label}
            {log.lead && (
              <span className="font-normal text-muted-foreground"> on </span>
            )}
            {log.lead && (
              <Link
                href={`/leads/${log.lead.id}`}
                className="font-semibold text-[var(--brand-primary)] hover:underline"
              >
                {log.lead.name}
              </Link>
            )}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </span>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        )}

        {actor && (
          <div className="flex items-center gap-1 mt-1">
            {actor.profile_picture ? (
              <img
                src={actor.profile_picture}
                alt={actor.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-[var(--brand-primary)]">
                  {actor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">{actor.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter chips
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "All" },
  { key: "lead.created", label: "New Leads" },
  { key: "lead.status_changed", label: "Status" },
  { key: "lead.sold", label: "Sold" },
  { key: "lead.payment_recorded", label: "Payments" },
  { key: "lead.meeting_created", label: "Meetings" },
  { key: "lead.comment_added", label: "Comments" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────────────────────
interface ActivityFeedProps {
  logs: (LeadActivityLog & {
    lead?: { id: string; name: string; cid?: string } | null;
  })[];
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? logs
      : logs.filter((l) => l.action === activeFilter);

  return (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border ${
              activeFilter === f.key
                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-border pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Activity className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">
              Actions on leads will appear here automatically.
            </p>
          </div>
        ) : (
          filtered.map((log) => <ActivityItem key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
