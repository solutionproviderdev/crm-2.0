"use client";

import { Lead } from "@/lib/types";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Clock,
  Phone
} from "lucide-react";

interface LeadCallLogTabProps {
  lead: Lead;
}

export function LeadCallLogTab({ lead }: LeadCallLogTabProps) {
  const getCallIcon = (type: string, status: string) => {
    if (type === "Outgoing") {
      return status === "Missed" 
        ? <PhoneMissed className="w-4 h-4 text-red-500" />
        : <PhoneOutgoing className="w-4 h-4 text-[var(--brand-primary)]" />;
    }
    return status === "Missed"
      ? <PhoneMissed className="w-4 h-4 text-red-500" />
      : <PhoneIncoming className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b shrink-0 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-[var(--brand-primary)]" />
          Communication Logs
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {lead.call_logs?.length || 0} Total
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {lead.call_logs?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
            <Phone className="w-12 h-12 mb-2" />
            <p className="text-xs font-bold">No call history</p>
          </div>
        ) : (
          lead.call_logs?.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[var(--brand-primary)]/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    {getCallIcon(log.call_type, log.status)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 tracking-tight">{log.recipient_number}</p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {log.call_type} • {log.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5 text-[var(--brand-primary)]">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-black">{log.call_duration || "0s"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
