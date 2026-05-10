"use server";

import { revalidatePath } from "next/cache";
import { cacheLife, cacheTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type {
  ActionResult,
  Department,
  Lead,
  LeadLifecycleTimeline,
  LifecycleStageCode,
  LifecycleStatusGroup,
  LifecycleStatusOption,
  LifecycleTransitionRule,
  WorkspaceFollowUpItem,
  WorkspaceLeadSummary,
  WorkspaceMeasurementItem,
  WorkspaceMeetingItem,
  WorkspaceSupportRequest,
} from "@/lib/types";

const STAGE_ORDER: LifecycleStageCode[] = ["lead", "client", "project"];

interface PipelineStageRow {
  id: string;
  code: LifecycleStageCode;
  name: string;
  description: string | null;
  sort_order: number;
}

interface PipelineStatusRow extends LifecycleStatusOption {
  stage_id: string;
}

interface AssignmentOperationData {
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

interface ReassignLeadInput {
  leadId: string;
  assignedTo: string;
  departmentId?: string | null;
  reason: string;
}

interface CreateSupportRequestInput {
  leadId: string;
  subject: string;
  description?: string | null;
  priority?: WorkspaceSupportRequest["priority"];
  assignedTo?: string | null;
  departmentId?: string | null;
}

interface UpdateSupportRequestInput {
  id: string;
  status: WorkspaceSupportRequest["status"];
  assignedTo?: string | null;
  departmentId?: string | null;
}

interface CalendarOperationsData {
  meetings: WorkspaceMeetingItem[];
  followUps: WorkspaceFollowUpItem[];
  measurements: WorkspaceMeasurementItem[];
  installations: WorkspaceLeadSummary[];
}

interface LifecycleReportsData {
  stageCounts: { stage: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  sourceCounts: { source: string; count: number }[];
  lostCount: number;
  handedOverCount: number;
  unassignedCount: number;
  staleAssignmentCount: number;
  recentStatusChanges: LeadLifecycleTimeline["statusHistory"];
  conversionFunnel: {
    totalLeads: number;
    convertedToClient: number;
    convertedToProject: number;
    clientConversionRate: number;
    projectConversionRate: number;
  };
  lostReasons: { reason: string; count: number }[];
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

async function getActorClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function getLifecycleStatusGroups(): Promise<
  ActionResult<LifecycleStatusGroup[]>
> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.LEADS);

  const supabase = createAdminClient();

  const [stagesResult, statusesResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, code, name, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("pipeline_statuses")
      .select(
        "id, stage_id, code, name, description, sort_order, default_department_id, is_terminal, is_conversion_point"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (stagesResult.error) {
    return { success: false, error: stagesResult.error.message };
  }
  if (statusesResult.error) {
    return { success: false, error: statusesResult.error.message };
  }

  const statuses = (statusesResult.data || []) as PipelineStatusRow[];
  const groups = ((stagesResult.data || []) as PipelineStageRow[])
    .filter((stage) => STAGE_ORDER.includes(stage.code))
    .map((stage) => ({
      ...stage,
      statuses: statuses
        .filter((status) => status.stage_id === stage.id)
        .map((status) => ({
          id: status.id,
          code: status.code,
          name: status.name,
          description: status.description,
          sort_order: status.sort_order,
          default_department_id: status.default_department_id,
          is_terminal: status.is_terminal,
          is_conversion_point: status.is_conversion_point,
        })),
    }));

  return { success: true, data: groups };
}

export async function getLifecycleTransitionRules(): Promise<
  ActionResult<LifecycleTransitionRule[]>
> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.LEADS);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("status_transitions")
    .select(
      "id, from_status_id, to_status_id, allowed_department_id, allowed_role_id, requires_note, requires_assignment, requires_follow_up"
    )
    .eq("is_active", true);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: (data || []) as LifecycleTransitionRule[],
  };
}

export async function getDepartments(): Promise<ActionResult<Department[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.DEPARTMENTS);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data || []) as Department[] };
}

export async function getLifecycleStatusNames(
  stageCode?: LifecycleStageCode
): Promise<ActionResult<string[]>> {
  const groupsResult = await getLifecycleStatusGroups();
  if (!groupsResult.success) return groupsResult;

  const groups = stageCode
    ? groupsResult.data.filter((group) => group.code === stageCode)
    : groupsResult.data;

  return {
    success: true,
    data: groups.flatMap((group) => group.statuses.map((status) => status.name)),
  };
}

