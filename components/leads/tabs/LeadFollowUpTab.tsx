"use client";

import { Lead } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadFollowUpTabProps {
  lead: Lead;
}

export function LeadFollowUpTab({ lead }: LeadFollowUpTabProps) {
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
          <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
          Sales Follow-ups
        </h3>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 gap-1">
          <Plus className="w-3 h-3" />
          Schedule
        </Button>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-0">
        {lead.follow_ups?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
            <Clock className="w-12 h-12 mb-2" />
            <p className="text-xs font-bold">No follow-ups logged</p>
          </div>
        ) : (
          lead.follow_ups?.map((follow, idx) => {
            const isLast = idx === lead.follow_ups!.length - 1;
            const relatedComment = follow.comment_id 
              ? lead.comments?.find(c => c.id === follow.comment_id)
              : null;

            return (
              <div key={follow.id} className="relative pl-8 pb-8 group">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 group-hover:bg-[var(--brand-primary)]/30 transition-colors" />
                )}
                
                {/* Timeline Dot */}
                <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm group-hover:border-[var(--brand-primary)]/40 transition-colors">
                  {follow.type?.toLowerCase() === "call" ? (
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {follow.type || "Event"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {new Date(follow.time).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0 h-5 gap-1 ${getStatusClass(follow.status)}`}>
                      {getStatusIcon(follow.status)}
                      {follow.status}
                    </Badge>
                  </div>

                  {relatedComment && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 italic">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        "{relatedComment.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
