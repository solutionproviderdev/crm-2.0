"use client";

import { useState, useEffect, useTransition } from "react";
import { FollowUpWithLead, User } from "@/lib/types";
import { format, startOfDay, endOfDay, addDays, subDays, isToday } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Users,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  TrendingUp
} from "lucide-react";
import { ReminderCard } from "./ReminderCard";
import { FollowUpModal } from "./FollowUpModal";
import { getFollowUps } from "@/app/actions/follow-ups";
import { useUser } from "@/components/providers/UserProvider";
import { ReminderStatsSkeleton, RemindersListSkeleton } from "./ReminderSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface RemindersPageContentProps {
  initialReminders: FollowUpWithLead[];
  initialUsers: User[];
  selectedDate: string;
}

export default function RemindersPageContent({ 
  initialReminders, 
  initialUsers,
  selectedDate: serverDate
}: RemindersPageContentProps) {
  const { user: currentUser } = useUser();
  const [isPending, startTransition] = useTransition();
  const [reminders, setReminders] = useState<FollowUpWithLead[]>(initialReminders);
  const [selectedDate, setSelectedDate] = useState(serverDate);
  const [selectedUser, setSelectedUser] = useState<string>(currentUser?.type === "Admin" ? "all" : currentUser?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  
  const [processingReminder, setProcessingReminder] = useState<FollowUpWithLead | null>(null);

  const isAdmin = currentUser?.type === "Admin";
  // All active users — not just CRE — since any user can be assigned a lead
  const operators = initialUsers;

  // Refetch when filters change
  useEffect(() => {
    if (selectedDate === serverDate && reminders === initialReminders) return;
    
    startTransition(async () => {
      const start = startOfDay(new Date(selectedDate)).toISOString();
      const end = endOfDay(new Date(selectedDate)).toISOString();
      
      const result = await getFollowUps({
        startDate: start,
        endDate: end,
        // Use ownerId (checks all 3 assignment columns) — works for both old
        // and new assignment system. Non-admins always scoped to their own id.
        ownerId: isAdmin && selectedUser !== "all" ? selectedUser : (!isAdmin ? currentUser?.id : undefined),
        status: activeStatus === "all" ? undefined : activeStatus
      });

      if (result.success) {
        setReminders(result.data as FollowUpWithLead[]);
      }
    });
  }, [selectedDate, selectedUser, activeStatus]);

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === "Pending").length,
    missed: reminders.filter(r => r.status === "Missed").length,
    completed: reminders.filter(r => r.status === "Complete" || r.status === "Late Complete").length,
  };

  const filteredReminders = reminders.filter(r => {
    const lead = (r as any).lead;
    return (
      lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead?.cid?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Main Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-[var(--brand-primary)]" />
            Reminders
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
            Focus on your interactions for <span className="text-[var(--brand-primary)]">{format(new Date(selectedDate), "MMMM d, yyyy")}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Navigator */}
          <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl hover:bg-slate-50 text-slate-400"
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="px-4 text-xs font-black uppercase tracking-widest text-slate-600 min-w-32 text-center">
              {isToday(new Date(selectedDate)) ? "Today" : format(new Date(selectedDate), "MMM d")}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl hover:bg-slate-50 text-slate-400"
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Admin User Filter */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 p-1 pl-3 shadow-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-[var(--brand-primary)] py-2 pr-8 rounded-xl"
              >
                <option value="all">All Team Members</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.nickname || op.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary Ribbons */}
      {isPending ? <ReminderStatsSkeleton /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Follow-ups" value={stats.total} icon={Activity} color="bg-slate-50 text-slate-600 border-slate-100" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-orange-50 text-orange-600 border-orange-100" />
          <StatCard label="Missed" value={stats.missed} icon={AlertCircle} color="bg-red-50 text-red-600 border-red-100" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600 border-emerald-100" />
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by Lead Name or CID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-3xl border-slate-100 bg-white shadow-sm focus:ring-[var(--brand-primary)]/10 font-bold placeholder:text-slate-300"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
          {["all", "Pending", "Missed", "Complete"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 whitespace-nowrap shadow-sm",
                activeStatus === status 
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/20" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Section */}
      {isPending ? <RemindersListSkeleton /> : (
        <div className="min-h-100">
          {filteredReminders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredReminders.map((reminder) => (
                <ReminderCard 
                  key={reminder.id} 
                  reminder={reminder} 
                  onProcess={(r) => setProcessingReminder(r as FollowUpWithLead)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-4xl border border-dashed border-slate-200">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 shadow-xs">
                <Bell className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-xl font-black text-slate-400">Perfect Clarity</p>
              <p className="text-sm font-bold text-slate-300 mt-2 uppercase tracking-wide">No reminders matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Processing Modal */}
      <FollowUpModal 
        isOpen={!!processingReminder}
        reminder={processingReminder}
        onClose={() => setProcessingReminder(null)}
        onSuccess={(updated) => {
          setReminders(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className={cn("p-6 rounded-4xl border shadow-xs flex flex-col items-start justify-between group hover:shadow-lg transition-all duration-500", color)}>
      <div className="flex items-center justify-between w-full mb-2">
        <Icon className="w-6 h-6 opacity-40 group-hover:scale-110 transition-transform duration-500" />
        <TrendingUp className="w-3.5 h-3.5 opacity-20" />
      </div>
      <div>
        <p className="text-2xl font-black leading-tight">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
