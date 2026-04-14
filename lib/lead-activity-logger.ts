/**
 * Lead Activity Logger
 * ─────────────────────────────────────────────────────────────────────────────
 * A single, reusable, FIRE-AND-FORGET utility for writing audit log entries to
 * the `lead_activity_logs` table.
 *
 * KEY DESIGN PRINCIPLE:
 *   logLeadActivity() is NEVER awaited. This means:
 *   - Zero latency impact on the parent server action.
 *   - If the log write fails, the parent action still succeeds.
 *   - Log failures are silently swallowed in prod (console.error in dev).
 *
 * USAGE:
 *   // After a successful mutation, call without await:
 *   logLeadActivity({
 *     leadId: lead.id,
 *     actorId: user.id,
 *     action: "lead.status_changed",
 *     metadata: { from: "New", to: "Meeting Fixed" },
 *   });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createAdminClient } from "@/utils/supabase/admin";

// ── Typed action vocabulary ───────────────────────────────────────────────────
export type LeadActionType =
  | "lead.created"
  | "lead.status_changed"
  | "lead.assigned.cre"
  | "lead.assigned.sales"
  | "lead.assigned.bulk"
  | "lead.comment_added"
  | "lead.phone_added"
  | "lead.payment_recorded"
  | "lead.call_logged"
  | "lead.follow_up_created"
  | "lead.follow_up_updated"
  | "lead.meeting_created"
  | "lead.meeting_rescheduled"
  | "lead.meeting_status_changed"
  | "lead.meeting_completed"
  | "lead.sold"
  | "lead.project_status_changed"
  | "lead.requirements_updated";

// ── Log entry input shape ─────────────────────────────────────────────────────
export interface LeadLogInput {
  /** The lead that was acted upon */
  leadId: string;
  /** The user who performed the action (null for system actions) */
  actorId?: string | null;
  /** Typed action identifier — keep to the vocabulary above */
  action: LeadActionType;
  /** Structured context for the action. Rich but optional. */
  metadata?: Record<string, unknown>;
}

/**
 * Writes a log entry to `lead_activity_logs`.
 *
 * ⚠️  NEVER await this function. It is intentionally fire-and-forget.
 *     Awaiting it would add a DB round-trip to every mutation's critical path.
 */
export function logLeadActivity(input: LeadLogInput): void {
  const supabase = createAdminClient();

  supabase
    .from("lead_activity_logs")
    .insert({
      lead_id: input.leadId,
      actor_id: input.actorId ?? null,
      action: input.action,
      metadata: input.metadata ?? {},
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV === "development") {
        console.error(
          `[lead-activity-logger] Failed to write log for action "${input.action}" on lead "${input.leadId}":`,
          error.message
        );
      }
    });
}
