"use client";

import { TrendingUp, Users, CheckCircle2, DollarSign, BarChart3 } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: string;
}

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-3xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  total: number;
  byStatus: { status: string; count: number }[];
}

export function DashboardStatsGrid({ total, byStatus }: StatsGridProps) {
  const sold = byStatus.find((s) => s.status === "Sold")?.count ?? 0;
  const meetingFixed = byStatus.find((s) => s.status === "Meeting Fixed")?.count ?? 0;
  const ongoing = byStatus.find((s) => s.status === "Ongoing")?.count ?? 0;
  const newLeads = byStatus.find((s) => s.status === "New")?.count ?? 0;
  const soldRate = total > 0 ? ((sold / total) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Leads"
        value={total}
        sub={`${newLeads} new`}
        icon={Users}
        iconColor="text-[var(--brand-primary)]"
        iconBg="bg-[var(--brand-primary-light)]"
      />
      <StatCard
        label="Meeting Fixed"
        value={meetingFixed}
        sub="Pending visit"
        icon={CheckCircle2}
        iconColor="text-cyan-600"
        iconBg="bg-cyan-100"
      />
      <StatCard
        label="Ongoing Projects"
        value={ongoing}
        sub="In progress"
        icon={BarChart3}
        iconColor="text-purple-600"
        iconBg="bg-purple-100"
      />
      <StatCard
        label="Sold"
        value={sold}
        sub={`${soldRate}% conversion`}
        icon={DollarSign}
        iconColor="text-green-600"
        iconBg="bg-green-100"
        trend={sold > 0 ? `${soldRate}% rate` : undefined}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Breakdown bar chart
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBreakdownProps {
  byStatus: { status: string; count: number }[];
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  "New": "bg-slate-400",
  "Meeting Fixed": "bg-cyan-500",
  "Meeting Complete": "bg-blue-500",
  "Ongoing": "bg-purple-500",
  "Sold": "bg-green-500",
  "Lost": "bg-red-400",
  "Dropped": "bg-orange-400",
};

export function StatusBreakdown({ byStatus, total }: StatusBreakdownProps) {
  return (
    <div className="space-y-3">
      {byStatus.slice(0, 7).map(({ status, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        const color = STATUS_COLORS[status] ?? "bg-muted-foreground";
        return (
          <div key={status}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{status}</span>
              <span className="text-xs font-bold text-foreground">
                {count}{" "}
                <span className="font-normal text-muted-foreground">
                  ({pct.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