export async function getLeadLifecycleTimeline(
  leadId: string
): Promise<ActionResult<LeadLifecycleTimeline>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEAD_DETAILS(leadId));

  const supabase = createAdminClient();

  const [statusHistoryResult, assignmentsResult] = await Promise.all([
    supabase
      .from("lead_status_history")
      .select(
        `
        *,
        from_stage:pipeline_stages!lead_status_history_from_stage_id_fkey(id, code, name),
        to_stage:pipeline_stages!lead_status_history_to_stage_id_fkey(id, code, name),
        from_status:pipeline_statuses!lead_status_history_from_status_id_fkey(id, code, name),
        to_status:pipeline_statuses!lead_status_history_to_status_id_fkey(id, code, name),
        changed_by_user:users!lead_status_history_changed_by_fkey(id, name, profile_picture)
      `
      )
      .eq("lead_id", leadId)
      .order("changed_at", { ascending: false })
      .limit(100),
    supabase
      .from("lead_assignments")
      .select(
        `
        *,
        stage:pipeline_stages(id, code, name),
        status:pipeline_statuses(id, code, name),
        department:departments(*),
        assigned_user:users!lead_assignments_assigned_to_fkey(id, name, profile_picture),
        assigned_by_user:users!lead_assignments_assigned_by_fkey(id, name, profile_picture)
      `
      )
      .eq("lead_id", leadId)
      .order("assigned_at", { ascending: false })
      .limit(100),
  ]);

  if (statusHistoryResult.error) {
    return { success: false, error: statusHistoryResult.error.message };
  }
  if (assignmentsResult.error) {
    return { success: false, error: assignmentsResult.error.message };
  }

  return {
    success: true,
    data: {
      statusHistory: statusHistoryResult.data || [],
      assignments: assignmentsResult.data || [],
    } as LeadLifecycleTimeline,
  };
}

export async function reassignLeadOwner(
  input: ReassignLeadInput
): Promise<ActionResult<boolean>> {
  if (!input.leadId || !input.assignedTo) {
    return { success: false, error: "Lead and owner are required" };
  }
  if (!input.reason.trim()) {
    return { success: false, error: "Reassignment reason is required" };
  }

  // actorClient enforces RLS — the lead_assignments and leads writes will be
  // checked against the "lead.assign" / "client.assign" / "project.assign"
  // permission policies defined on those tables.
  const actorClient = await getActorClient();
  const { data: { user } } = await actorClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const actorId = user.id;

  // Reads use the admin client so we can fetch any lead/user regardless of
  // the actor's own assignment scope (managers may reassign records they don't own).
  const supabase = createAdminClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, current_stage_id, current_status_id, current_owner_id, current_department_id")
    .eq("id", input.leadId)
    .single();

  if (leadError) return { success: false, error: leadError.message };

  const { data: targetUser, error: userError } = await supabase
    .from("users")
    .select("id, department_id")
    .eq("id", input.assignedTo)
    .single();

  if (userError) return { success: false, error: userError.message };

  const departmentId = input.departmentId ?? targetUser.department_id ?? null;
  const now = new Date().toISOString();

  // All writes go through the user-scoped client so RLS is enforced.
  const { error: closeError } = await actorClient
    .from("lead_assignments")
    .update({
      is_current: false,
      unassigned_at: now,
    })
    .eq("lead_id", input.leadId)
    .eq("is_current", true);

  if (closeError) return { success: false, error: closeError.message };

  const { error: insertError } = await actorClient.from("lead_assignments").insert({
    lead_id: input.leadId,
    stage_id: lead.current_stage_id,
    status_id: lead.current_status_id,
    department_id: departmentId,
    assigned_to: input.assignedTo,
    assigned_by: actorId,
    assigned_at: now,
    is_current: true,
    reason: input.reason.trim(),
    metadata: {
      source: "manual_reassign",
      previous_owner_id: lead.current_owner_id,
      previous_department_id: lead.current_department_id,
    },
  });

  if (insertError) return { success: false, error: insertError.message };

  const { error: updateError } = await actorClient
    .from("leads")
    .update({
      current_owner_id: input.assignedTo,
      current_department_id: departmentId,
      updated_at: now,
    })
    .eq("id", input.leadId);

  if (updateError) return { success: false, error: updateError.message };

  updateTag(CACHE_TAGS.LEADS);
  updateTag(CACHE_TAGS.WORKSPACE);
  updateTag(CACHE_TAGS.LEAD_DETAILS(input.leadId));
  revalidatePath("/workspace");
  revalidatePath("/workspace/assignments");
  revalidatePath(`/leads/${input.leadId}`);

  return { success: true, data: true };
}

