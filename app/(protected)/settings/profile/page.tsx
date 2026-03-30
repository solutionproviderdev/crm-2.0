"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, User as UserIcon, Palette } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { 
  updateUserDetails, 
  updateUserMedia,
  updateUserTheme 
} from "@/app/actions/settings";
import { ImageUpload } from "@/components/settings/ImageUpload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/utils/cn";

export default function ProfileSettingsPage() {
  const { user, setUser } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const handleUpdateInfo = async () => {
    setIsSaving(true);
    const result = await updateUserDetails(user.id, { nickname });
    setIsSaving(false);

    if (result.success) {
      setUser(result.data);
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error);
    }
  };

  const handleImageUpload = async (type: "avatar" | "cover", file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await updateUserMedia(user.id, type, formData);
    if (result.success) {
      setUser(prev => prev ? { 
        ...prev, 
        [type === "avatar" ? "profile_picture" : "cover_photo"]: result.data 
      } : null);
      toast.success(`${type === "avatar" ? "Avatar" : "Cover photo"} updated`);
    } else {
      toast.error(result.error);
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const result = await updateUserTheme(newTheme);
    if (!result.success) {
      toast.error("Failed to persist theme preference");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ───────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#046288]/10 text-[#046288]">
            <UserIcon className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Personal Information</h2>
        </div>
        <p className="text-sm text-gray-500 ml-10">Update your nickname and how others see you.</p>
      </div>

      {/* ── Visual Assets ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ImageUpload
            label="Cover Photo"
            value={user.cover_photo}
            aspectRatio="21/9"
            onChange={(file) => handleImageUpload("cover", file)}
          />
        </div>
        <div>
          <ImageUpload
            label="Profile Picture"
            value={user.profile_picture}
            shape="circle"
            onChange={(file) => handleImageUpload("avatar", file)}
          />
        </div>
      </div>

      {/* ── Basic Info ───────────────────────────── */}
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Nickname</label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="How should we call you?"
            className="rounded-2xl h-12 border-gray-100 focus:ring-[#046288]/20 focus:border-[#046288] text-sm font-medium transition-all"
          />
        </div>

        <Button 
          onClick={handleUpdateInfo}
          disabled={isSaving}
          className="w-full h-12 rounded-2xl bg-[#046288] hover:bg-[#034e6d] text-white font-bold shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* ── Theme Preference ────────────────────── */}
      <div className="pt-10 border-t border-gray-100 space-y-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#046288]/10 text-[#046288]">
              <Palette className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Interface Theme</h2>
          </div>
          <p className="text-sm text-gray-500 ml-10">Customize your workspace appearance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl ml-10">
          {[
            { id: "light", label: "Light Mode", description: "Clean & Bright" },
            { id: "dark", label: "Dark Mode", description: "Easy on the eyes" },
            { id: "system", label: "System", description: "Follow device settings" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id as any)}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all group",
                (mounted && theme === t.id) 
                  ? "bg-white border-[#046288] shadow-xl shadow-[#046288]/5 scale-[1.02] z-10" 
                  : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50 text-gray-400"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-colors",
                (mounted && theme === t.id) ? "bg-[#046288] text-white" : "bg-gray-100 group-hover:bg-gray-200"
              )}>
                {t.id === "light" && <div className="w-5 h-5 rounded-full border-4 border-current" />}
                {t.id === "dark" && <div className="w-5 h-5 rounded-full bg-current" />}
                {t.id === "system" && <div className="w-5 h-5 rounded-full border-4 border-current border-t-transparent" />}
              </div>
              <p className={cn(
                "text-sm font-black transition-colors",
                (mounted && theme === t.id) ? "text-gray-900" : "text-gray-400"
              )}>{t.label}</p>
              <p className="text-[10px] font-bold opacity-60 mt-1">{t.description}</p>
              
              {mounted && theme === t.id && (
                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#046288]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
