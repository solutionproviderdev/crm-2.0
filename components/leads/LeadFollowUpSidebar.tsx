"use client";

import { Lead, LeadFollowUp } from "@/lib/types";
import { useTransition } from "react";
import { updateFollowUpStatus } from "@/app/actions/leads";
import { toast } from "sonner";
import { CheckCircle2, Clock, Phone, MessageSquare, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface LeadFollowUpSidebarProps {
  lead: Lead;
}

export function LeadFollowUpSidebar({ lead }: LeadFollowUpSidebarProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusToggle = (followUpId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Complete" ? "Pending" : "Complete";
    
    startTransition(async () => {
      const result = await updateFollowUpStatus(followUpId, newStatus, lead.id);
      if (result.success) {
        toast.success(`Task marked as ${newStatus.toLowerCase()}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const pendingFollowUps = lead.follow_ups?.filter(f => f.status !== "Complete") || [];
  const completedFollowUps = lead.follow_ups?.filter(f => f.status === "Complete") || [];

  return (
    <div className="space-y-4">
      {/* Pending Tasks */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Upcoming Tasks</label>
        {pendingFollowUps.length > 0 ? (
          <div className="space-y-1.5">
            {pendingFollowUps.map((follow) => (
              <div key={follow.id} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-[var(--brand-primary)]/20 transition-all group">
                <Checkbox 
                  checked={false}
                  onCheckedChange={() => handleStatusToggle(follow.id, follow.status)}
                  className="mt-0.5 border-slate-300 data-[state=checked]:bg-[var(--brand-primary)] data-[state=checked]:border-[var(--brand-primary)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">
                      {follow.type}
                    </p>
                    <Badge variant="outline" className="text-[8px] font-bold px-1 h-4 bg-yellow-50 text-yellow-700 border-yellow-100 uppercase">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(follow.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-[10px] font-bold text-slate-400 italic">No pending tasks</p>
          </div>
        )}
      </div>

      {/* Completed (Quick view) */}
      {completedFollowUps.length > 0 && (
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Completed</label>
          <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
            {completedFollowUps.slice(0, 2).map((follow) => (
              <div key={follow.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-transparent">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500 line-through truncate">{follow.type}</span>
                <span className="ml-auto text-[8px] font-black text-slate-400 uppercase whitespace-nowrap">
                  {new Date(follow.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
