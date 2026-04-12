"use client";

import { useQueryState, parseAsString } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { X, SlidersHorizontal, LayoutGrid, Columns } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import type { User } from "@/lib/types";
import * as React from "react";
import { cn } from "@/utils/cn";

interface PipelineFiltersProps {
  /** Ordered stage list for the status dropdown — scoped to this pipeline only */
  stages: readonly string[];
  /** All active users for CRE/Sales dropdowns — only shown to admin */
  users: User[];
  /** When false, hides CRE/Sales dropdowns to prevent data exposure */
  isAdmin: boolean;
}

export function PipelineFilters({ stages, users, isAdmin }: PipelineFiltersProps) {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all").withOptions({ shallow: false })
  );
  const [layout, setLayout] = useQueryState(
    "layout",
    parseAsString.withDefault("kanban").withOptions({ shallow: false })
  );
  const [creId, setCreId] = useQueryState(
    "creId",
    parseAsString.withDefault("all").withOptions({ shallow: false })
  );
  const [salesId, setSalesId] = useQueryState(
    "salesId",
    parseAsString.withDefault("all").withOptions({ shallow: false })
  );
  const [startDate, setStartDate] = useQueryState(
    "startDate",
    parseAsString.withOptions({ shallow: false })
  );
  const [endDate, setEndDate] = useQueryState(
    "endDate",
    parseAsString.withOptions({ shallow: false })
  );

  const dateRange: DateRange = React.useMemo(() => {
    const from = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : undefined;
    const to = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : undefined;
    return { from, to };
  }, [startDate, endDate]);

  const handleDateChange = (range: DateRange) => {
    setStartDate(range?.from ? format(range.from, "yyyy-MM-dd") : null);
    setEndDate(range?.to ? format(range.to, "yyyy-MM-dd") : null);
  };

  const clearFilters = () => {
    setStatus("all");
    setCreId("all");
    setSalesId("all");
    setStartDate(null);
    setEndDate(null);
  };

  const hasFilters = !!(
    (status && status !== "all") ||
    (creId && creId !== "all") ||
    (salesId && salesId !== "all") ||
    startDate ||
    endDate
  );

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-1.5 text-gray-400 mr-1">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
      </div>

      {/* Date Range */}
      <DateRangePicker
        value={dateRange}
        onChange={handleDateChange}
        placeholder="Date range..."
        className="min-w-52"
      />

      {/* Status — scoped to pipeline stages only */}
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-44 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
          <SelectValue placeholder="All Stages" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
          <SelectItem value="all">All Stages</SelectItem>
          {stages.map((s) => (
            <SelectItem key={s} value={s} className="rounded-xl">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* CRE & Sales dropdowns — admin only */}
      {isAdmin && (
        <>
          <Select value={creId} onValueChange={setCreId}>
            <SelectTrigger className="w-40 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
              <SelectValue placeholder="CRE" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
              <SelectItem value="all">All CREs</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id} className="rounded-xl">
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={salesId} onValueChange={setSalesId}>
            <SelectTrigger className="w-40 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
              <SelectValue placeholder="Sales Rep" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
              <SelectItem value="all">All Sales</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id} className="rounded-xl">
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-400 hover:text-red-500 h-10 gap-1.5 text-xs ml-2"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      {/* Spacer to push view toggles to the right if there's room */}
      <div className="flex-1" />

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
        <button
          type="button"
          onClick={() => setLayout("kanban")}
          className={cn(
            "p-2 rounded-lg transition-all flex items-center justify-center",
            layout === "kanban" 
              ? "bg-white shadow-xs text-(--brand-primary) border border-gray-100/50" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
          )}
          title="Kanban View"
        >
          <Columns className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setLayout("grid")}
          className={cn(
            "p-2 rounded-lg transition-all flex items-center justify-center",
            layout === "grid" 
              ? "bg-white shadow-xs text-(--brand-primary) border border-gray-100/50" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
          )}
          title="Grid View"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
