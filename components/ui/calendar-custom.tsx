"use client";

import * as React from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isWithinInterval,
  isToday
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

export interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date | { from: Date; to?: Date | undefined } | undefined;
  onSelect?: (date: any) => void;
  className?: string;
}

export function Calendar({ mode = "single", selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (day: Date) => {
    if (mode === "single") {
      onSelect?.(day);
    } else if (mode === "range") {
      const range = selected as { from: Date; to?: Date } || { from: undefined, to: undefined };
      if (!range.from || (range.from && range.to)) {
        onSelect?.({ from: day, to: undefined });
      } else {
        if (day < range.from) {
          onSelect?.({ from: day, to: range.from });
        } else {
          onSelect?.({ from: range.from, to: day });
        }
      }
    }
  };

  const isInRange = (day: Date) => {
    if (mode !== "range" || !selected) return false;
    const { from, to } = selected as { from: Date; to?: Date };
    if (from && to) {
      return isWithinInterval(day, { start: from, end: to });
    }
    return false;
  };

  const isRangeStart = (day: Date) => {
    if (mode !== "range" || !selected) return false;
    const { from } = selected as { from: Date; to?: Date };
    return from && isSameDay(day, from);
  };

  const isRangeEnd = (day: Date) => {
    if (mode !== "range" || !selected) return false;
    const { to } = selected as { from: Date; to?: Date };
    return to && isSameDay(day, to);
  };

  return (
    <div className={cn("p-4 bg-white select-none", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-gray-100"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-gray-100"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center items-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const isSelected = mode === "single" 
            ? isSameDay(day, selected as Date) 
            : (isRangeStart(day) || isRangeEnd(day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const inRange = isInRange(day);

          return (
            <div key={idx} className="relative py-0.5">
              <button
                onClick={() => handleDateClick(day)}
                className={cn(
                  "h-8 w-8 text-xs font-semibold rounded-lg transition-all relative z-10",
                  !isCurrentMonth && "text-gray-300",
                  isCurrentMonth && "text-gray-700 hover:bg-gray-100",
                  isToday(day) && !isSelected && "text-[var(--brand-primary)] bg-[var(--brand-primary)]/5",
                  isSelected && "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/20",
                  inRange && !isSelected && "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-none first:rounded-l-lg last:rounded-r-lg"
                )}
              >
                {format(day, "d")}
              </button>
              {inRange && !isSelected && (
                <div className="absolute inset-y-0.5 left-0 right-0 bg-[var(--brand-primary)]/10 z-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
