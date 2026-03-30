"use server";

import { revalidatePath, cacheLife, cacheTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type {
  ActionResult,
  Department,
  CreateDepartmentInput,
} from "@/lib/types";

async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Fetches all departments. Cached for hours — departments change rarely.
 * Invalidated by `updateTag(CACHE_TAGS.DEPARTMENTS)` on any mutation.
 */
export async function getDepartments(): Promise<ActionResult<Department[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.DEPARTMENTS);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Department[] };
}

/**
 * Fetches a single department by ID.
 *
 * @param id - Department UUID
 */
export async function getDepartmentById(
  id: string
): Promise<ActionResult<Department>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Department };
}

/**
 * Creates a new department. Admin-only (enforced by RLS policy).
 *
 * @param input - Department name and optional description
 */
export async function createDepartment(
  input: CreateDepartmentInput
): Promise<ActionResult<Department>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({ name: input.name, description: input.description || null })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.DEPARTMENTS);
  revalidatePath("/settings");

  return { success: true, data: data as Department };
}

/**
 * Updates a department's name or description. Admin-only (enforced by RLS).
 *
 * @param id - Department UUID
 * @param input - Fields to update
 */
export async function updateDepartment(
  id: string,
  input: Partial<CreateDepartmentInput>
): Promise<ActionResult<Department>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("departments")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.DEPARTMENTS);
  revalidatePath("/settings");

  return { success: true, data: data as Department };
}

/**
 * Deletes a department. Admin-only (enforced by RLS).
 * Note: roles with `department_id` pointing here will have it SET NULL (per FK).
 *
 * @param id - Department UUID
 */
export async function deleteDepartment(
  id: string
): Promise<ActionResult<null>> {
  const supabase = await getClient();
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  updateTag(CACHE_TAGS.DEPARTMENTS);
  revalidatePath("/settings");

  return { success: true, data: null };
}
