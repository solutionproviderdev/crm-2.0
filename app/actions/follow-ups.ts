"use server";

import { revalidatePath, cacheLife, cacheTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { addLeadComment } from "@/app/actions/leads/mutations";
import type { ActionResult, LeadFollowUp } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Follow-up / Reminder actions separated from the leads god-file.
// ─────────────────────────────────────────────────────────────────────────────

async function getUserClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Fetches all follow-ups within a date range, with associated lead and user details.
 * Used for the Reminders / Follow-Up dashboard page.
 *
 * NOTE: Auto-expiry of "Missed" follow-ups is handled by the DB function
 * `expire_missed_follow_ups()` — NOT inline here, to avoid writes inside a
 * cached read function. Schedule that function via Supabase pg_cron.
 *
 * @param params.startDate - ISO datetime string for range start
 * @param params.endDate - ISO datetime string for range end
 * @param params.creId - Optional: filter by lead's assigned CRE
 * @param params.salesExecutiveId - Optional: filter by lead's assigned sales executive
 * @param params.status - Optional: filter by follow-up status (Pending, Complete, etc.)
 */
export async function getFollowUps(params: {
  startDate: string;
  endDate: string;
  creId?: string;
  salesExecutiveId?: string;
  status?: string;
}): Promise<ActionResult<LeadFollowUp[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.FOLLOW_UPS);

  const supabase = createAdminClient();

  let query = supabase
    .from("lead_follow_ups")
    .select(
      `
      *,
      assigned_user:users(id, name, nickname, profile_picture),
      lead:leads(
        id, 
        name, 
        cid, 
        phones, 
        address,
        requirements,
        cre:users!leads_cre_id_fkey(id, name, nickname, profile_picture),
        sales_executive:users!leads_sales_executive_id_fkey(id, name, nickname, profile_picture),
        comments:lead_comments(comment, created_at, user:users(id, name, profile_picture))
      )
    `
    )
    .gte("time", params.startDate)
    .lte("time", params.endDate)
    .order("time", { ascending: true })
    .order("created_at", {
      foreignTable: "lead.comments",
      ascending: false,
    });

  if (params.status) query = query.eq("status", params.status);
  if (params.creId) query = query.eq("lead.cre_id", params.creId);
  if (params.salesExecutiveId)
    query = query.eq("lead.sales_executive_id", params.salesExecutiveId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  return { success: true, data: data as LeadFollowUp[] };
}

/**
 * Schedules a follow-up reminder for a lead.
 * If the follow-up type is "Physical Meeting", a meeting entry is also created
 * in `lead_meetings` simultaneously.
 *
 * @param params.leadId - Lead UUID to attach the follow-up to
 * @param params.time - ISO datetime for when the follow-up is due
 * @param params.comment - Optional comment to log alongside the follow-up
 * @param params.type - "Call" (default) or "Physical Meeting"
 * @param params.assignedTo - User UUID responsible. Defaults to the current user.
 * @param params.meetingDate - Required if type is "Physical Meeting"
 * @param params.slotId - Meeting slot ID required if type is "Physical Meeting"
 */
export async function addLeadFollowUp(params: {
  leadId: string;
  time: string;
  comment?: string;
  type?: "Call" | "Physical Meeting";
  assignedTo?: string;
  meetingDate?: string;
  slotId?: string;
}): Promise<ActionResult<LeadFollowUp>> {
  const supabase = await getUserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const type = params.type || "Call";
  const assignedTo = params.assignedTo || user.id;

  // If physical meeting, create a meeting entry in parallel
  if (type === "Physical Meeting" && params.meetingDate && params.slotId) {
    const { error: mErr } = await supabase.from("lead_meetings").insert([
      {
        lead_id: params.leadId,
        date: params.meetingDate,
        slot: params.slotId,
        sales_executive_id: assignedTo,
        status: "Follow-up Scheduled",
      },
    ]);

    if (mErr)
      return {
        success: false,
        error: `Meeting creation failed: ${mErr.message}`,
      };
  }

  // Create the follow-up record
  const { data, error } = await supabase
    .from("lead_follow_ups")
    .insert([
      {
        lead_id: params.leadId,
        time: params.time,
        status: "Pending",
        type,
        assigned_to: assignedTo,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Log an optional comment
  if (params.comment) {
    await addLeadComment(params.leadId, params.comment);
  }

  updateTag(CACHE_TAGS.LEAD_DETAILS(params.leadId));
  updateTag(CACHE_TAGS.FOLLOW_UPS);
  if (type === "Physical Meeting") updateTag(CACHE_TAGS.MEETINGS);
  revalidatePath(`/leads/${params.leadId}`);
  revalidatePath("/reminders");
  revalidatePath("/meetings/slots");

  return { success: true, data: data as LeadFollowUp };
}

/**
 * Marks a follow-up as Complete or Late Complete, adds a comment, and
 * optionally schedules the next follow-up.
 *
 * @param params.id - Follow-up UUID to complete
 * @param params.leadId - Associated lead UUID
 * @param params.status - "Complete" or "Late Complete"
 * @param params.comment - Required completion note for the activity feed
 * @param params.nextFollowUpTime - ISO datetime for the next scheduled follow-up
 * @param params.type - Type for the next follow-up if scheduling one
 * @param params.assignedTo - User to assign the next follow-up to
 * @param params.meetingDate - Date for the next follow-up if it's a meeting
 * @param params.slotId - Slot ID for the next follow-up if it's a meeting
 */
export async function completeFollowUp(params: {
  id: string;
  leadId: string;
  status: "Complete" | "Late Complete";
  comment: string;
  nextFollowUpTime?: string;
  type?: "Call" | "Physical Meeting";
  assignedTo?: string;
  meetingDate?: string;
  slotId?: string;
}): Promise<ActionResult<LeadFollowUp>> {
  const supabase = await getUserClient();

  const { data, error } = await supabase
    .from("lead_follow_ups")
    .update({ status: params.status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Log completion comment
  await addLeadComment(params.leadId, params.comment);

  // Schedule the next follow-up if provided
  if (
    params.nextFollowUpTime ||
    (params.type === "Physical Meeting" && params.meetingDate)
  ) {
    await addLeadFollowUp({
      leadId: params.leadId,
      time: params.nextFollowUpTime || params.meetingDate!,
      type: params.type,
      assignedTo: params.assignedTo,
      meetingDate: params.meetingDate,
      slotId: params.slotId,
    });
  }

  updateTag(CACHE_TAGS.FOLLOW_UPS);
  updateTag(CACHE_TAGS.LEAD_DETAILS(params.leadId));
  revalidatePath("/reminders");
  revalidatePath(`/leads/${params.leadId}`);

  return { success: true, data: data as LeadFollowUp };
}
