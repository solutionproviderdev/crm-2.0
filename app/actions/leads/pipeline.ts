"use server";

import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getLifecycleStatusGroups } from "./lifecycle";
import type { ActionResult, Lead, LifecycleStageCode } from "@/lib/types";

/**
 * getPipelineLeads
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches leads for the pipeline boards (Client / Project pages).
 *
 * Key behaviors:
 * - Restricts to the provided `stages` array (status IN (...)).
 * - For non-admin users, enforces data scoping: only leads where
 *   `cre_id = userId OR sales_executive_id = userId` are returned.
 * - Returns a `Record<stage, Lead[]>` map so each stage column can render
 *   independently without a secondary groupBy pass.
 *
 * @param params.stages          - Ordered list of statuses defining the board columns.
 * @param params.status          - Optional: filter to a single status within the stage set.
 * @param params.creId           - Optional: filter by assigned CRE.
 * @param params.salesExecutiveId - Optional: filter by assigned Sales Executive.
 * @param params.startDate       - Optional: ISO date lower bound for lead creation.
 * @param params.endDate         - Optional: ISO date upper bound for lead creation.
 * @param params.userId          - Current logged-in user ID.
 * @param params.isAdmin         - If false, scopes results to leads assigned to userId.
 */
export async function getPipelineLeads(params: {
  stages: readonly string[];
  stageCode?: LifecycleStageCode;
  status?: string;
  creId?: string;
  salesExecutiveId?: string;
  startDate?: string;
  endDate?: string;
  userId: string;
  isAdmin: boolean;
}): Promise<ActionResult<Record<string, Lead[]>>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.LEADS);

  const {
    stages,
    stageCode,
    status,
    creId,
    salesExecutiveId,
    startDate,
    endDate,
    userId,
    isAdmin,
  } = params;

  const supabase = createAdminClient();
  const lifecycleResult = stageCode
    ? await getLifecycleStatusGroups()
    : undefined;
  const lifecycleStage = lifecycleResult?.success
    ? lifecycleResult.data.find((group) => group.code === stageCode)
    : undefined;
  const lifecycleStatuses = lifecycleStage?.statuses ?? [];
  const lifecycleStatusNames = lifecycleStatuses.map((item) => item.name);
  const statusIdByName = new Map(
    lifecycleStatuses.map((item) => [item.name, item.id])
  );
  const boardStages = lifecycleStatusNames.length
    ? lifecycleStatusNames
    : [...stages];

  let query = supabase
    .from("leads")
    .select(
      `
      *,
      sales_executive:users!leads_sales_executive_id_fkey(id, name, profile_picture),
      cre:users!leads_cre_id_fkey(id, name, profile_picture),
      meetings:lead_meetings(id, date, slot, status),
      payments:lead_payments(id, amount, payment_date, payment_status)
    `
    );

  // Prefer normalized lifecycle filtering. Fall back to legacy status strings if
  // lifecycle data is unavailable so older environments still render.
  if (lifecycleStatuses.length) {
    query = query.in(
      "current_status_id",
      lifecycleStatuses.map((item) => item.id)
    );
  } else {
    query = query.in("status", stages as string[]);
  }

  // ── Non-admin data scoping ────────────────────────────────────────────────
  // Operators can only see leads where they are the CRE or Sales Executive.
  // We use Supabase's `.or()` with the column filter syntax.
  if (!isAdmin) {
    query = query.or(`cre_id.eq.${userId},sales_executive_id.eq.${userId}`);
  }

  // ── Optional filters ──────────────────────────────────────────────────────
  // Single status filter (narrows within the stage set)
  if (status && status !== "all") {
    const statusId = statusIdByName.get(status);
    query = statusId
      ? query.eq("current_status_id", statusId)
      : query.eq("status", status);
  }

  if (creId && creId !== "all") {
    query = query.eq("cre_id", creId);
  }

  if (salesExecutiveId && salesExecutiveId !== "all") {
    query = query.eq("sales_executive_id", salesExecutiveId);
  }

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

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  // ── Group leads by stage ──────────────────────────────────────────────────
  // Initialize all stage buckets to ensure empty stages still appear.
  const grouped: Record<string, Lead[]> = {};
  for (const stage of boardStages) {
    grouped[stage] = [];
  }

  for (const lead of data as Lead[]) {
    const lifecycleStatus = lifecycleStatuses.find(
      (item) => item.id === lead.current_status_id
    );
    const groupKey = lifecycleStatus?.name ?? lead.status;
    if (groupKey in grouped) {
      grouped[groupKey].push(lead);
    }
  }

  return { success: true, data: grouped };
}
