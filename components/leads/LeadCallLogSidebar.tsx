"use client";

import { Lead, LeadCallLog } from "@/lib/types";
import { useState, useTransition } from "react";
import { addCallLog } from "@/app/actions/leads";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOutgoing, PhoneIncoming, PhoneMissed, Clock, Plus, PhoneCall, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadCallLogSidebarProps {
  lead: Lead;
}

export function LeadCallLogSidebar({ lead }: LeadCallLogSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const getCallIcon = (type: string, status: string) => {
    if (status === "Missed") return <PhoneMissed className="w-3.5 h-3.5 text-red-500" />;
    return type === "Outgoing" 
      ? <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" /> 
      : <PhoneIncoming className="w-3.5 h-3.5 text-green-500" />;
  };

  const handleAddCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await addCallLog({
        lead_id: lead.id,
        recipient_number: formData.get("recipient") as string,
        call_type: formData.get("type") as string,
        status: formData.get("status") as string,
        call_duration: formData.get("duration") as string,
        timestamp: new Date().toISOString(),
      });

      if (result.success) {
        toast.success("Call log saved");
        setIsAdding(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Toggle */}
      {!isAdding ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-9 border-dashed border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 text-slate-500 hover:text-blue-600 gap-2 font-bold text-xs transition-all"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Log Manual Call
        </Button>
      ) : (
        <form onSubmit={handleAddCall} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
              <PhoneCall className="w-3 h-3" />
              Log Call Details
            </h4>
            <button type="button" onClick={() => setIsAdding(false)} className="text-blue-400 hover:text-blue-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Input name="recipient" placeholder="Number" defaultValue={lead.phones[0]} className="h-8 text-[10px] bg-white border-blue-100 focus-visible:ring-blue-200" required />
            <Input name="duration" placeholder="Duration (e.g. 2m 30s)" className="h-8 text-[10px] bg-white border-blue-100 focus-visible:ring-blue-200" />
          </div>

          <div className="flex gap-2">
            <select name="type" className="flex-1 h-8 rounded-md border border-blue-100 bg-white text-[10px] px-2 outline-none focus:ring-1 focus:ring-blue-200">
              <option value="Outgoing">Outgoing</option>
              <option value="Incoming">Incoming</option>
            </select>
            <select name="status" className="flex-1 h-8 rounded-md border border-blue-100 bg-white text-[10px] px-2 outline-none focus:ring-1 focus:ring-blue-200">
              <option value="Connected">Connected</option>
              <option value="Missed">Missed</option>
              <option value="Busy">Busy</option>
            </select>
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] gap-2">
            {isPending ? "Saving..." : <><Send className="w-3 h-3" /> Save Log</>}
          </Button>
        </form>
      )}

      {/* Recent Activity List */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Activity</label>
        {lead.call_logs && lead.call_logs.length > 0 ? (
          <div className="space-y-1.5">
            {lead.call_logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-50 hover:border-slate-100 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {getCallIcon(log.call_type, log.status)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 tracking-tight leading-none mb-0.5">{log.recipient_number}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                      {log.call_type} • {log.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 mb-0.5">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-600 tracking-tighter">{log.call_duration || "0s"}</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-[10px] font-bold text-slate-400 italic">No communication logs</p>
          </div>
        )}
      </div>
    </div>
  );
}
