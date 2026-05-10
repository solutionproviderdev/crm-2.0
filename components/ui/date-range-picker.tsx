"use client";

import * as React from "react";
import { format, subDays, startOfToday, endOfToday, startOfYesterday, endOfYesterday, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "./calendar-custom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    { label: "Today", getValue: () => ({ from: startOfToday(), to: endOfToday() }) },
    { label: "Yesterday", getValue: () => ({ from: startOfYesterday(), to: endOfYesterday() }) },
    { label: "Last 7 Days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "Last 30 Days", getValue: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
    { label: "All Time", getValue: () => ({ from: undefined, to: undefined }) },
  ];

  const handleSelect = (range: Date | DateRange) => {
    if (range instanceof Date) {
      onChange({ from: range, to: undefined });
      return;
    }
    onChange(range);
    if (range?.from && range?.to) {
      // Don't close immediately if range is being selected, but we could if we want
    }
  };

  const displayText = value?.from ? (
    value.to ? (
      <>
        {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
      </>
    ) : (
      format(value.from, "LLL dd, y")
    )
  ) : (
    <span>{placeholder}</span>
  );

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-10 px-4 justify-start text-left font-bold rounded-xl hover:border-[var(--brand-primary)]/30 transition-all shadow-sm group",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-[var(--brand-primary)] transition-colors" />
            <span className="text-xs truncate">{displayText}</span>
            <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl bg-popover/95 backdrop-blur-md flex overflow-hidden lg:flex-row flex-col" align="start">
          {/* Presets Sidebar */}
          <div className="w-full lg:w-44 border-b lg:border-b-0 lg:border-r border-border p-2 bg-muted/50">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-2">Quick Select</p>
             <div className="space-y-1">
               {presets.map((preset) => (
                 <button
                   key={preset.label}
                   onClick={() => {
                     onChange(preset.getValue());
                     setIsOpen(false);
                   }}
                   className="w-full text-left px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] rounded-xl transition-all flex items-center justify-between group"
                 >
                   {preset.label}
                   <Check className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
               ))}
             </div>
          </div>

          <div className="p-1">
            <Calendar
              mode="range"
              selected={value}
              onSelect={handleSelect}
            />
            <div className="p-3 border-t border-border flex justify-end gap-2 bg-card">
               <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold rounded-lg text-muted-foreground"
                onClick={() => {
                  onChange({ from: undefined, to: undefined });
                  setIsOpen(false);
                }}
               >
                 Reset
               </Button>
               <Button 
                size="sm" 
                className="text-xs font-bold rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
                onClick={() => setIsOpen(false)}
               >
                 Apply
               </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
