"use client";

import { cn } from "@/utils/cn";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  // Generate 7 days around the selected date
  const dates = Array.from({ length: 7 }, (_, i) => {
    return addDays(subDays(selectedDate, 3), i);
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-4 bg-white rounded-xl border border-slate-100 px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0">
          <CalendarIcon className="w-5 h-5 text-[var(--brand-primary)]" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Date</p>
          <p className="text-lg font-black text-slate-800">{format(selectedDate, "MMMM d, yyyy")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => onDateChange(subDays(selectedDate, 1))}
          className="h-8 w-8 rounded-full border-slate-200 hover:bg-[var(--brand-primary)] hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateChange(date)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-14 h-14 rounded-xl transition-all duration-200",
                  isSelected 
                    ? "bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20 scale-105" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-white/70" : "text-slate-400")}>
                  {format(date, "EEE")}
                </span>
                <span className="text-sm font-black">
                  {format(date, "d")}
                </span>
              </button>
            );
          })}
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          className="h-8 w-8 rounded-full border-slate-200 hover:bg-[var(--brand-primary)] hover:text-white transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDateChange(new Date())}
        className="text-[var(--brand-primary)] font-bold text-xs"
      >
        Today
      </Button>
    </div>
  );
}
