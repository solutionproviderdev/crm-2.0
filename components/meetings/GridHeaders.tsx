"use client";

import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SalesTeamColumnProps {
  salespeople: User[];
}

export function SalesTeamColumn({ salespeople }: SalesTeamColumnProps) {
  return (
    <div className="flex flex-col w-48 shrink-0 bg-slate-50 border-r border-slate-200">
      {/* Header Spacer */}
      <div className="h-16 flex items-center justify-center bg-white border-b border-slate-200 sticky top-0 z-20">
        <span className="text-xs font-black uppercase text-slate-400 tracking-widest px-4 text-center">Personnel Schedule</span>
      </div>
      
      {/* Salespeople Rows */}
      <div className="divide-y divide-slate-100">
        {salespeople.map((person) => (
          <div 
            key={person.id} 
            className="h-32 flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50/50 transition-colors group"
          >
            <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-[var(--brand-primary)]/20 transition-all duration-300">
              <AvatarImage src={person.profile_picture || ""} />
              <AvatarFallback className="bg-slate-100 text-[var(--brand-primary)] font-bold text-xs uppercase">
                {person.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-2 text-center overflow-hidden w-full">
              <p className="text-sm font-black text-slate-800 truncate">{person.nickname || person.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {person.role?.name || "Executive"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimeSlotsHeaderProps {
  timeSlots: string[];
}

export function TimeSlotsHeader({ timeSlots }: TimeSlotsHeaderProps) {
  return (
    <div className="flex h-16 bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
      {timeSlots.map((slot) => (
        <div 
          key={slot} 
          className="flex-1 min-w-50 flex items-center justify-center border-r border-slate-100 last:border-r-0 hover:bg-slate-50/50 transition-colors"
        >
          <div className="px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 uppercase tabular-nums">{slot}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
