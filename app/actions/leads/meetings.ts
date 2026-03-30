"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { addLeadComment } from "./mutations";
import type { ActionResult, Lead, LeadMeeting } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// All meeting mutation actions. Reads (queries) are in queries.ts.
// ─────────────────────────────────────────────────────────────────────────────

async function getUserClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Creates a meeting entry and syncs the lead's assigned sales executive.
 * Invalidates both the lead cache and the meetings calendar cache.
 *
 * @param input - Meeting data. `lead_id` and `sales_executive_id` are recommended.
 */
export async function createMeeting(
  input: Partial<LeadMeeting>
): Promise<ActionResult<LeadMeeting>> {
  const supabase = await getUserClient();

  const { data, error } = await supabase
    .from("lead_meetings")
    .insert([input])
    .select("*, sales_executive:users(id, name, profile_picture)")
    .single();

  if (error) return { success: false, error: error.message };

  // Keep the lead's assigned salesperson in sync with the meeting
  if (data?.lead_id) {
    await supabase
      .from("leads")
      .update({ sales_executive_id: data.sales_executive_id })
      .eq("id", data.lead_id);

    updateTag(CACHE_TAGS.LEAD_DETAILS(data.lead_id));
    updateTag(CACHE_TAGS.LEADS);
    revalidatePath(`/leads/${data.lead_id}`);
    revalidatePath("/leads");
  }

  updateTag(CACHE_TAGS.MEETINGS);
  if (data?.date) updateTag(CACHE_TAGS.MEETING_DATE(data.date));
  revalidatePath("/meetings/slots");

  return { success: true, data: data as LeadMeeting };
}

/**
 * Reassigns a meeting's time slot or sales executive.
 * Side-effect: also updates the lead's `sales_executive_id` to match.
 *
 * @param meetingId - Meeting UUID
 * @param salesExecutiveId - Sales executive user UUID
 * @param slot - Meeting slot text (e.g. "10:00 AM")
 */
export async function updateMeetingSchedule(
  meetingId: string,
  salesExecutiveId: string,
  slot: string
): Promise<ActionResult<LeadMeeting>> {
  const supabase = await getUserClient();

  const { data, error } = await supabase
    .from("lead_meetings")
    .update({ sales_executive_id: salesExecutiveId, slot })
    .eq("id", meetingId)
    .select("*, sales_executive:users(id, name, nickname, profile_picture)")
    .single();

  if (error) return { success: false, error: error.message };

  if (data?.lead_id) {
    await supabase
      .from("leads")
      .update({ sales_executive_id: salesExecutiveId })
      .eq("id", data.lead_id);

    updateTag(CACHE_TAGS.LEAD_DETAILS(data.lead_id));
    updateTag(CACHE_TAGS.LEADS);
    revalidatePath(`/leads/${data.lead_id}`);
    revalidatePath("/leads");
  }

  updateTag(CACHE_TAGS.MEETINGS);
  if (data?.date) updateTag(CACHE_TAGS.MEETING_DATE(data.date));
  revalidatePath("/meetings/slots");

  return { success: true, data: data as LeadMeeting };
}

/**
 * Updates a meeting's status (e.g., Rescheduled, Canceled, No Show).
 * Optionally accepts a new date/slot/salesperson for reschedule scenarios.
 *
 * @param meetingId - Meeting UUID
 * @param status - New meeting status
 * @param payload - Optional fields to update alongside status
 */
export async function updateMeetingStatus(
  meetingId: string,
  status: string,
  payload?: {
    date?: string;
    slot?: string;
    reason?: string;
    salesExecutiveId?: string;
  }
): Promise<ActionResult<LeadMeeting>> {
  const supabase = await getUserClient();

  const updateData: Record<string, unknown> = { status };
  if (payload?.date) updateData.date = payload.date;
  if (payload?.slot) updateData.slot = payload.slot;
  if (payload?.salesExecutiveId)
    updateData.sales_executive_id = payload.salesExecutiveId;

  const { data, error } = await supabase
    .from("lead_meetings")
    .update(updateData)
    .eq("id", meetingId)
    .select(
      "*, sales_executive:users(id, name, nickname, profile_picture), lead:leads(id, name, cid)"
    )
    .single();

  if (error) return { success: false, error: error.message };

  if (data?.lead_id) revalidatePath(`/leads/${data.lead_id}`);
  updateTag(CACHE_TAGS.MEETINGS);
  revalidatePath("/meetings/slots");

  return { success: true, data: data as LeadMeeting };
}

/**
 * Deletes a meeting permanently.
 *
 * @param meetingId - Meeting UUID to delete
 */
