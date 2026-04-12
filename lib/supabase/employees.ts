"use server";

import { cookies } from "next/headers";
import { createClient as createStandardClient } from "@/utils/supabase/server";
import { createAdminClient as createServiceRoleClient } from "@/utils/supabase/admin";
import { SENTINEL_USER_ID } from "@/constants/system";
import type { ActionResult } from "@/lib/types";
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput, EmploymentStatusValue, AccountStatusValue } from "@/types/employee";

async function getStandardClient() {
  const cookieStore = await cookies();
  return createStandardClient(cookieStore);
}

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

export async function getEmployees(): Promise<ActionResult<Employee[]>> {
  const supabase = await getStandardClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      department:departments(id, name),
      role:roles(id, name)
    `)
    .neq("id", SENTINEL_USER_ID)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Employee[] };
}

export async function getEmployeeById(id: string): Promise<ActionResult<Employee>> {
  const supabase = await getStandardClient();
  const { data, error } = await supabase
    .from("users")
    .select(`*, department:departments(*), role:roles(*, department:departments(*))`)
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Employee };
}

export async function updateEmployeeStatuses(
  id: string,
  account_status?: AccountStatusValue,
  employment_status?: EmploymentStatusValue
): Promise<ActionResult<null>> {
  const supabase = await getStandardClient();
  
  // NOTE: In the UI "Only users with the admin role should be able to change Account Status."
  // Security checking if account_status is changing:
  if (account_status) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: currentUser } = await supabase.from("users").select("type").eq("id", authUser.id).single();
      if (currentUser?.type !== "Admin") {
        return { success: false, error: "Only admins can change account status" };
      }
    }
  }

  const updateData: any = {};
  if (account_status) updateData.account_status = account_status;
  if (employment_status) updateData.employment_status = employment_status;

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function createEmployee(input: CreateEmployeeInput): Promise<ActionResult<Employee>> {
  // Leverage existing createUser function from app/actions/users
  const { createUser } = await import("@/app/actions/users");
  const result = await createUser(input as any);
  return result as ActionResult<Employee>;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<ActionResult<Employee>> {
  const { updateUser } = await import("@/app/actions/users");
  const result = await updateUser(id, input as any);
  return result as ActionResult<Employee>;
}

export async function getEmployeeDeletionSummary(userId: string): Promise<ActionResult<{ creCount: number; salesCount: number }>> {
  const supabase = await getStandardClient();
  
  const { count: creCount, error: creError } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("cre_id", userId);
    
  if (creError) return { success: false, error: creError.message };

  const { count: salesCount, error: salesError } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("sales_executive_id", userId);
    
  if (salesError) return { success: false, error: salesError.message };

  return { 
    success: true, 
    data: { 
      creCount: creCount || 0, 
      salesCount: salesCount || 0 
    } 
  };
}

export async function getActiveEmployeesForReassignment(excludedUserId: string): Promise<ActionResult<Pick<Employee, "id" | "name" | "role">[]>> {
  const supabase = await getStandardClient();
  
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role:roles(name)")
    .eq("account_status", "active")
    .neq("id", excludedUserId)
    .neq("id", SENTINEL_USER_ID)
    .order("name");

  if (error) return { success: false, error: error.message };
  
  return { success: true, data: data as any };
}

