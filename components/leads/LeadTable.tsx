"use client";

import { Lead, User } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  MoreVertical, 
  ChevronDown, 
  Columns, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  Briefcase,
  X,
  CheckCircle2,
  Loader2,
  SearchX
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { bulkAssignLeads } from "@/app/actions/leads";
import { toast } from "sonner";
import { UserSelect } from "./UserSelect";

interface LeadTableProps {
  leads: Lead[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  users: User[];
}

const ALL_COLUMNS = [
  { id: "lead", label: "Lead", sortable: true, field: "name" },
  { id: "status", label: "Status", sortable: true, field: "status" },
  { id: "team", label: "Team", sortable: false },
  { id: "source", label: "Source", sortable: true, field: "source" },
  { id: "joined", label: "Joined", sortable: true, field: "created_at" },
  { id: "contact", label: "Contact", sortable: false },
  { id: "address", label: "Address", sortable: false },
];

export function LeadTable({ leads, sortBy, sortOrder, onSort, users }: LeadTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["lead", "status", "team", "source", "joined", "contact"]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedLeads.length === leads.length && leads.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const handleBulkAssign = async (userId: string, type: 'cre' | 'sales') => {
    setIsAssigning(true);
    const toastId = toast.loading(`Assigning ${selectedLeads.length} leads...`);
    
    try {
      const result = await bulkAssignLeads(selectedLeads, userId, type);
      if (result.success) {
        toast.success(`Successfully assigned ${selectedLeads.length} leads`, { id: toastId });
        setSelectedLeads([]);
      } else {
        toast.error(`Failed to assign leads: ${result.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsAssigning(false);
    }
  };

  const SortIcon = ({ colField }: { colField?: string }) => {
    if (!colField || sortBy !== colField) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />;
    return sortOrder === "asc" ? 
      <ArrowUp className="ml-2 h-3.5 w-3.5 text-[var(--brand-primary)] animate-in fade-in zoom-in duration-300" /> : 
      <ArrowDown className="ml-2 h-3.5 w-3.5 text-[var(--brand-primary)] animate-in fade-in zoom-in duration-300" />;
  };

  // For mutual exclusion in bulk action, we can't easily filter out "the other role" 
  // because multiple leads might have different counterparts.
  // However, we can show all users as requested.
  
  return (
    <div className="space-y-4 relative">
      {/* Table Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-gray-200 bg-white shadow-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <Columns className="h-4 w-4 text-gray-400" />
                Columns
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl shadow-2xl border-gray-100 bg-white/95 backdrop-blur-md">
              <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-2">Display Columns</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1 my-1 opacity-50" />
              <div className="space-y-1">
                {ALL_COLUMNS.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="rounded-xl text-sm font-semibold px-3 py-2 cursor-pointer focus:bg-[var(--brand-primary)]/5 focus:text-[var(--brand-primary)] data-[state=checked]:text-[var(--brand-primary)] transition-colors"
                    checked={visibleColumns.includes(col.id)}
                    onCheckedChange={(checked) => {
                      setVisibleColumns(prev => 
                        checked ? [...prev, col.id] : prev.filter(id => id !== col.id)
                      );
                    }}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-4xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden ring-1 ring-gray-100/50">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="min-w-250 border-collapse">
            <TableHeader className="bg-gray-50/40 backdrop-blur-sm sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="w-14 px-6 py-5">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="h-4.5 w-4.5 rounded-lg border-2 border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] focus:ring-offset-0 transition-all cursor-pointer checked:border-[var(--brand-primary)]"
                      checked={leads.length > 0 && selectedLeads.length === leads.length}
                      onChange={toggleAllSelection}
                    />
                  </div>
                </TableHead>
                
                {ALL_COLUMNS.map(col => visibleColumns.includes(col.id) && (
                  <TableHead 
                    key={col.id}
                    className={cn(
                      "py-5 font-bold text-gray-900 group whitespace-nowrap",
                      col.sortable && "cursor-pointer select-none hover:text-[var(--brand-primary)] transition-colors",
                      sortBy === col.field && "text-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                    )}
                    onClick={() => col.sortable && onSort?.(col.field!)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon colField={col.field} />}
                    </div>
                  </TableHead>
                ))}
                
                <TableHead className="py-5 font-bold text-gray-900 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {leads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className={cn(
                    "group transition-all duration-300 border-b border-gray-50 hover:bg-gray-50/80 hover:shadow-[inset_4px_0_0_0_var(--brand-primary)]",
                    selectedLeads.includes(lead.id) && "bg-[var(--brand-primary)]/5 shadow-[inset_4px_0_0_0_var(--brand-primary)]"
                  )}
                >
                  <TableCell className="px-6 py-4.5">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="h-4.5 w-4.5 rounded-lg border-2 border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] focus:ring-offset-0 transition-all cursor-pointer checked:border-[var(--brand-primary)]"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                      />
                    </div>
                  </TableCell>

                  {visibleColumns.includes("lead") && (
                    <TableCell className="py-4.5">
                      <Link href={`/leads/${lead.id}`} className="flex flex-col group/name">
                        <span className="font-bold text-gray-900 group-hover/name:text-[var(--brand-primary)] transition-colors line-clamp-1">
                          {lead.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold tracking-tight uppercase">
                          {lead.cid || "CID Pending"}
                        </span>
                      </Link>
                    </TableCell>
                  )}

                  {visibleColumns.includes("status") && (
                    <TableCell className="py-4.5">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                          lead.status === "New" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          lead.status === "Sold" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          lead.status === "Number Collected" ? "bg-teal-50 text-teal-600 border-teal-100" :
                          "bg-gray-50 text-gray-600 border-gray-200"
                        )}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                  )}

                  {visibleColumns.includes("team") && (
                    <TableCell className="py-4.5">
                      <div className="flex -space-x-2">
                        {lead.cre && (
                          <div className="relative group/avatar">
                            <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-gray-100 shadow-sm hover:scale-110 hover:z-20 transition-all duration-300">
                              <AvatarImage src={lead.cre.profile_picture || ""} />
                              <AvatarFallback className="text-[10px] bg-[var(--brand-primary)] text-white font-bold">
                                {lead.cre.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute hidden group-hover/avatar:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl">
                              CRE: {lead.cre.name}
                            </div>
                          </div>
                        )}
                        {lead.sales_executive && (
                          <div className="relative group/avatar">
                            <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-gray-100 shadow-sm hover:scale-110 hover:z-20 transition-all duration-300">
                              <AvatarImage src={lead.sales_executive.profile_picture || ""} />
                              <AvatarFallback className="text-[10px] bg-emerald-600 text-white font-bold">
                                {lead.sales_executive.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute hidden group-hover/avatar:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl">
                              Sales: {lead.sales_executive.name}
                            </div>
                          </div>
                        )}
                        {!lead.cre && !lead.sales_executive && (
                          <span className="text-[10px] text-gray-400 font-bold italic tracking-tighter uppercase opacity-50">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.includes("source") && (
                    <TableCell className="py-4.5">
                       <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 uppercase tracking-wider shadow-sm">
                          {lead.source}
                       </span>
                    </TableCell>
                  )}

                  {visibleColumns.includes("contact") && (
                    <TableCell className="py-4.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{lead.phones[0]}</span>
                        {lead.phones.length > 1 && (
                          <span className="text-[9px] text-gray-400 font-medium">+{lead.phones.length - 1} more numbers</span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.includes("address") && (
                    <TableCell className="py-4.5 max-w-50">
                      <div className="flex items-start gap-1.5 overflow-hidden">
                        <MapPin className="h-3 w-3 text-gray-300 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-1 italic font-medium">
                          {lead.address.area ? `${lead.address.area}, ${lead.address.district}` : "No address data"}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.includes("joined") && (
                    <TableCell className="py-4.5">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-300" />
                        <span className="text-xs font-semibold">
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-all" asChild>
                        <a href={`tel:${lead.phones[0]}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-400 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-all" asChild title="Lead Details">
                        <Link href={`/leads/${lead.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={ALL_COLUMNS.length + 2} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full border border-gray-100 shadow-inner">
                        <SearchX className="h-8 w-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold">No leads found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters or search query</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/95 backdrop-blur-xl border border-[var(--brand-primary)]/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-4xl px-6 py-4 flex items-center gap-8 ring-1 ring-[var(--brand-primary)]/10 group">
            <div className="flex items-center gap-4 pr-6 border-r border-gray-100 px-4">
              <div className="h-10 w-10 bg-[var(--brand-primary)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20 text-white font-bold animate-bounce-subtle">
                {selectedLeads.length}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight">Leads Selected</p>
                <button 
                  onClick={() => setSelectedLeads([])} 
                  className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1 w-56">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Assign To CRE</span>
                <UserSelect 
                  users={users} 
                  placeholder="Select CRE..." 
                  onSelect={(userId) => handleBulkAssign(userId, 'cre')}
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1 w-56">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Assign To Sales</span>
                <UserSelect 
                  users={users} 
                  placeholder="Select Sales..." 
                  onSelect={(userId) => handleBulkAssign(userId, 'sales')}
                  className="h-10"
                />
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 mt-5"
                onClick={() => setSelectedLeads([])}
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