export async function deleteMeeting(
  meetingId: string
): Promise<ActionResult<boolean>> {
  const supabase = await getUserClient();

  const { error } = await supabase
    .from("lead_meetings")
    .delete()
    .eq("id", meetingId);

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.MEETINGS);
  revalidatePath("/meetings/slots");

  return { success: true, data: true };
}

/**
 * Atomic operation: Books a new lead and schedules their first meeting in a
 * single coordinated flow. Also optionally logs an initial comment.
 *
 * Failure at any step returns an error — the lead will be partially created
 * if the meeting insert fails. For full atomicity, prefer the `book_new_meeting`
 * DB function if it becomes available.
 *
 * @param params.leadData - Core lead fields (name, phones, source, etc.)
 * @param params.meetingData - Meeting fields (date, slot, sales_executive_id)
 * @param params.initialComment - Optional intake note to log as first comment
 */
export async function bookNewMeeting(params: {
  leadData: Partial<Lead>;
  meetingData: Partial<LeadMeeting>;
  initialComment?: string;
}): Promise<ActionResult<{ lead: Lead; meeting: LeadMeeting }>> {
  const supabase = await getUserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Step 1: Create the Lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert([{ ...params.leadData, status: "New" }])
    .select()
    .single();

  if (leadError)
    return {
      success: false,
      error: `Lead creation failed: ${leadError.message}`,
    };

  // Step 2: Create the Meeting
  const { data: meeting, error: meetingError } = await supabase
    .from("lead_meetings")
    .insert([{ ...params.meetingData, lead_id: lead.id, status: "Fixed" }])
    .select("*, sales_executive:users(id, name, nickname, profile_picture)")
    .single();

  if (meetingError) {
    return {
      success: false,
      error: `Meeting scheduling failed: ${meetingError.message}`,
    };
  }

  // Step 3: Log initial comment if provided
  if (params.initialComment) {
    await supabase.from("lead_comments").insert([
      {
        lead_id: lead.id,
        comment_by: user.id,
        comment: params.initialComment,
      },
    ]);
  }

  updateTag(CACHE_TAGS.LEADS);
  updateTag(CACHE_TAGS.MEETINGS);
  updateTag(CACHE_TAGS.LEAD_STATUS_COUNTS);
  if (params.meetingData.date)
    updateTag(CACHE_TAGS.MEETING_DATE(params.meetingData.date));
  updateTag(CACHE_TAGS.LEAD_DETAILS(lead.id));
  revalidatePath("/leads");
  revalidatePath("/meetings/slots");
  revalidatePath(`/leads/${lead.id}`);

  return {
    success: true,
    data: { lead: lead as Lead, meeting: meeting as LeadMeeting },
  };
}

/**
 * Atomic operation: Fixes (schedules) a meeting for an existing lead that has
 * progressed from initial contact. Updates lead status, address, project info,
 * requirements, and creates the meeting — all in sequence.
 *
 * NOTE: For true atomicity, this should be moved to a Supabase DB function (RPC).
 *
 * @param params.leadId - The lead to update
 * @param params.address - Updated client address
 * @param params.meetingData - Meeting details (date, slot, sales_executive_id)
 * @param params.projectStatus - Current known project status/subStatus
 * @param params.requirements - Updated requirement tags/strings
 * @param params.comment - Optional activity note
 */
export async function fixMeetingForLead(params: {
  leadId: string;
  address: Lead["address"];
  meetingData: Partial<LeadMeeting>;
  projectStatus: { status: string | null; subStatus: string | null };
  requirements: string[];
  comment?: string;
}): Promise<ActionResult<LeadMeeting>> {
  const supabase = await getUserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Step 1: Update the Lead
  const { error: lErr } = await supabase
    .from("leads")
    .update({
      status: "Meeting Fixed",
      address: params.address,
      project_status: params.projectStatus,
      requirements: params.requirements,
      sales_executive_id: params.meetingData.sales_executive_id,
    })
    .eq("id", params.leadId);

  if (lErr) return { success: false, error: lErr.message };

  // Step 2: Create the Meeting
  const { data: meeting, error: meetingError } = await supabase
    .from("lead_meetings")
    .insert([{ ...params.meetingData, lead_id: params.leadId, status: "Fixed" }])
    .select("*, sales_executive:users(id, name, nickname, profile_picture)")
    .single();

  if (meetingError) return { success: false, error: meetingError.message };

  // Step 3: Log comment if provided
  if (params.comment) {
    await addLeadComment(params.leadId, params.comment);
  }

  updateTag(CACHE_TAGS.LEAD_DETAILS(params.leadId));
  updateTag(CACHE_TAGS.LEADS);
  updateTag(CACHE_TAGS.MEETINGS);
  revalidatePath(`/leads/${params.leadId}`);
  revalidatePath("/meetings/slots");

  return { success: true, data: meeting as LeadMeeting };
}

