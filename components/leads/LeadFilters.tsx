"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { format, parseISO, isValid } from "date-fns";
import * as React from "react";

interface LeadFiltersProps {
  statuses: string[];
  sources: string[];
  users: User[];
}

export function LeadFilters({ statuses, sources, users }: LeadFiltersProps) {
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault("").withOptions({ shallow: false }));
  const [localSearch, setLocalSearch] = React.useState(search);
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [source, setSource] = useQueryState("source", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [creId, setCreId] = useQueryState("creId", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [salesId, setSalesId] = useQueryState("salesId", parseAsString.withDefault("all").withOptions({ shallow: false }));
  
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
    setStatus("all");
    setSource("all");
    setCreId("all");
    setSalesId("all");
    setStartDate(null);
    setEndDate(null);
  };

  const hasFilters = !!(search || (status && status !== "all") || (source && source !== "all") || (creId && creId !== "all") || (salesId && salesId !== "all") || startDate || endDate);

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
            <Search className="h-4 w-4 text-gray-400 group-hover/search:text-[var(--brand-primary)]" />
          </button>
          <Input
            placeholder="Search by name, phone, CID or address..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-11 pr-10 h-10 border-gray-200 rounded-xl focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)]/30 transition-all font-bold placeholder:text-gray-400"
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

        {/* Status */}
        <Select value={status} onValueChange={(val) => setStatus(val)}>
          <SelectTrigger className="w-35 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="rounded-xl">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {/* CRE */}
        <Select value={creId} onValueChange={(val) => setCreId(val)}>
          <SelectTrigger className="w-40 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
            <SelectValue placeholder="Assigned CRE" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
            <SelectItem value="all">All CREs</SelectItem>
            {users.map((u: User) => (
              <SelectItem key={u.id} value={u.id} className="rounded-xl">{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sales */}
        <Select value={salesId} onValueChange={(val) => setSalesId(val)}>
          <SelectTrigger className="w-40 h-10 border-gray-200 rounded-xl text-xs font-bold text-gray-700">
            <SelectValue placeholder="Sales Rep" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-2xl border-gray-100">
            <SelectItem value="all">All Sales</SelectItem>
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
