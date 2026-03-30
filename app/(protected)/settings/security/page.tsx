"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, KeyRound, Save } from "lucide-react";
import { updateOwnPassword } from "@/app/actions/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SecuritySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
        return toast.error("New passwords do not match");
    }

    if (passwords.new.length < 6) {
        return toast.error("Password must be at least 6 characters");
    }

    setIsSaving(true);
    const result = await updateOwnPassword(passwords.current, passwords.new);
    setIsSaving(false);

    if (result.success) {
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ───────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#046288]/10 text-[#046288]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Security & Privacy</h2>
        </div>
        <p className="text-sm text-gray-500 ml-10">Manage your password and account security.</p>
      </div>

      {/* ── Password Form ────────────────────────── */}
      <div className="max-w-md ml-10">
        <form onSubmit={handleUpdatePassword} className="space-y-6 bg-white p-8 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="h-4 w-4 text-[#046288]" />
            <h3 className="font-bold text-sm tracking-tight">Update Password</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Current Password</label>
              <Input
                type="password"
                required
                value={passwords.current}
                onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                className="rounded-2xl h-12 border-gray-100 focus:ring-[#046288]/20 focus:border-[#046288] text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">New Password</label>
              <Input
                type="password"
                required
                value={passwords.new}
                onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                className="rounded-2xl h-12 border-gray-100 focus:ring-[#046288]/20 focus:border-[#046288] text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Confirm New Password</label>
              <Input
                type="password"
                required
                value={passwords.confirm}
                onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                className="rounded-2xl h-12 border-gray-100 focus:ring-[#046288]/20 focus:border-[#046288] text-sm transition-all"
              />
            </div>
          </div>

          <Button 
            type="submit"
            disabled={isSaving}
            className="w-full h-12 rounded-2xl bg-[#046288] hover:bg-[#034e6d] text-white font-bold shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            Update Password
          </Button>
        </form>

        <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Important Note</p>
            <p className="text-xs text-amber-600 leading-relaxed">
                Changing your password will require you to log in again on all other devices. 
                Make sure to choose a strong, unique password for your account security.
            </p>
        </div>
      </div>
    </div>
  );
}
