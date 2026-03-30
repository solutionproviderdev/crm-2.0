"use server";

import { revalidatePath, cacheLife, cacheTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult, Role, CreateRoleInput } from "@/lib/types";
import type { PermissionMap } from "@/lib/permissions";

async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Fetches all roles, optionally filtered by department. Cached for hours.
 * Roles change infrequently and are needed on nearly every authenticated page
 * for permission checks.
 *
 * @param departmentId - Optional department UUID to filter by
 */
export async function getRoles(
  departmentId?: string
): Promise<ActionResult<Role[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag(
    departmentId
      ? CACHE_TAGS.ROLES_BY_DEPT(departmentId)
      : CACHE_TAGS.ROLES
  );

  const supabase = createAdminClient();
  let query = supabase
    .from("roles")
    .select("*, department:departments(id, name)")
    .order("name");

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Role[] };
}

/**
 * Fetches a single role with full department details.
 *
 * @param id - Role UUID
 */
export async function getRoleById(id: string): Promise<ActionResult<Role>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*, department:departments(*)")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Role };
}

/**
 * Creates a new role with an initial permissions map. Admin-only (enforced by RLS).
 *
 * @param input - Role name, department, description, and permissions map
 */
export async function createRole(
  input: CreateRoleInput
): Promise<ActionResult<Role>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("roles")
    .insert({
      department_id: input.department_id,
      name: input.name,
      description: input.description || null,
      permissions: input.permissions,
    })
    .select("*, department:departments(*)")
    .single();

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.ROLES);
  if (input.department_id)
    updateTag(CACHE_TAGS.ROLES_BY_DEPT(input.department_id));
  revalidatePath("/settings");

  return { success: true, data: data as Role };
}

/**
 * Updates a role's metadata (name, description, department).
 * Admin-only (enforced by RLS).
 *
 * @param id - Role UUID
 * @param input - Fields to update
 */
export async function updateRole(
  id: string,
  input: Partial<CreateRoleInput>
): Promise<ActionResult<Role>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("roles")
    .update(input)
    .eq("id", id)
    .select("*, department:departments(*)")
    .single();

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.ROLES);
  revalidatePath("/settings");

  return { success: true, data: data as Role };
}

/**
 * Replaces a role's entire permissions map. Admin-only (enforced by RLS).
 * This is a full overwrite — the client should send the complete permissions object.
 *
 * @param id - Role UUID
 * @param permissions - Complete permission map to save
 */
export async function updateRolePermissions(
  id: string,
  permissions: PermissionMap
): Promise<ActionResult<null>> {
  const supabase = await getClient();
  const { error } = await supabase
    .from("roles")
    .update({ permissions })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.ROLES);
  revalidatePath("/settings");

  return { success: true, data: null };
}

/**
 * Deletes a role. Admin-only (enforced by RLS).
 * Note: Users with this `role_id` will have it SET NULL (per FK constraint).
 *
 * @param id - Role UUID
 */
export async function deleteRole(id: string): Promise<ActionResult<null>> {
  const supabase = await getClient();
  const { error } = await supabase.from("roles").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.ROLES);
  revalidatePath("/settings");

  return { success: true, data: null };
}