export async function getAssignmentOperations(): Promise<
  ActionResult<AssignmentOperationData>
> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.WORKSPACE, CACHE_TAGS.LEADS);

  const supabase = createAdminClient();
  const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsResult, unassignedResult, staleAssignmentResult] = await Promise.all([
    supabase
      .from("leads")
      .select("id, priority, current_department_id, current_owner_id, department:departments!leads_current_department_id_fkey(id, name)")
      .not("current_status_id", "is", null),
    supabase
      .from("leads")
      .select(LEAD_SUMMARY_SELECT)
      .is("current_owner_id", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("lead_assignments")
      .select(`lead:leads(${LEAD_SUMMARY_SELECT})`)
      .eq("is_current", true)
      .lt("assigned_at", staleCutoff)
      .order("assigned_at", { ascending: true })
      .limit(50),
  ]);

  const firstError =
    leadsResult.error || unassignedResult.error || staleAssignmentResult.error;
  if (firstError) return { success: false, error: firstError.message };

  const workloadMap = new Map<string, AssignmentOperationData["departmentWorkload"][number]>();

  for (const row of (leadsResult.data || []) as unknown as Array<{
    priority: Lead["priority"];
    current_department_id: string | null;
    current_owner_id: string | null;
    department?: { id: string; name: string } | { id: string; name: string }[] | null;
  }>) {
    const department = Array.isArray(row.department) ? row.department[0] : row.department;
    const key = row.current_department_id || "unassigned";
    const existing =
      workloadMap.get(key) ||
      {
        departmentId: row.current_department_id,
        departmentName: department?.name || "No Department",
        total: 0,
        urgent: 0,
        high: 0,
        unassigned: 0,
      };

    existing.total += 1;
    if (row.priority === "urgent") existing.urgent += 1;
    if (row.priority === "high") existing.high += 1;
    if (!row.current_owner_id) existing.unassigned += 1;
    workloadMap.set(key, existing);
  }

  const staleAssignments = ((staleAssignmentResult.data || []) as unknown as Array<{
    lead: WorkspaceLeadSummary | WorkspaceLeadSummary[] | null;
  }>)
    .map((item) => (Array.isArray(item.lead) ? item.lead[0] : item.lead))
    .filter(Boolean) as WorkspaceLeadSummary[];

  return {
    success: true,
    data: {
      departmentWorkload: Array.from(workloadMap.values()).sort(
        (a, b) => b.total - a.total
      ),
      unassignedRecords: (unassignedResult.data || []) as unknown as WorkspaceLeadSummary[],
      staleAssignments,
    },
  };
}

export async function createSupportRequest(
  input: CreateSupportRequestInput
): Promise<ActionResult<boolean>> {
  if (!input.leadId || !input.subject.trim()) {
    return { success: false, error: "Lead and support subject are required" };
  }

  const actorClient = await getActorClient();
  const { data: { user } } = await actorClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const actorId = user.id;

  // Read lead context via admin (actor may not own the lead yet)
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data: lead, error: leadError } = await adminClient
    .from("leads")
    .select("current_department_id, current_owner_id")
    .eq("id", input.leadId)
    .single();

  if (leadError) return { success: false, error: leadError.message };

  // Write via user-scoped client — RLS enforces support_request.create permission
  const { error } = await actorClient.from("support_requests").insert({
    lead_id: input.leadId,
    requested_by: actorId,
    assigned_to: input.assignedTo || lead.current_owner_id || null,
    department_id: input.departmentId || lead.current_department_id || null,
    priority: input.priority || "normal",
    subject: input.subject.trim(),
    description: input.description?.trim() || null,
    status: "open",
    created_at: now,
    updated_at: now,
  });

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.WORKSPACE);
  updateTag(CACHE_TAGS.LEAD_DETAILS(input.leadId));
  revalidatePath("/workspace/support-requests");
  revalidatePath(`/leads/${input.leadId}`);

  return { success: true, data: true };
}