/**
 * Atomic operation: Marks a meeting as Complete and transitions the lead to
 * "Meeting Complete" status. Records finance snapshots and schedules a follow-up.
 *
 * ⚠️ Uses the `complete_meeting` DB RPC for true atomicity — all changes happen
 * in a single PostgreSQL transaction. If any step fails, the entire operation
 * rolls back automatically.
 *
 * @param params.meetingId - Meeting UUID to mark complete
 * @param params.leadId - Associated lead UUID
 * @param params.projectValue - Estimated project value captured during meeting
 * @param params.clientsBudget - Client's stated budget
 * @param params.followUpTime - ISO timestamp for the next follow-up reminder
 * @param params.comment - Required post-meeting summary note
 */
export async function completeMeeting(params: {
  meetingId: string;
  leadId: string;
  projectValue: number;
  clientsBudget: number;
  followUpTime: string;
  comment: string;
}): Promise<ActionResult<boolean>> {
  const supabase = await getUserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Atomic RPC — all steps happen in a single DB transaction
  const { error } = await supabase.rpc("complete_meeting", {
    p_meeting_id: params.meetingId,
    p_lead_id: params.leadId,
    p_project_value: params.projectValue,
    p_clients_budget: params.clientsBudget,
    p_follow_up_time: params.followUpTime,
    p_comment: params.comment,
    p_user_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.LEAD_DETAILS(params.leadId));
  updateTag(CACHE_TAGS.LEADS);
  updateTag(CACHE_TAGS.MEETINGS);
  updateTag(CACHE_TAGS.FOLLOW_UPS);
  updateTag(CACHE_TAGS.LEAD_STATUS_COUNTS);
  revalidatePath(`/leads/${params.leadId}`);
  revalidatePath("/meetings/slots");

  return { success: true, data: true };
}

/**
 * Atomic operation: Marks a lead as Sold. Captures financial data, records a
 * payment, logs a comment, and schedules the next follow-up.
 *
 * ⚠️ Uses the `mark_as_sold` DB RPC for true atomicity — all changes happen
 * in a single PostgreSQL transaction. Finance totals (totalPayment, totalDue)
 * are now computed dynamically from `lead_payments` via the `lead_finance_computed`
 * view — NOT stored in the JSONB `finance` column.
 *
 * @param params.meetingId - Meeting UUID to mark as Sold
 * @param params.leadId - Associated lead UUID
 * @param params.projectValue - Final confirmed project value
 * @param params.soldAmount - Amount the deal was closed at
 * @param params.clientsBudget - Client's stated budget
 * @param params.soldDate - Date the deal was closed (ISO date string)
 * @param params.paymentAmount - Initial payment amount (0 if no payment yet)
 * @param params.paymentMethod - Payment method (Cash, Cheque, Bank Transfer, etc.)
 * @param params.paymentNote - Optional note about the payment
 * @param params.nextFollowUpTime - ISO timestamp for next follow-up
 * @param params.comment - Required closing note for the activity feed
 */
export async function markAsSold(params: {
  meetingId: string;
  leadId: string;
  projectValue: number;
  soldAmount: number;
  clientsBudget: number;
  soldDate: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentNote?: string;
  nextFollowUpTime: string;
  comment: string;
}): Promise<ActionResult<boolean>> {
  const supabase = await getUserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Atomic RPC — all steps happen in a single DB transaction
  const { error } = await supabase.rpc("mark_as_sold", {
    p_meeting_id: params.meetingId,
    p_lead_id: params.leadId,
    p_project_value: params.projectValue,
    p_sold_amount: params.soldAmount,
    p_clients_budget: params.clientsBudget,
    p_sold_date: params.soldDate,
    p_payment_amount: params.paymentAmount,
    p_payment_method: params.paymentMethod,
    p_payment_note: params.paymentNote ?? null,
    p_next_follow_up_time: params.nextFollowUpTime,
    p_comment: params.comment,
    p_user_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.LEAD_DETAILS(params.leadId));
  updateTag(CACHE_TAGS.LEADS);
  updateTag(CACHE_TAGS.MEETINGS);
  updateTag(CACHE_TAGS.FOLLOW_UPS);
  updateTag(CACHE_TAGS.LEAD_STATUS_COUNTS);
  revalidatePath(`/leads/${params.leadId}`);
  revalidatePath("/meetings/slots");

  return { success: true, data: true };
}
