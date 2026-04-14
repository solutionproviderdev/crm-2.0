"use server";

import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult, LeadActivityLog } from "@/lib/types";

/**
 * Fetches the most recent lead activity logs across ALL leads —
 * used for the admin dashboard activity feed.
 *
 * Scoped per role: Admins see everything, operators see only their leads.
 *
 * @param params.limit    - Number of entries to fetch (default 30)
 * @param params.userId   - The logged-in user's ID (for operator scoping)
 * @param params.isAdmin  - Whether the user is an Admin
 */
export async function getRecentActivityFeed(params: {
  limit?: number;
  userId?: string;
  isAdmin?: boolean;
}): Promise<ActionResult<LeadActivityLog[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEADS);

  const { limit = 30, userId, isAdmin = true } = params;
  const supabase = createAdminClient();

  let query = supabase
    .from("lead_activity_logs")
    .select(
      `
      *,
      actor:users!lead_activity_logs_actor_id_fkey(id, name, profile_picture),
      lead:leads!lead_activity_logs_lead_id_fkey(id, name, cid)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  // Operators only see activity on their own assigned leads
  if (!isAdmin && userId) {
    const { data: leadIds } = await supabase
      .from("leads")
      .select("id")
      .or(`cre_id.eq.${userId},sales_executive_id.eq.${userId}`);

    const ids = (leadIds ?? []).map((l: { id: string }) => l.id);
    if (ids.length === 0) return { success: true, data: [] };
    query = query.in("lead_id", ids);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as unknown as LeadActivityLog[] };
}

/**
 * Fetches aggregate lead stats for the dashboard stat cards.
 * Returns total leads plus a count breakdown by status.
 */
export async function getDashboardLeadStats(params: {
  userId?: string;
  isAdmin?: boolean;
}): Promise<
  ActionResult<{
    total: number;
    byStatus: { status: string; count: number }[];
  }>
> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEADS);
  cacheTag(CACHE_TAGS.LEAD_STATUS_COUNTS);

  const { userId, isAdmin = true } = params;
  const supabase = createAdminClient();

  let query = supabase.from("leads").select("status");

  if (!isAdmin && userId) {
    query = query.or(`cre_id.eq.${userId},sales_executive_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  return {
    success: true,
    data: {
      total: data?.length ?? 0,
      byStatus: Object.entries(counts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}
