"use client";

import { LeadMeeting } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MeetingListProps {
  meetings: LeadMeeting[];
  leadId: string;
}

export function MeetingList({ meetings, leadId }: MeetingListProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "complete": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "fixed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "canceled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Meetings & Visits</CardTitle>
            <p className="text-xs text-slate-500">History of site visits and assessments</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-xs border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 gap-2">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {meetings.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No meetings scheduled yet</p>
            <p className="text-xs text-slate-400 mt-1">Schedule a visit to track lead progress</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-[var(--brand-primary)]">
                        {new Date(meeting.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        {new Date(meeting.date).getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">{meeting.slot}</span>
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0 ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{meeting.sales_executive?.name || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>{meeting.meeting_flow_status || "Pending"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {meeting.visit_charge > 0 && (
                      <span className="text-sm font-bold text-[var(--brand-primary)]">
                        ৳{meeting.visit_charge.toLocaleString()}
                      </span>
                    )}
                    <Avatar className="w-6 h-6 border">
                      <AvatarImage src={meeting.sales_executive?.profile_picture || ""} />
                      <AvatarFallback className="text-[8px]">{meeting.sales_executive?.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
