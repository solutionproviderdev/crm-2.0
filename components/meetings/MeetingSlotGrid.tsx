"use client";

import { User, MeetingSlot, LeadMeeting } from "@/lib/types";
import { Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

interface MeetingSlotGridProps {
  slots: MeetingSlot[];
  salesTeams: User[];
  existingMeetings: LeadMeeting[];
  loading: boolean;
  selectedSalesId: string;
  selectedSlotText: string;
  onSelect: (salesId: string, slotText: string) => void;
  excludeUserId?: string;
}

export function MeetingSlotGrid({
  slots,
  salesTeams,
  existingMeetings,
  loading,
  selectedSalesId,
  selectedSlotText,
  onSelect,
  excludeUserId
}: MeetingSlotGridProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-max">
          <div className="flex bg-slate-50 border-b border-slate-200">
            <div className="w-24 shrink-0 p-2 text-[10px] font-black text-slate-400 uppercase border-r border-slate-200 flex items-center justify-center">
              Executive
            </div>
            {slots.map(s => (
              <div key={s.id} className="w-20 shrink-0 p-2 text-[10px] font-black text-slate-500 text-center border-r border-slate-100 last:border-r-0">
                {s.slot_text}
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            {loading ? (
              <div className="h-40 flex items-center justify-center bg-slate-50/50">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-primary)]" />
              </div>
            ) : (
              salesTeams
                .filter(u => u.id !== excludeUserId)
                .map((person) => (
                <div key={person.id} className="flex border-b border-slate-100 last:border-b-0 group">
                  <div className="w-24 shrink-0 p-2 bg-slate-50/50 border-r border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center mb-1 ring-1 ring-[var(--brand-primary)]/20 overflow-hidden">
                      {person.profile_picture ? (
                        <img src={person.profile_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--brand-primary)]">{person.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 truncate w-full px-1">
                      {person.nickname || person.name.split(' ')[0]}
                    </span>
                  </div>
                  {slots.map((slot) => {
                    const meeting = existingMeetings.find(
                      m => m.sales_executive_id === person.id && m.slot === slot.slot_text
                    );
                    const isSelected = selectedSalesId === person.id && selectedSlotText === slot.slot_text;

                    if (meeting) {
                      return (
                        <div key={slot.id} className="w-20 shrink-0 h-14 bg-red-50 flex items-center justify-center border-r border-slate-50 last:border-r-0">
                          <Badge variant="outline" className="text-[8px] font-black bg-white text-red-600 border-red-200 px-1 py-0 h-4">BOOKED</Badge>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSelect(person.id, slot.slot_text)}
                        className={cn(
                          "w-20 shrink-0 h-14 border-r border-slate-50 last:border-r-0 transition-all flex items-center justify-center group/cell",
                          isSelected 
                            ? "bg-[var(--brand-primary)] shadow-inner" 
                            : "bg-white hover:bg-slate-50"
                        )}
                      >
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-200 group-hover/cell:border-[var(--brand-primary)]/40 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
