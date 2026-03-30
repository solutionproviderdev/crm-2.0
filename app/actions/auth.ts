"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult, User } from "@/lib/types";

export async function login(formData: FormData): Promise<ActionResult<User>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Invalid email or password",
    };
  }

  // 1. Try to fetch the full user profile
  const { data: userFromFetch, error: userError } = await supabase
    .from("users")
    .select(`
      *,
      department:departments(*),
      role:roles(*)
    `)
    .eq("id", authData.user.id)
    .single();

  let user = userFromFetch;

  // 2. JIT PROVISIONING: If profile is missing, create it now!
  // This handles users created before the DB trigger was active.
  if (userError || !user) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
        type: "Operator",
        status: "Active",
      })
      .select(`
        *,
        department:departments(*),
        role:roles(*)
      `)
      .single();

    if (createError) {
      console.error("JIT User Creation Error:", createError);
      return { success: false, error: "Authenticated successfully but profile sync failed. Contact admin." };
    }
    user = newUser;
  }

  // 3. Check status
  if (user.status === "Inactive") {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Your account has been deactivated. Contact admin.",
    };
  }

  return { success: true, data: user as User };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: user } = await supabase
    .from("users")
    .select(`
      *,
      department:departments(*),
      role:roles(*)
    `)
    .eq("id", authUser.id)
    .single();

  return (user as User) || null;
}
