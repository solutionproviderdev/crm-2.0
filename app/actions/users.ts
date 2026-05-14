"use server";

import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createClient as createStandardClient } from "@/utils/supabase/server";
import { createAdminClient as createServiceRoleClient } from "@/utils/supabase/admin";
import type {
  ActionResult,
  User,
  CreateUserInput,
  UpdateUserInput,
} from "@/lib/types";
import type { AccountStatusValue, EmploymentStatusValue } from "@/constants/employeeStatus";
import type { ValidatedUserRow } from "@/lib/user-import-utils";

async function getStandardClient() {
  const cookieStore = await cookies();
  return createStandardClient(cookieStore);
}

// 🛡️ SECURITY: Only use Service Role client AFTER explicitly checking if 
// the requesting user is an Admin at the application level.
async function getServiceRoleClient() {
  const supabase = await getStandardClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) throw new Error("Unauthorized");

  const { data: user } = await supabase
    .from("users")
    .select("type")
    .eq("id", authUser.id)
    .single();

  if (!user || user.type !== "Admin") {
    throw new Error("Administrative privileges required");
  }

  return createServiceRoleClient();
}

export async function getUsers(): Promise<ActionResult<User[]>> {
  const supabase = await getStandardClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      department:departments(id, name),
      role:roles(id, name)
    `)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as User[] };
}

export async function getUserById(id: string): Promise<ActionResult<User>> {
  const supabase = await getStandardClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      department:departments(*),
      role:roles(*, department:departments(*)),
      social_links:user_social_links(*),
      documents:user_documents(*)
    `)
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as User };
}

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<User>> {
  const supabase = await getServiceRoleClient();

  // 1. Create auth user (sends email invite or sets password)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
        type: input.type,
      },
    });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Failed to create auth user" };
  }

  // 2. Update the auto-created users row with full details
  const { data, error } = await supabase
    .from("users")
    .update({
      nickname:          input.nickname || null,
      type:              input.type,
      account_status:    input.account_status || 'active',
      employment_status: input.employment_status || 'trainee',
      personal_phone:    input.personal_phone || null,
      office_phone:      input.office_phone || null,
      gender:            input.gender || null,
      address:           input.address || null,
      date_of_birth:     input.date_of_birth || null,
      department_id:     input.department_id || null,
      role_id:           input.role_id || null,
      joining_date:      input.joining_date || null,
      current_salary:    input.current_salary || null,
      working_procedure: input.working_procedure || null,
      guardian_name:     input.guardian_name || null,
      guardian_phone:    input.guardian_phone || null,
      guardian_relation: input.guardian_relation || null,
    })
    .eq("id", authData.user.id)
    .select(`*, department:departments(*), role:roles(*)`)
    .single();

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.USERS);
  revalidatePath("/users");
  revalidatePath("/leads");

  return { success: true, data: data as User };
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<ActionResult<User>> {
  const supabase = await getStandardClient();
  const { data, error } = await supabase
    .from("users")
    .update(input)
    .eq("id", id)
    .select(`*, department:departments(*), role:roles(*)`)
    .single();

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.USERS);
  revalidatePath("/users");
  revalidatePath("/leads");

  return { success: true, data: data as User };
}

export async function updateUserStatuses(
  id: string,
  account_status?: AccountStatusValue,
  employment_status?: EmploymentStatusValue
): Promise<ActionResult<null>> {
  const supabase = await getStandardClient();
  const updateData: any = {};
  if (account_status) updateData.account_status = account_status;
  if (employment_status) updateData.employment_status = employment_status;

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.USERS);
  revalidatePath("/users");
  revalidatePath("/leads");

  return { success: true, data: null };
}

export async function deleteUser(id: string): Promise<ActionResult<null>> {
  const supabase = await getServiceRoleClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function adminUpdatePassword(
  userId: string,
  newPassword: string
): Promise<ActionResult<null>> {
  const supabase = await getServiceRoleClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function updateOwnPassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult<null>> {
  const supabase = await getStandardClient();
  // Re-authenticate with current password first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Not authenticated" };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { success: false, error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function updateProfilePicture(
  userId: string,
  file: File
): Promise<ActionResult<string>> {
  const supabase = await getStandardClient();
  const ext = file.name.split(".").pop();
  const path = `profiles/${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("user-media")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("user-media")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("users")
    .update({ profile_picture: publicUrl })
    .eq("id", userId);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true, data: publicUrl };
}

export async function getUserDropdownOptions(): Promise<
  ActionResult<{ id: string; name: string; type: string }[]>
> {
  const supabase = await getStandardClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, type")
    .eq("account_status", "active")
    .order("name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk User Import
// ─────────────────────────────────────────────────────────────────────────────

export interface BulkImportResult {
  succeeded: number;
  failed: Array<{ email: string; error: string }>;
}

/**
 * Creates multiple users in both Supabase Auth and public.users.
 * Auth + profile are treated as one atomic unit — if the DB insert fails,
 * the auth user is deleted (rollback) to avoid ghost accounts.
 * Passwords are passed directly to auth.admin.createUser and never stored.
 */
export async function bulkCreateUsers(
  rows: ValidatedUserRow[]
): Promise<BulkImportResult> {
  const supabase = await getServiceRoleClient();
  const today    = new Date().toISOString().split("T")[0];
  const result:  BulkImportResult = { succeeded: 0, failed: [] };

  for (const row of rows) {
    // Only process valid rows — safety net (dialog already filters)
    if (!row.valid) continue;

    // ── Step 1: Create auth user ──────────────────────────────────────────
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email:           row.email,
        password:        row.password,
        email_confirm:   true,
        user_metadata:   { name: row.name },
      });

    if (authError || !authData.user) {
      result.failed.push({
        email: row.email,
        error: authError?.message ?? "Failed to create auth account",
      });
      continue;
    }

    const authUserId = authData.user.id;

    // ── Step 2: Insert public.users profile ───────────────────────────────
    // Supabase trigger already inserts a bare row on auth.users insert.
    // We UPDATE (same as single createUser) instead of INSERT to avoid conflicts.
    const { error: profileError } = await supabase
      .from("users")
      .update({
        name:              row.name,
        email:             row.email,
        nickname:          row.nickname          ?? null,
        personal_phone:    row.personal_phone    ?? null,
        office_phone:      row.office_phone      ?? null,
        gender:            row.gender            ?? null,
        address:           row.address           ?? null,
        date_of_birth:     row.date_of_birth     ?? null,
        joining_date:      row.joining_date      ?? today,
        current_salary:    row.current_salary    ?? null,
        guardian_name:     row.guardian_name     ?? null,
        guardian_phone:    row.guardian_phone    ?? null,
        guardian_relation: row.guardian_relation ?? null,
        department_id:     row.department_id     ?? null,
        role_id:           row.role_id           ?? null,
        type:              row.type              ?? "Operator",
        employment_status: row.employment_status ?? "trainee",
        account_status:    row.account_status    ?? "active",
      })
      .eq("id", authUserId);

    if (profileError) {
      // Rollback: delete auth user so no ghost account remains
      await supabase.auth.admin.deleteUser(authUserId);
      result.failed.push({
        email: row.email,
        error: `Profile insert failed: ${profileError.message}`,
      });
      continue;
    }

    result.succeeded++;
  }

  updateTag(CACHE_TAGS.USERS);
  revalidatePath("/users");
  revalidatePath("/dashboard");
  revalidatePath("/leads");

  return result;
}
