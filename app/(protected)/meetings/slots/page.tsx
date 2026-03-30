"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMeetingSlots,
  getSalesTeamMembers,
  getMeetingsByDate,
  getMeetingsByDateRange,
  getAllActiveUsers,
} from "@/app/actions/leads";
import { createClient } from "@/utils/supabase/client";
import { MeetingSlot, User, LeadMeeting } from "@/lib/types";
import { DateSelector } from "@/components/meetings/DateSelector";
import { MeetingGrid } from "@/components/meetings/MeetingGrid";
import { MeetingListView } from "@/components/meetings/MeetingListView";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Calendar,
  LayoutGrid,
  List,
  AlertCircle,
  Filter,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingListSkeleton, MeetingGridSkeleton } from "@/components/meetings/MeetingSkeletons";

const MEETING_STATUSES = ["Fixed", "Rescheduled", "Postponed", "Canceled", "Complete", "Sold", "Follow-up Scheduled"];

const STATUS_COLORS: Record<string, string> = {
  Fixed: "bg-[#82b1c4]/20 text-[#046288]",
  Rescheduled: "bg-orange-100 text-orange-700",
  Postponed: "bg-red-100 text-red-600",
  Canceled: "bg-red-200 text-red-800",
  Complete: "bg-teal-100 text-teal-700",
  Sold: "bg-green-100 text-green-700",
  "Follow-up Scheduled": "bg-blue-100 text-blue-700",
};

