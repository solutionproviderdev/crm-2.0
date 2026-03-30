"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath, cacheLife, cacheTag, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { 
  ActionResult, 
  SiteSettings, 
  UpdateSiteSettingsInput,
  User
} from "@/lib/types";

async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Fetches the single site_settings row. Uses admin client so this can be
 * cached with `'use cache'` (stateless, no cookies).
 * Cached for days — site branding changes rarely.
 */
export async function getSiteSettings(): Promise<ActionResult<SiteSettings>> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.SETTINGS);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "main")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as SiteSettings };
}

export async function updateSiteSettings(
  input: UpdateSiteSettingsInput
): Promise<ActionResult<SiteSettings>> {
  const supabase = await getClient();
  
  // Admin check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { success: false, error: "Unauthorized" };

  const { data: userProfile } = await supabase
    .from("users")
    .select("type")
    .eq("id", authUser.id)
    .single();

  if (userProfile?.type !== "Admin") {
    return { success: false, error: "Only admins can update site settings" };
  }

  const { data, error } = await supabase
    .from("site_settings")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
      updated_by: authUser.id
    })
    .eq("id", "main")
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  
  updateTag(CACHE_TAGS.SETTINGS);
  revalidatePath("/", "layout");
  return { success: true, data: data as SiteSettings };
}

export async function updateUserTheme(
  theme: "light" | "dark" | "system"
): Promise<ActionResult<null>> {
  const supabase = await getClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ theme_preference: theme })
    .eq("id", authUser.id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/", "layout");
  return { success: true, data: null };
}

export async function updateUserDetails(
  userId: string,
  input: {
    nickname?: string;
    profile_picture?: string;
    cover_photo?: string;
  }
): Promise<ActionResult<User>> {
  const supabase = await getClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("users")
    .update(input)
    .eq("id", userId)
    .select(`*, department:departments(*), role:roles(*)`)
    .single();

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/", "layout");
  return { success: true, data: data as User };
}

export async function uploadSettingFile(
  path: string,
  formData: FormData
): Promise<ActionResult<string>> {
  const supabase = await getClient();
  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file provided" };

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { success: false, error: "Unauthorized" };

  const { error: uploadError } = await supabase.storage
    .from("user-media")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("user-media")
    .getPublicUrl(path);

  return { success: true, data: publicUrl };
}

export async function updateUserMedia(
  userId: string,
  type: "avatar" | "cover",
  formData: FormData
): Promise<ActionResult<string>> {
  const file = formData.get("file") as File;
  const ext = file.name.split(".").pop();
  const path = `profiles/${userId}/${type}_${Date.now()}.${ext}`;

  const uploadResult = await uploadSettingFile(path, formData);
  if (!uploadResult.success) return uploadResult;

  const updateData = type === "avatar" 
    ? { profile_picture: uploadResult.data } 
    : { cover_photo: uploadResult.data };

  const supabase = await getClient();
  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true, data: uploadResult.data };
}