export async function updateSupportRequest(
  input: UpdateSupportRequestInput
): Promise<ActionResult<boolean>> {
  // Write via user-scoped client — RLS checks requested_by / assigned_to / support_request.create
  const actorClient = await getActorClient();
  const resolvedAt =
    input.status === "resolved" || input.status === "cancelled"
      ? new Date().toISOString()
      : null;

  const { error } = await actorClient
    .from("support_requests")
    .update({
      status: input.status,
      assigned_to: input.assignedTo,
      department_id: input.departmentId,
      resolved_at: resolvedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.WORKSPACE);
  revalidatePath("/workspace/support-requests");
  return { success: true, data: true };
}

export async function getSupportOperations(): Promise<
  ActionResult<WorkspaceSupportRequest[]>
> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.WORKSPACE);

  const supabase = createAdminClient();
  const { data, error } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data || []) as WorkspaceSupportRequest[] };
}

export async function getCalendarOperations(): Promise<
  ActionResult<CalendarOperationsData>
> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.WORKSPACE, CACHE_TAGS.MEETINGS, CACHE_TAGS.FOLLOW_UPS);

  const supabase = createAdminClient();
  const today = new Date();
  const fromDate = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const toDate = to.toISOString().slice(0, 10);

  // Resolve installation status IDs from the DB so we never hardcode status
  // strings against the legacy leads.status column.
  const { data: installStatusRows } = await supabase
    .from("pipeline_statuses")
    .select("id")
    .in("code", ["ready_for_installation", "out_for_installation"]);
  const installStatusIds = (installStatusRows ?? []).map((s) => s.id);

  const [meetings, followUps, measurements, installations] = await Promise.all([
    supabase
      .from("lead_meetings")
      .select(`*, sales_executive:users!lead_meetings_sales_executive_id_fkey(id, name, profile_picture), lead:leads(${LEAD_SUMMARY_SELECT})`)
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: true })
      .order("slot", { ascending: true })
      .limit(100),
    supabase
      .from("lead_follow_ups")
      .select(`*, assigned_user:users(id, name, profile_picture), lead:leads(${LEAD_SUMMARY_SELECT})`)
      .neq("status", "Complete")
      .gte("time", today.toISOString())
      .order("time", { ascending: true })
      .limit(100),
    supabase
      .from("measurements")
      .select(`*, lead:leads(${LEAD_SUMMARY_SELECT}), measurement_user:users!measurements_measurement_by_fkey(id, name, profile_picture)`)
      .in("status", ["scheduled", "rescheduled"])
      .gte("scheduled_at", today.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(100),
    // Query leads by current_status_id (DB-driven) instead of the legacy
    // leads.status text column which may be stale or differently cased.
    installStatusIds.length > 0
      ? supabase
          .from("leads")
          .select(LEAD_SUMMARY_SELECT)
          .in("current_status_id", installStatusIds)
          .order("updated_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as unknown[], error: null }),
  ]);

  const firstError = meetings.error || followUps.error || measurements.error ||
    (installations as { error: unknown }).error;
  if (firstError) return { success: false, error: (firstError as { message: string }).message };

  return {
    success: true,
    data: {
      meetings: (meetings.data || []) as WorkspaceMeetingItem[],
      followUps: (followUps.data || []) as WorkspaceFollowUpItem[],
      measurements: (measurements.data || []) as WorkspaceMeasurementItem[],
      installations: (installations.data || []) as unknown as WorkspaceLeadSummary[],
    },
  };
}

