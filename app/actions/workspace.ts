"use server";

import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type {
  ActionResult,
  WorkspaceFollowUpItem,
  WorkspaceInboxData,
  WorkspaceLeadSummary,
  WorkspaceMeasurementItem,
  WorkspaceMeetingItem,
  WorkspaceSupportRequest,
} from "@/lib/types";

interface WorkspaceScope {
  userId?: string;
  isAdmin?: boolean;
}

const LEAD_SUMMARY_SELECT = `
  id,
  cid,
  name,
  status,
  current_status_id,
  current_owner_id,
  current_department_id,
  priority,
  source,
  phones,
  created_at,
  current_owner:users!leads_current_owner_id_fkey(id, name, profile_picture),
  cre:users!leads_cre_id_fkey(id, name, profile_picture),
  sales_executive:users!leads_sales_executive_id_fkey(id, name, profile_picture)
`;

function dayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    now: new Date().toISOString(),
  };
}

function applyLeadScope<T extends { or: (filters: string) => T }>(
  query: T,
  scope: WorkspaceScope
) {
  if (scope.isAdmin || !scope.userId) return query;
  return query.or(
    `current_owner_id.eq.${scope.userId},cre_id.eq.${scope.userId},sales_executive_id.eq.${scope.userId}`
  );
}

export async function getWorkspaceInbox(
  scope: WorkspaceScope
): Promise<ActionResult<WorkspaceInboxData>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.WORKSPACE, CACHE_TAGS.LEADS, CACHE_TAGS.FOLLOW_UPS);

  const supabase = createAdminClient();
  const { start, end, now } = dayBounds();
  const userId = scope.userId;
  const isAdmin = scope.isAdmin ?? false;

  const myTasksQuery = applyLeadScope(
    supabase
      .from("leads")
      .select(LEAD_SUMMARY_SELECT)
      .not("current_owner_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
    scope
  );

  const unassignedQuery = supabase
    .from("leads")
    .select(LEAD_SUMMARY_SELECT)
    .is("current_owner_id", null)
    .order("created_at", { ascending: false })
    .limit(12);

  let overdueFollowUpsQuery = supabase
    .from("lead_follow_ups")
    .select(
      `
      *,
      assigned_user:users(id, name, profile_picture),
      lead:leads(${LEAD_SUMMARY_SELECT})
    `
    )
    .neq("status", "Complete")
    .lt("time", now)
    .order("time", { ascending: true })
    .limit(12);

  let dueTodayFollowUpsQuery = supabase
    .from("lead_follow_ups")
    .select(
      `
      *,
      assigned_user:users(id, name, profile_picture),
      lead:leads(${LEAD_SUMMARY_SELECT})
    `
    )
    .neq("status", "Complete")
    .gte("time", start)
    .lte("time", end)
    .order("time", { ascending: true })
    .limit(12);

  let meetingsQuery = supabase
    .from("lead_meetings")
    .select(
      `
      *,
      sales_executive:users!lead_meetings_sales_executive_id_fkey(id, name, profile_picture),
      lead:leads(${LEAD_SUMMARY_SELECT})
    `
    )
    .eq("date", start.slice(0, 10))
    .order("slot", { ascending: true })
    .limit(12);

  let supportQuery = supabase
    .from("support_requests")
    .select(
      `
      *,
      lead:leads(${LEAD_SUMMARY_SELECT}),
      requested_by_user:users!support_requests_requested_by_fkey(id, name, profile_picture),
      assigned_user:users!support_requests_assigned_to_fkey(id, name, profile_picture),
      department:departments(*)
    `
    )
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: true })
    .limit(12);

  let measurementsQuery = supabase
    .from("measurements")
    .select(
      `
      *,
      lead:leads(${LEAD_SUMMARY_SELECT}),
      measurement_user:users!measurements_measurement_by_fkey(id, name, profile_picture)
    `
    )
    .in("status", ["scheduled", "rescheduled"])
    .gte("scheduled_at", start)
    .order("scheduled_at", { ascending: true })
    .limit(12);

  const installationsQuery = applyLeadScope(
    supabase
      .from("leads")
      .select(LEAD_SUMMARY_SELECT)
      .in("status", ["Ready for Installation", "Out for Installation"])
      .order("updated_at", { ascending: false })
      .limit(12),
    scope
  );

  if (!isAdmin && userId) {
    overdueFollowUpsQuery = overdueFollowUpsQuery.eq("assigned_to", userId);
    dueTodayFollowUpsQuery = dueTodayFollowUpsQuery.eq("assigned_to", userId);
    meetingsQuery = meetingsQuery.eq("sales_executive_id", userId);
    supportQuery = supportQuery.or(`assigned_to.eq.${userId},requested_by.eq.${userId}`);
    measurementsQuery = measurementsQuery.eq("measurement_by", userId);
  }

  const [
    myTasksResult,
    unassignedResult,
    overdueFollowUpsResult,
    dueTodayFollowUpsResult,
    supportResult,
    meetingsResult,
    measurementsResult,
    installationsResult,
  ] = await Promise.all([
    myTasksQuery,
    unassignedQuery,
    overdueFollowUpsQuery,
    dueTodayFollowUpsQuery,
    supportQuery,
    meetingsQuery,
    measurementsQuery,
    installationsQuery,
  ]);

  const firstError =
    myTasksResult.error ||
    unassignedResult.error ||
    overdueFollowUpsResult.error ||
    dueTodayFollowUpsResult.error ||
    supportResult.error ||
    meetingsResult.error ||
    measurementsResult.error ||
    installationsResult.error;

  if (firstError) return { success: false, error: firstError.message };

  return {
    success: true,
    data: {
      myTasks: (myTasksResult.data || []) as unknown as WorkspaceLeadSummary[],
      unassignedRecords: (unassignedResult.data || []) as unknown as WorkspaceLeadSummary[],
      overdueFollowUps: (overdueFollowUpsResult.data || []) as WorkspaceFollowUpItem[],
      dueTodayFollowUps: (dueTodayFollowUpsResult.data || []) as WorkspaceFollowUpItem[],
      supportRequests: (supportResult.data || []) as WorkspaceSupportRequest[],
      todayMeetings: (meetingsResult.data || []) as WorkspaceMeetingItem[],
      upcomingMeasurements: (measurementsResult.data || []) as WorkspaceMeasurementItem[],
      upcomingInstallations: (installationsResult.data || []) as unknown as WorkspaceLeadSummary[],
    },
  };
}

export async function getWorkspaceMyTasks(
  scope: WorkspaceScope
): Promise<ActionResult<WorkspaceLeadSummary[]>> {
  const inbox = await getWorkspaceInbox(scope);
  if (!inbox.success) return inbox;
  return { success: true, data: inbox.data.myTasks };
}

export async function getWorkspaceFollowUps(
  scope: WorkspaceScope
): Promise<ActionResult<WorkspaceFollowUpItem[]>> {
  const inbox = await getWorkspaceInbox(scope);
  if (!inbox.success) return inbox;
  return {
    success: true,
    data: [...inbox.data.overdueFollowUps, ...inbox.data.dueTodayFollowUps],
  };
}

export async function getWorkspaceSupportRequests(
  scope: WorkspaceScope
): Promise<ActionResult<WorkspaceSupportRequest[]>> {
  const inbox = await getWorkspaceInbox(scope);
  if (!inbox.success) return inbox;
  return { success: true, data: inbox.data.supportRequests };
}