export default function MeetingSlotsPage() {
  // ── Grid view: single date ──────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ── List view: date range + filters ────────────
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSales, setFilterSales] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [data, setData] = useState<{
    slots: MeetingSlot[];
    salespeople: User[];
    meetings: LeadMeeting[];
    allUsers: User[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync local search when global search is cleared
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const handleSearchTrigger = (val: string) => {
    setIsLoading(true);
    setSearchTerm(val);
    // Brief delay to ensure skeleton is visible for feedback
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchTrigger(localSearch);
    }
  };

  const clearSearch = () => {
    setLocalSearch("");
    handleSearchTrigger("");
  };

  const fetchGrid = useCallback(async () => {
    setIsLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    const [slotsRes, salesRes, meetingsRes, usersRes] = await Promise.all([
      getMeetingSlots(),
      getSalesTeamMembers(),
      getMeetingsByDate(formattedDate),
      getAllActiveUsers(),
    ]);

    if (slotsRes.success && salesRes.success && meetingsRes.success && usersRes.success) {
      setData({
        slots: slotsRes.data,
        salespeople: salesRes.data,
        meetings: meetingsRes.data,
        allUsers: usersRes.data,
      });
    } else {
      // If any part fails or returns success: false, reset meetings to avoid stale data
      setData(prev => prev ? { ...prev, meetings: [] } : null);
    }
    setIsLoading(false);
  }, [selectedDate]);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const startDateStr = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
    const endDateStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "";

    const [slotsRes, salesRes, meetingsRes, usersRes] = await Promise.all([
      getMeetingSlots(),
      getSalesTeamMembers(),
      getMeetingsByDateRange({ 
        startDate: startDateStr, 
        endDate: endDateStr,
        status: filterStatus || undefined,
        salesExecutiveId: filterSales || undefined,
      }),
      getAllActiveUsers(),
    ]);

    if (slotsRes.success && salesRes.success && meetingsRes.success && usersRes.success) {
      setData({
        slots: slotsRes.data,
        salespeople: salesRes.data,
        meetings: meetingsRes.data,
        allUsers: usersRes.data,
      });
    } else {
      // Reset on fail
      setData(prev => prev ? { ...prev, meetings: [] } : null);
    }
    setIsLoading(false);
  }, [dateRange, filterStatus, filterSales]);

  // Fetch on view mode change / filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === "grid") {
        fetchGrid();
      } else {
        fetchList();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [viewMode, fetchGrid, fetchList]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("meetings_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_meetings" }, () => {
        if (viewMode === "grid") fetchGrid();
        else fetchList();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [viewMode, fetchGrid, fetchList]);

  // List View specific calculations
  const listMeetings = data?.meetings ?? [];
  const filteredListMeetings = listMeetings.filter(m => {
    if (viewMode !== "list" || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const phoneList = (m.lead as { phones?: string[] })?.phones ?? [];
    return (
      m.lead?.name?.toLowerCase().includes(term) ||
      m.lead?.cid?.toLowerCase().includes(term) ||
      phoneList.some(p => p.toLowerCase().includes(term))
    );
  });

  const listFinance = {
    Complete: { count: 0, projValue: 0 },
    QuotationSent: { count: 0, projValue: 0 },
    Prospect: { count: 0, projValue: 0 },
    Sold: { count: 0, soldValue: 0 },
    Lost: { count: 0, projValue: 0 },
  };
  const totalPaidSum = 0;
  const totalDueSum = 0;

  if (viewMode === "list") {
    filteredListMeetings.forEach(m => {
      const status = m.status;
      if (status === "Complete" || status === "Meeting Complete") {
        listFinance.Complete.count++;
      } else if (status === "Quotation Sent" || status === "Quotation Send") {
        listFinance.QuotationSent.count++;
      } else if (status === "Prospect") {
        listFinance.Prospect.count++;
      } else if (status === "Sold") {
        listFinance.Sold.count++;
      } else if (status === "Lost") {
        listFinance.Lost.count++;
      }
    });
  }

  const hasListFilters = filterStatus || filterSales || searchTerm;

  const clearListFilters = () => {
    setFilterStatus("");
    setFilterSales("");
    setLocalSearch("");
    setSearchTerm("");
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen bg-slate-50/50">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#046288] flex items-center justify-center shadow-lg shadow-[#046288]/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Meeting Slots</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Team Scheduling & Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "list")}
            className="bg-white border rounded-xl p-1 shadow-sm"
          >
            <TabsList className="bg-transparent border-none">
              <TabsTrigger
                value="grid"
                className="data-[state=active]:bg-[#046288] data-[state=active]:text-white rounded-lg px-4 gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-xs font-bold">Grid</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-[#046288] data-[state=active]:text-white rounded-lg px-4 gap-2"
              >
                <List className="w-4 h-4" />
                <span className="text-xs font-bold">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {data && <CreateMeetingDialog />}
        </div>
      </div>

      {/* ── Grid: Date Selector ──────────────────── */}
      {viewMode === "grid" && (
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}

      {/* ── List: Summary Stats ──────────────────── */}
      {viewMode === "list" && (
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Meeting Complete</p>
            <p className="mt-1 text-xl font-black text-[#046288]">৳{listFinance.Complete.projValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Quotation Sent</p>
            <p className="mt-1 text-xl font-black text-[#046288]">৳{listFinance.QuotationSent.projValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Prospect</p>
            <p className="mt-1 text-xl font-black text-[#046288]">৳{listFinance.Prospect.projValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Sold</p>
            <p className="mt-1 text-xl font-black text-emerald-600">৳{listFinance.Sold.soldValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Lost</p>
            <p className="mt-1 text-xl font-black text-[#046288]">৳{listFinance.Lost.projValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Total Paid</p>
            <p className="mt-1 text-xl font-black text-emerald-700">৳{(totalPaidSum || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Total Due</p>
            <p className="mt-1 text-xl font-black text-red-600">৳{(totalDueSum || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* ── List: Date Range + Filters ───────────── */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </div>

              {/* Date range */}
              <DateRangePicker 
                value={dateRange}
                onChange={setDateRange}
              />

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#046288]/20 focus:border-[#046288]/30"
              >
                <option value="">All Statuses</option>
                {MEETING_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Sales filter */}
              <select
                value={filterSales}
                onChange={(e) => setFilterSales(e.target.value)}
                className="h-10 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#046288]/20 focus:border-[#046288]/30"
              >
                <option value="">All Sales</option>
                {data?.salespeople.map((u) => (
                  <option key={u.id} value={u.id}>{u.nickname ?? u.name}</option>
                ))}
              </select>

              {/* Status summary badges */}
              {filterStatus && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${STATUS_COLORS[filterStatus] ?? ""}`}>
                  {filterStatus}
                </span>
              )}

              {/* Clear */}
              {hasListFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearListFilters}
                  className="h-9 gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 rounded-xl"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* Search and Results */}
            <div className="flex items-center gap-4 w-full xl:w-auto">
              {data && (
                <span className="text-xs font-black text-slate-400 shrink-0 hidden sm:inline-block">
                  {filteredListMeetings.length} meeting{filteredListMeetings.length !== 1 ? "s" : ""}
                </span>
              )}
              <div className="relative w-full xl:w-80 group/search">
                <button
                  type="button"
                  onClick={() => handleSearchTrigger(localSearch)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 hover:bg-slate-100 rounded-lg transition-colors z-10"
                >
                  <Search className="w-4 h-4 text-slate-400 group-focus-within/search:text-[#046288]" />
                </button>
                <input
                  type="search"
                  placeholder="Search lead or phone..."
                  className="w-full h-10 pl-11 pr-10 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-[#046288]/20 focus:border-[#046288]/30 transition-all placeholder:text-slate-400/70 placeholder:font-medium"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────── */}
      <div className="flex-1 relative min-h-96">
        {isLoading ? (
          <div className="animate-in fade-in duration-300">
            {viewMode === "grid" ? <MeetingGridSkeleton /> : <MeetingListSkeleton />}
          </div>
        ) : data ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {viewMode === "grid" ? (
              <MeetingGrid
                timeSlots={data.slots}
                salespeople={data.salespeople}
                initialMeetings={data.meetings}
                selectedDate={format(selectedDate, "yyyy-MM-dd")}
              />
            ) : (
              <MeetingListView meetings={filteredListMeetings} />
            )}
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-sm font-bold text-slate-400">Unable to load scheduling data</p>
            <Button
              variant="link"
              onClick={() => viewMode === "grid" ? fetchGrid() : fetchList()}
              className="text-[#046288] font-bold mt-2"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
