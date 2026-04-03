"use client";

import { useState } from "react";
import { Lead, User } from "@/lib/types";
import { LeadCard } from "./LeadCard";
import { LeadTable } from "./LeadTable";
import { LeadFilters } from "./LeadFilters";
import { LeadStatusChart } from "./LeadStatusChart";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  List, 
  BarChart3, 
  Users, 
  Download, 
  FileText, 
  Table as TableIcon 
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { CreateLeadDialog } from "./CreateLeadDialog";
import { BatchLeadImportDialog } from "./BatchLeadImportDialog";
import { LeadPagination } from "./LeadPagination";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { downloadSampleCSV, downloadSampleXLSX } from "@/lib/lead-import-utils";

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
          <div className="bg-(--brand-primary)/10 p-2.5 rounded-xl border border-(--brand-primary)/20">
            <Users className="h-6 w-6 text-(--brand-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lead Management</h1>
            <p className="text-sm text-gray-500 font-medium">
              Found {initialData.total} potential customer leads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold shadow-sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Sample Format</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-gray-100">
              <DropdownMenuItem 
                onClick={downloadSampleCSV}
                className="gap-2 py-2.5 cursor-pointer rounded-lg font-medium"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Sample CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={downloadSampleXLSX}
                className="gap-2 py-2.5 cursor-pointer rounded-lg font-medium"
              >
                <TableIcon className="h-4 w-4 text-green-500" />
                Sample XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <BatchLeadImportDialog users={users} />
          
          <CreateLeadDialog users={users} />
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChart(!showChart)}
              className={cn(
                "h-8 gap-2 px-3 rounded-lg text-xs font-bold transition-all",
                showChart ? "bg-white text-(--brand-primary) shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <BarChart3 className={cn("h-3.5 w-3.5", showChart ? "text-(--brand-primary)" : "text-gray-400")} />
               Analytics
            </Button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("grid")}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                view === "grid" ? "bg-white text-(--brand-primary) shadow-sm" : "text-gray-500 hover:text-gray-700"
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
                view === "table" ? "bg-white text-(--brand-primary) shadow-sm" : "text-gray-500 hover:text-gray-700"
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

      <LeadPagination 
        page={page} 
        totalPages={initialData.totalPages} 
        onPageChange={setPage} 
        className="mb-2"
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

      <LeadPagination 
        page={page} 
        totalPages={initialData.totalPages} 
        onPageChange={setPage} 
        className="pt-6 border-t border-gray-100"
      />
    </div>
  );
}
