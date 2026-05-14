"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/utils/cn";
import * as React from "react";

interface LeadFiltersProps {
  statuses: string[];
  sources: string[];
  users: User[];
}

export function LeadFilters({ statuses, sources, users }: LeadFiltersProps) {
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault("").withOptions({ shallow: false }));
  const [localSearch, setLocalSearch] = React.useState(search);
  // status stores comma-separated values e.g. "Fresh,Contacted" — empty = all
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("").withOptions({ shallow: false }));
  const [source, setSource] = useQueryState("source", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [ownerId, setOwnerId] = useQueryState("ownerId", parseAsString.withDefault("all").withOptions({ shallow: false }));

  // Sync local search when URL state changes
  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Date Range States
  const [startDate, setStartDate] = useQueryState("startDate", parseAsString.withOptions({ shallow: false }));
  const [endDate, setEndDate] = useQueryState("endDate", parseAsString.withOptions({ shallow: false }));

  const dateRange: DateRange = React.useMemo(() => {
    const from = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : undefined;
    const to = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : undefined;
    return { from, to };
  }, [startDate, endDate]);

  const handleDateChange = (range: DateRange) => {
    setStartDate(range?.from ? format(range.from, "yyyy-MM-dd") : null);
    setEndDate(range?.to ? format(range.to, "yyyy-MM-dd") : null);
  };

  const handleSearch = () => {
    setSearch(localSearch || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setLocalSearch("");
    setSearch(null);
  };

  const clearFilters = () => {
    clearSearch();
    setStatus("");
    setSource("all");
    setOwnerId("all");
    setStartDate(null);
    setEndDate(null);
  };

  const hasFilters = !!(search || (status && status.length > 0) || (source && source !== "all") || (ownerId && ownerId !== "all") || startDate || endDate);

  return (
    <div className="flex flex-col gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-75 group/search">
          <button
            type="button"
            onClick={handleSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors z-10"
          >
            <Search className="h-4 w-4 text-gray-400 group-hover/search:text-(--brand-primary)" />
          </button>
          <Input
            placeholder="Search by name, phone, CID or address..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-11 pr-10 h-10 border-gray-200 rounded-xl focus:ring-(--brand-primary)/10 focus:border-(--brand-primary)/30 transition-all font-bold placeholder:text-gray-400"
          />
          {localSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Date Range Picker */}
        <DateRangePicker
          value={dateRange}
          onChange={handleDateChange}
          placeholder="Filter by Date..."
          className="min-w-60"
        />

        {/* Status — multi-select */}
        <StatusMultiSelect
          statuses={statuses}
          value={status}
          onChange={(v) => setStatus(v || null)}
        />

        {/* Source */}
        <Select value={source} onValueChange={(val) => setSource(val)}>
          <SelectTrigger className="w-35 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s} className="rounded-xl">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assigned Owner */}
        <Select value={ownerId} onValueChange={(val) => setOwnerId(val)}>
          <SelectTrigger className="w-40 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
            <SelectValue placeholder="Assigned Owner" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
            <SelectItem value="all">All Owners</SelectItem>
            {users.map((u: User) => (
              <SelectItem key={u.id} value={u.id} className="rounded-xl">{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-red-600 h-10 gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── StatusMultiSelect ────────────────────────────────────────────────────────

interface StatusMultiSelectProps {
  statuses: string[];
  value: string; // comma-separated selected values, empty = all
  onChange: (value: string) => void;
}

function StatusMultiSelect({ statuses, value, onChange }: StatusMultiSelectProps) {
  const selected = React.useMemo(
    () => (value ? value.split(",").filter(Boolean) : []),
    [value]
  );

  const toggle = (s: string) => {
    const next = selected.includes(s)
      ? selected.filter((x) => x !== s)
      : [...selected, s];
    onChange(next.join(","));
  };

  const label = React.useMemo(() => {
    if (selected.length === 0) return "All Statuses";
    if (selected.length <= 2) return selected.join(", ");
    return `${selected.length} statuses`;
  }, [selected]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 min-w-35 px-3 flex items-center justify-between gap-2 rounded-xl border text-xs font-bold bg-white hover:bg-gray-50 transition-colors",
            selected.length > 0
              ? "border-[var(--brand-primary)]/40 text-[var(--brand-primary)]"
              : "border-gray-200 text-gray-700"
          )}
        >
          <span className="truncate max-w-40">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 rounded-2xl shadow-2xl border-gray-100" align="start">
        {/* All / clear option */}
        <div
          onClick={() => onChange("")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-bold transition-colors",
            selected.length === 0
              ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
              : "text-gray-500 hover:bg-slate-50"
          )}
        >
          <div className={cn(
            "w-4 h-4 rounded border flex items-center justify-center",
            selected.length === 0 ? "bg-[var(--brand-primary)] border-[var(--brand-primary)]" : "border-gray-300"
          )}>
            {selected.length === 0 && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
          All Statuses
        </div>

        <div className="my-1 h-px bg-gray-100" />

        {/* Individual statuses */}
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {statuses.map((s) => {
            const checked = selected.includes(s);
            return (
              <div
                key={s}
                onClick={() => toggle(s)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-bold transition-colors",
                  checked
                    ? "bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]"
                    : "text-gray-700 hover:bg-slate-50"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(s)}
                  className="pointer-events-none"
                />
                <span className="truncate">{s}</span>
              </div>
            );
          })}
        </div>

        {selected.length > 0 && (
          <>
            <div className="my-1 h-px bg-gray-100" />
            <div
              onClick={() => onChange("")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear selection
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