export async function getLifecycleReports(): Promise<ActionResult<LifecycleReportsData>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEADS, CACHE_TAGS.WORKSPACE);

  const supabase = createAdminClient();
  const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsResult, groupsResult, historyResult, assignmentResult] = await Promise.all([
    supabase.from("leads").select("id, source, status, current_status_id, current_owner_id, lost_reason, converted_to_client_at, converted_to_project_at"),
    getLifecycleStatusGroups(),
    supabase
      .from("lead_status_history")
      .select(`*, to_status:pipeline_statuses!lead_status_history_to_status_id_fkey(id, code, name), to_stage:pipeline_stages!lead_status_history_to_stage_id_fkey(id, code, name), changed_by_user:users!lead_status_history_changed_by_fkey(id, name, profile_picture)`)
      .order("changed_at", { ascending: false })
      .limit(25),
    supabase
      .from("lead_assignments")
      .select("id")
      .eq("is_current", true)
      .lt("assigned_at", staleCutoff),
  ]);

  if (leadsResult.error) return { success: false, error: leadsResult.error.message };
  if (!groupsResult.success) return groupsResult;
  if (historyResult.error) return { success: false, error: historyResult.error.message };
  if (assignmentResult.error) return { success: false, error: assignmentResult.error.message };

  const statusLookup = new Map(
    groupsResult.data.flatMap((group) =>
      group.statuses.map((status) => [status.id, { status, group }] as const)
    )
  );
  const stageCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  let lostCount = 0;
  let handedOverCount = 0;
  let unassignedCount = 0;

  let convertedToClientCount = 0;
  let convertedToProjectCount = 0;
  const lostReasonCounts = new Map<string, number>();

  for (const lead of (leadsResult.data || []) as Array<{
    source: string | null;
    status: string;
    current_status_id: string | null;
    current_owner_id: string | null;
    lost_reason: string | null;
    converted_to_client_at: string | null;
    converted_to_project_at: string | null;
  }>) {
    const lifecycle = lead.current_status_id ? statusLookup.get(lead.current_status_id) : null;
    const stageName = lifecycle?.group.name || "Legacy";
    const statusName = lifecycle?.status.name || lead.status || "Unknown";
    stageCounts.set(stageName, (stageCounts.get(stageName) || 0) + 1);
    statusCounts.set(statusName, (statusCounts.get(statusName) || 0) + 1);
    sourceCounts.set(lead.source || "Unknown", (sourceCounts.get(lead.source || "Unknown") || 0) + 1);
    if (statusName === "Lost") lostCount += 1;
    if (statusName === "Handed Over") handedOverCount += 1;
    if (!lead.current_owner_id) unassignedCount += 1;
    if (lead.converted_to_client_at) convertedToClientCount += 1;
    if (lead.converted_to_project_at) convertedToProjectCount += 1;
    if (lead.lost_reason) {
      const reason = lead.lost_reason.trim() || "Unspecified";
      lostReasonCounts.set(reason, (lostReasonCounts.get(reason) || 0) + 1);
    } else if (statusName === "Lost") {
      lostReasonCounts.set("Unspecified", (lostReasonCounts.get("Unspecified") || 0) + 1);
    }
  }

  const totalLeads = (leadsResult.data || []).length;

  const toSorted = (map: Map<string, number>, keyName: "stage" | "status" | "source") =>
    Array.from(map.entries())
      .map(([key, count]) => ({ [keyName]: key, count }))
      .sort((a, b) => b.count - a.count) as Array<Record<typeof keyName, string> & { count: number }>;

  const clientConversionRate =
    totalLeads > 0 ? Math.round((convertedToClientCount / totalLeads) * 100) : 0;
  const projectConversionRate =
    totalLeads > 0 ? Math.round((convertedToProjectCount / totalLeads) * 100) : 0;

  return {
    success: true,
    data: {
      stageCounts: toSorted(stageCounts, "stage") as { stage: string; count: number }[],
      statusCounts: toSorted(statusCounts, "status") as { status: string; count: number }[],
      sourceCounts: toSorted(sourceCounts, "source") as { source: string; count: number }[],
      lostCount,
      handedOverCount,
      unassignedCount,
      staleAssignmentCount: assignmentResult.data?.length || 0,
      recentStatusChanges: (historyResult.data || []) as LeadLifecycleTimeline["statusHistory"],
      conversionFunnel: {
        totalLeads,
        convertedToClient: convertedToClientCount,
        convertedToProject: convertedToProjectCount,
        clientConversionRate,
        projectConversionRate,
      },
      lostReasons: Array.from(lostReasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

export async function updatePipelineStatus(input: {
  id: string;
  name: string;
  defaultDepartmentId?: string | null;
  isTerminal?: boolean;
  isConversionPoint?: boolean;
}): Promise<ActionResult<boolean>> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pipeline_statuses")
    .update({
      name: input.name.trim(),
      default_department_id: input.defaultDepartmentId || null,
      is_terminal: input.isTerminal,
      is_conversion_point: input.isConversionPoint,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  updateTag(CACHE_TAGS.LEADS);
  revalidatePath("/settings/pipeline");
  revalidatePath("/pipeline");
  return { success: true, data: true };
}

export async function updateStatusTransition(input: {
  id: string;
  requiresNote: boolean;
  requiresAssignment: boolean;
  requiresFollowUp: boolean;
  isActive: boolean;
}): Promise<ActionResult<boolean>> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("status_transitions")
    .update({
      requires_note: input.requiresNote,
      requires_assignment: input.requiresAssignment,
      requires_follow_up: input.requiresFollowUp,
      is_active: input.isActive,
    })
    .eq("id", input.id);

  if (error) return { success: false, error: error.message };
  updateTag(CACHE_TAGS.LEADS);
  revalidatePath("/settings/status-transitions");
  revalidatePath("/pipeline");
  return { success: true, data: true };
}
