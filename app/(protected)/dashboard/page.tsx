import { Suspense } from "react";
import { Activity, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getRecentActivityFeed, getDashboardLeadStats } from "@/app/actions/dashboard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardStatsGrid, StatusBreakdown } from "@/components/dashboard/DashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Dashboard | EaseIT CRM",
  description: "Your command centre — leads, activity, and performance at a glance.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard content (all dynamic data here, streamed inside Suspense)
// ─────────────────────────────────────────────────────────────────────────────
async function DashboardContent() {
  const user = await getCurrentUser();
  const isAdmin = user?.type === "Admin";
  const userId = user?.id;

  const [activityResult, statsResult] = await Promise.all([
    getRecentActivityFeed({ userId, isAdmin, limit: 40 }),
    getDashboardLeadStats({ userId, isAdmin }),
  ]);

  const logs = activityResult.success ? activityResult.data : [];
  const stats = statsResult.success
    ? statsResult.data
    : { total: 0, byStatus: [] };

  return (
    <>
      {/* ── Greeting ─────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Welcome back,{" "}
            <span className="text-[var(--brand-primary)]">
              {user?.nickname ?? user?.name?.split(" ")[0] ?? "there"}
            </span>{" "}
            👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening across your leads today.
          </p>
        </div>
        <Link
          href="/leads"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
        >
          View all leads <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <DashboardStatsGrid total={stats.total} byStatus={stats.byStatus} />

      {/* ── Main grid: Activity Feed + Breakdown ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Activity Feed — 2/3 ─────────────────────────────── */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-light)] flex items-center justify-center">
                <Activity className="w-4 h-4 text-[var(--brand-primary)]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Recent Activity
                </h2>
                <p className="text-xs text-muted-foreground">
                  Last {logs.length} actions on leads
                </p>
              </div>
            </div>
            {/* Live pulse indicator */}
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
            </span>
          </div>

          {/* feed scroll area */}
          <div className="flex-1 overflow-hidden p-5" style={{ maxHeight: 560 }}>
            <ActivityFeed logs={logs as Parameters<typeof ActivityFeed>[0]["logs"]} />
          </div>
        </div>

        {/* Pipeline Breakdown — 1/3 */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Lead Pipeline
              </h2>
              <p className="text-xs text-muted-foreground">{stats.total} total leads</p>
            </div>
          </div>

          <StatusBreakdown byStatus={stats.byStatus} total={stats.total} />

          {/* Quick links */}
          <div className="mt-auto pt-4 border-t border-border space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Quick Links
            </p>
            {[
              { href: "/leads", label: "Lead Management" },
              { href: "/meetings/slots", label: "Meeting Schedule" },
              { href: "/reminders", label: "Reminders" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between group py-1.5 px-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-[var(--brand-primary)]">
                  {label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[var(--brand-primary)] transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            {/* Greeting skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-9 w-72 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded-lg" />
            </div>
            <StatsSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><Skeleton className="h-[560px] rounded-2xl" /></div>
              <Skeleton className="h-[560px] rounded-2xl" />
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
