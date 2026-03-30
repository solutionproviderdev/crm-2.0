"use client";

import { useState } from "react";
import { Lead, User } from "@/lib/types";
import { LeadCard } from "./LeadCard";
import { LeadTable } from "./LeadTable";
import { LeadFilters } from "./LeadFilters";
import { LeadStatusChart } from "./LeadStatusChart";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, BarChart3, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { CreateLeadDialog } from "./CreateLeadDialog";

interface LeadsPageContentProps {
  initialData: {
    leads: Lead[];
    total: number;
    totalPages: number;
    filters: {
      statuses: string[];
      sources: string[];
    };
    /** True global counts per status — from getLeadStatusCounts(), not page-scoped */
    statusCounts: { status: string; count: number }[];
  };
  /** All active users, used for both CRE and Sales assignment dropdowns */
  users: User[];
}

export function LeadsPageContent({ initialData, users }: LeadsPageContentProps) {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [showChart, setShowChart] = useState(true);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1).withOptions({ shallow: false }));
  const [sortBy, setSortBy] = useQueryState("sortBy", parseAsString.withDefault("created_at").withOptions({ shallow: false }));
  const [order, setOrder] = useQueryState("order", parseAsString.withDefault("desc").withOptions({ shallow: false }));

  // Use globally-accurate status counts (not page-scoped counts)
  const chartData = initialData.statusCounts;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setOrder("desc");
    }
    setPage(1); // Reset to first page on sort
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--brand-primary)]/10 p-2.5 rounded-xl border border-[var(--brand-primary)]/20">
            <Users className="h-6 w-6 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lead Management</h1>
            <p className="text-sm text-gray-500 font-medium">
              Found {initialData.total} potential customer leads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreateLeadDialog users={users} />
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChart(!showChart)}
              className={cn(
                "h-8 gap-2 px-3 rounded-lg text-xs font-bold transition-all",
                showChart ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <BarChart3 className={cn("h-3.5 w-3.5", showChart ? "text-[var(--brand-primary)]" : "text-gray-400")} />
               Analytics
            </Button>
            <div className="w-[1px] h-4 bg-gray-200 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("grid")}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                view === "grid" ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("table")}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                view === "table" ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showChart && <LeadStatusChart data={chartData} />}

      <LeadFilters 
        statuses={initialData.filters.statuses} 
        sources={initialData.filters.sources}
        users={users}
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialData.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {initialData.leads.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
               <p className="text-gray-500 font-medium">No leads found matching your criteria</p>
            </div>
          )}
        </div>
      ) : (
        <LeadTable 
          leads={initialData.leads} 
          sortBy={sortBy}
          sortOrder={order as "asc" | "desc"}
          onSort={handleSort}
          users={users}
        />
      )}

      {/* Pagination */}
      {initialData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Page {page} of {initialData.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-9 w-9 p-0 rounded-lg border-gray-200 hover:bg-gray-50 text-[var(--brand-primary)] disabled:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= initialData.totalPages}
              onClick={() => setPage(page + 1)}
              className="h-9 w-9 p-0 rounded-lg border-gray-200 hover:bg-gray-50 text-[var(--brand-primary)] disabled:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
