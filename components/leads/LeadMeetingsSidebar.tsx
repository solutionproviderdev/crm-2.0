"use client";

import { Lead, LeadMeeting } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, User, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeadMeetingsSidebarProps {
  lead: Lead;
}

export function LeadMeetingsSidebar({ lead }: LeadMeetingsSidebarProps) {
  // Sort bypass to find the upcoming or most recent meeting
  const sortedMeetings = [...(lead.meetings || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const upcomingMeeting = sortedMeetings.find(m => m.status === "Scheduled") || sortedMeetings[0];

  if (!upcomingMeeting) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
        <p className="text-[10px] font-bold text-slate-400 italic">No meetings scheduled</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-50 text-blue-700 border-blue-100";
      case "Complete": return "bg-green-50 text-green-700 border-green-100";
      case "Rescheduled": return "bg-amber-50 text-amber-700 border-amber-100";
      case "Canceled": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm space-y-3 hover:border-slate-200 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tight px-1.5 h-5 ${getStatusColor(upcomingMeeting.status)}`}>
            {upcomingMeeting.status}
          </Badge>
          <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase whitespace-nowrap">
            CID: {lead.cid || "N/A"}
          </span>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Date</p>
              <p className="text-[10px] font-black text-slate-800 leading-none">
                {new Date(upcomingMeeting.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Slot</p>
              <p className="text-[10px] font-black text-slate-800 leading-none">{upcomingMeeting.slot}</p>
            </div>
          </div>
        </div>

        {/* Sales Executive */}
        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-slate-100">
              <AvatarImage src={upcomingMeeting.sales_executive?.profile_picture || ""} />
              <AvatarFallback className="text-[8px] bg-slate-100">
                {upcomingMeeting.sales_executive?.name?.charAt(0) || <User className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Assigned SE</p>
              <p className="text-[10px] font-black text-slate-800 leading-none">
                {upcomingMeeting.sales_executive?.name || "Unassigned"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </div>
      </div>

      {upcomingMeeting.visit_charge > 0 && (
        <div className="flex items-center gap-2 px-1">
          <MapPin className="w-3 h-3 text-red-500" />
          <span className="text-[10px] font-bold text-slate-500 italic">
            Visit Charge: <span className="text-slate-700 font-black">৳{upcomingMeeting.visit_charge}</span>
          </span>
        </div>
      )}
    </div>
  );
}
