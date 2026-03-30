import { Metadata } from "next";
import { connection } from "next/server";
import { getFollowUps } from "@/app/actions/follow-ups";
import { getAllActiveUsers } from "@/app/actions/leads";
import RemindersPageContent from "@/components/reminders/RemindersPageContent";
import { FollowUpWithLead } from "@/lib/types";
import { format, startOfDay, endOfDay } from "date-fns";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Reminders & Follow-ups | CRM 2.0",
  description: "Track and manage your lead follow-ups and interactions.",
};

export default async function RemindersPage() {
  await connection();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  
  const [remindersRes, usersRes] = await Promise.all([
    getFollowUps({
      startDate: startOfDay(today).toISOString(),
      endDate: endOfDay(today).toISOString()
    }),
    getAllActiveUsers()
  ]);

  if (!remindersRes.success || !usersRes.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Sync Error</h2>
        <p className="text-slate-400 font-bold mt-2 max-w-md">
          {remindersRes.error || usersRes.error || "We couldn't synchronize your reminders at this moment. Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <RemindersPageContent 
        initialReminders={(remindersRes.data || []) as FollowUpWithLead[]} 
        initialUsers={usersRes.data || []}
        selectedDate={todayStr}
      />
    </div>
  );
}
