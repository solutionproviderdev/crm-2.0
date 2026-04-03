"use client";

import { Lead } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { 
  AlarmClock, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react";

interface LeadRemindersTabProps {
  lead: Lead;
}

export function LeadRemindersTab({ lead }: LeadRemindersTabProps) {
  // Reminders are often stored in lead_follow_ups with type='Reminder' 
  // or a dedicated structure. For now, we'll filter follow_ups.
  const reminders = lead.follow_ups?.filter(f => (f.type as string) === "Reminder") || [];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "pending": return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
      default: return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete": return "bg-green-50 text-green-700 border-green-100";
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b shrink-0 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <AlarmClock className="w-4 h-4 text-[var(--brand-primary)]" />
          Active Reminders
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {reminders.length} Total
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-0">
        {reminders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
            <AlarmClock className="w-12 h-12 mb-2" />
            <p className="text-xs font-bold">No active reminders</p>
          </div>
        ) : (
          reminders.map((reminder, idx) => {
            const isLast = idx === reminders.length - 1;
            return (
              <div key={reminder.id} className="relative pl-8 pb-8 group">
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                )}
                
                <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${reminder.status === 'Complete' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between group-hover:border-[var(--brand-primary)]/20 transition-colors">
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">System Reminder</p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {new Date(reminder.time).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0 h-5 gap-1 ${getStatusClass(reminder.status)}`}>
                    {getStatusIcon(reminder.status)}
                    {reminder.status}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
