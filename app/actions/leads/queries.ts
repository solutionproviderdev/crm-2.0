"use server";

import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getLifecycleStatusNames } from "./lifecycle";
import type {
  ActionResult,
  Lead,
  LeadActivityLog,
  LeadMeeting,
  MeetingSlot,
  User,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: All read functions in this file use the admin client so they can be
// wrapped in `'use cache'`, which requires a stateless (cookie-free) client.
// Authorization is enforced at the RLS level on the DB for user-scoped clients,
// and at the Next.js middleware/layout level for page access.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated, filtered, and sorted list of leads.
 * Cached per unique parameter combination. Cache is busted by `updateTag(CACHE_TAGS.LEADS)`.
 *
 * @param params - Filtering, pagination, sorting options
 * @returns Paginated leads, total count, and available filter values
 */
export async function getFilteredLeads(params: {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  creId?: string;
  salesExecutiveId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  userId?: string;
  isAdmin?: boolean;
}): Promise<
  ActionResult<{
    leads: Lead[];
    total: number;
    totalPages: number;
  }>
> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEADS);

  const {
    page = 1,
    limit = 20,
    status,
    source,
    startDate,
    endDate,
    creId,
    salesExecutiveId,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
    userId,
    isAdmin = true, // Default to true to not break existing calls if any
  } = params;

  const supabase = createAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sortColumn =
    sortBy === "name"
      ? "name"
      : sortBy === "status"
        ? "status"
        : sortBy === "cid"
          ? "cid"
          : "created_at";

  let query = supabase
    .from("leads")
    .select(
      `
      *,
      sales_executive:users!leads_sales_executive_id_fkey(id, name, profile_picture),
      cre:users!leads_cre_id_fkey(id, name, profile_picture),
      comments:lead_comments(id, comment, created_at),
      meetings:lead_meetings(*),
      payments:lead_payments(id, amount, payment_date)
    `,
      { count: "exact" }
    );

  // ── Non-admin data scoping ────────────────────────────────────────────────
  if (!isAdmin && userId) {
    query = query.or(`cre_id.eq.${userId},sales_executive_id.eq.${userId}`);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,cid.ilike.%${search}%,address->>address.ilike.%${search}%,address->>area.ilike.%${search}%,address->>district.ilike.%${search}%,address->>division.ilike.%${search}%`
    );
  } else {
    if (status) query = query.eq("status", status);
    if (source) query = query.eq("source", source);
    if (creId) query = query.eq("cre_id", creId);
    if (salesExecutiveId)
      query = query.eq("sales_executive_id", salesExecutiveId);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte("created_at", start.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
  }

  const { data, error, count } = await query
    .order(sortColumn, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      leads: data as Lead[],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Fetches the distinct lead statuses and sources for filter dropdowns.
 * Cached independently from the leads list to prevent full table scans on
 * every leads page request.
 *
 * @returns Unique statuses and sources available in the leads table
 */
export async function getLeadFilterOptions(): Promise<
  ActionResult<{ statuses: string[]; sources: string[] }>
> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.LEADS);

  const supabase = createAdminClient();

  const [{ data, error }, lifecycleStatusesResult] = await Promise.all([
    supabase.from("leads").select("source"),
    getLifecycleStatusNames(),
  ]);

  if (error) return { success: false, error: error.message };

  const statuses = lifecycleStatusesResult.success
    ? lifecycleStatusesResult.data
    : [];
  const sources = Array.from(new Set(data?.map((l) => l.source) || [])).filter(Boolean);

  return { success: true, data: { statuses, sources } };
}

/**
 * Fetches per-status lead counts for the analytics chart.
 * This is separate from getFilteredLeads so chart data always reflects global
 * totals, not just the current page.
 *
 * @returns Array of { status, count } objects
 */
export async function getLeadStatusCounts(params?: {
  userId?: string;
  isAdmin?: boolean;
}): Promise<
  ActionResult<{ status: string; count: number }[]>
> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEAD_STATUS_COUNTS);

  const isAdmin = params?.isAdmin ?? true;
  const userId = params?.userId;

  const supabase = createAdminClient();

  let query = supabase.from("leads").select("status");

  if (!isAdmin && userId) {
    query = query.or(`cre_id.eq.${userId},sales_executive_id.eq.${userId}`);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };

  const counts = (data || []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  return {
    success: true,
    data: Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Fetches full details for a single lead including all related data
 * (comments, follow-ups, meetings, payments, call logs) via parallel queries.
 *
 * Uses computed finance totals from the `lead_finance_computed` view instead
 * of the potentially-stale JSONB `finance` fields.
 *
 * @param id - The lead UUID
 */
export async function getLeadDetails(
  id: string,
  params?: { userId?: string; isAdmin?: boolean }
): Promise<ActionResult<Lead>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEAD_DETAILS(id));

  const supabase = createAdminClient();

  let query = supabase
    .from("leads")
    .select(
      `
      *,
      sales_executive:users!leads_sales_executive_id_fkey(id, name, profile_picture),
      cre:users!leads_cre_id_fkey(id, name, profile_picture)
    `
    )
    .eq("id", id);

  // ── Non-admin data scoping ────────────────────────────────────────────────
  if (params?.isAdmin === false && params?.userId) {
    query = query.or(`cre_id.eq.${params.userId},sales_executive_id.eq.${params.userId}`);
  }

  const { data: lead, error: leadErr } = await query.single();

  if (leadErr) return { success: false, error: leadErr.message };

  const [
    { data: comments },
    { data: followups },
    { data: meetings },
    { data: payments },
    { data: callLogs },
    { data: computedFinance },
  ] = await Promise.all([
    supabase
      .from("lead_comments")
      .select("*, user:users(id, name, profile_picture)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_follow_ups")
      .select("*")
      .eq("lead_id", id)
      .order("time", { ascending: true }),
    supabase
      .from("lead_meetings")
      .select("*, sales_executive:users(id, name, profile_picture)")
      .eq("lead_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("lead_payments")
      .select("*, user:users(id, name, profile_picture)")
      .eq("lead_id", id)
      .order("payment_date", { ascending: false }),
    supabase
      .from("lead_call_logs")
      .select("*, user:users(id, name, profile_picture)")
      .eq("lead_id", id)
      .order("timestamp", { ascending: false }),
    // Computed finance totals from the DB view (replaces stale JSONB fields)
    supabase
      .from("lead_finance_computed")
      .select("*")
      .eq("lead_id", id)
      .single(),
  ]);

  // Merge computed totals back into the finance JSONB shape
  const enrichedFinance = {
    ...(lead.finance || {}),
    totalPayment: computedFinance?.total_payment ?? 0,
    totalDue: computedFinance?.total_due ?? 0,
  };

  return {
    success: true,
    data: {
      ...lead,
      finance: enrichedFinance,
      comments: comments || [],
      follow_ups: followups || [],
      meetings: meetings || [],
      payments: payments || [],
      call_logs: callLogs || [],
    } as Lead,
  };
}

/**
 * Fetches all active meeting time slots, ordered for display.
 * Long-cached (days) as slots change rarely — only when admin edits them.
 */
export async function getMeetingSlots(): Promise<ActionResult<MeetingSlot[]>> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.MEETING_SLOTS);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("meeting_slots")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as MeetingSlot[] };
}

/**
 * Fetches all active system users (for team-assignment dropdowns and filters).
 * Cached for hours since user roster changes infrequently.
 */
export async function getAllActiveUsers(): Promise<ActionResult<User[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.USERS);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("*, department:departments(*), role:roles(*)")
    .eq("account_status", "active")
    .neq("id", process.env.NEXT_PUBLIC_SENTINEL_USER_ID ?? "00000000-0000-0000-0000-000000000000")
    .order("name", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as User[] };
}

/**
 * @deprecated Use `getAllActiveUsers()` and filter by department in the component.
 * Kept for backward compatibility. Will be removed in a future cleanup.
 */
export async function getSalesTeamMembers(): Promise<ActionResult<User[]>> {
  return getAllActiveUsers();
}

/**
 * @deprecated Use `getAllActiveUsers()` and filter by department in the component.
 * Kept for backward compatibility. Will be removed in a future cleanup.
 */
export async function getCRETeamMembers(): Promise<ActionResult<User[]>> {
  return getAllActiveUsers();
}

/**
 * Fetches all meetings for a specific date, with full lead and sales executive details.
 * Cached per date — invalidated by `updateTag(CACHE_TAGS.MEETING_DATE(date))`.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 */
export async function getMeetingsByDate(
  date: string
): Promise<ActionResult<LeadMeeting[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.MEETINGS, CACHE_TAGS.MEETING_DATE(date));

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lead_meetings")
    .select(
      `
      *,
      sales_executive:users!lead_meetings_sales_executive_id_fkey(id, name, nickname, profile_picture),
      lead:leads(id, name, cid, phones, cre_id, requirements,
        cre:users!leads_cre_id_fkey(id, name, nickname, profile_picture)
      )
    `
    )
    .eq("date", date);

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as LeadMeeting[] || [] };
}

/**
 * Fetches meetings within a date range with optional filters.
 * Used by the meeting history / reports view.
 *
 * @param params - Date range plus optional status/user filters
 */
export async function getMeetingsByDateRange(params: {
  startDate: string;
  endDate: string;
  status?: string;
  salesExecutiveId?: string;
  creId?: string;
}): Promise<ActionResult<LeadMeeting[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.MEETINGS);

  const supabase = createAdminClient();

  let query = supabase
    .from("lead_meetings")
    .select(
      `
      *,
      sales_executive:users!lead_meetings_sales_executive_id_fkey(id, name, nickname, profile_picture),
      lead:leads(id, name, cid, phones, cre_id, requirements,
        cre:users!leads_cre_id_fkey(id, name, nickname, profile_picture)
      )
    `
    )
    .gte("date", params.startDate)
    .lte("date", params.endDate)
    .order("date", { ascending: true })
    .order("slot", { ascending: true });

  if (params.status) query = query.eq("status", params.status);
  if (params.salesExecutiveId)
    query = query.eq("sales_executive_id", params.salesExecutiveId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as LeadMeeting[] };
}

/**
 * Fetches the full activity log for a single lead, ordered newest-first.
 * Used to render the audit trail / timeline on the Lead Details page.
 *
 * Each log entry includes the `actor` (user who performed the action)
 * with their name and avatar for display purposes.
 *
 * @param leadId - The lead UUID to fetch activity for
 */
export async function getLeadActivityLogs(
  leadId: string
): Promise<ActionResult<LeadActivityLog[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEAD_ACTIVITY(leadId));

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lead_activity_logs")
    .select(
      `
      *,
      actor:users!lead_activity_logs_actor_id_fkey(id, name, profile_picture)
    `
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(100); // cap at 100 per load; implement pagination later if needed

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as LeadActivityLog[] };
}
