"use server";

import { cookies } from "next/headers";
import { createClient as createStandardClient } from "@/utils/supabase/server";
import { createAdminClient as createServiceRoleClient } from "@/utils/supabase/admin";
import type {
  ActionResult,
  User,
  CreateUserInput,
  UpdateUserInput,
  UserStatus,
} from "@/lib/types";

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
  return { success: true, data: data as User };
}

export async function updateUserStatus(
  id: string,
  status: UserStatus
): Promise<ActionResult<null>> {
  const supabase = await getStandardClient();
  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
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
    .eq("status", "Active")
    .order("name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}
