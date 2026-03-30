"use client";

import * as React from "react";
import { useState } from "react";
import { 
  Check, 
  ChevronDown, 
  Star, 
  Clock, 
  MessageCircle, 
  Phone, 
  Calendar, 
  Handshake, 
  AlertCircle, 
  FileText, 
  Eye, 
  TrendingDown, 
  Ruler, 
  Package, 
  PackageCheck, 
  Hammer, 
  Truck, 
  MapPin, 
  XCircle,
  LucideIcon
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead } from "@/lib/types";
import { StatusActionDialog } from "./status-modals/StatusActionDialog";

interface LeadStatusControlProps {
  lead: Lead;
}

// Status categories by stage
const statusByStage = {
  cre: [
    'New',
    'No Response',
    'Message Rescheduled',
    'Number Collected',
    'Call Reschedule',
    'Ongoing',
    'Close',
    'Need Support',
    'Meeting Fixed',
    'Meeting Complete',
  ],
  sales: [
    'Meeting Fixed',
    'Meeting Complete',
    'Quotation Sent',
    'Prospect',
    'Sold',
    'Lost',
    'Mesurement Done',
    'Handed Over',
  ],
  implementation: [
    'Mesurement Done',
    'Material Ordered',
    'Material Received',
    'Making',
    'Ready for Installation',
    'Out for Installation',
    'Installation Completed',
    'Handed Over',
  ],
};

const statusIconMap: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  New: { icon: Star, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'No Response': { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'Message Rescheduled': { icon: MessageCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Number Collected': { icon: Phone, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Call Reschedule': { icon: Phone, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  Ongoing: { icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  Close: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  'Meeting Fixed': { icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Meeting Complete': { icon: Check, color: 'text-green-600', bgColor: 'bg-green-50' },
  Sold: { icon: Handshake, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Need Support': { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Follow Up': { icon: MessageCircle, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Quotation Sent': { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  Prospect: { icon: Eye, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  Lost: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Mesurement Done': { icon: Ruler, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Material Ordered': { icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Material Received': { icon: PackageCheck, color: 'text-green-600', bgColor: 'bg-green-50' },
  Making: { icon: Hammer, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  'Ready for Installation': { icon: Check, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Out for Installation': { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Installation Completed': { icon: Check, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Handed Over': { icon: MapPin, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
};

const getStatusConfig = (status: string) => statusIconMap[status] || { icon: Star, color: 'text-slate-600', bgColor: 'bg-slate-50' };

export function LeadStatusControl({ lead }: LeadStatusControlProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>("");

  const currentStatus = lead.status || "New";
  const { icon: StatusIcon, color, bgColor } = getStatusConfig(currentStatus);

  const handleStatusSelect = (status: string) => {
    if (status === currentStatus) return;
    setTargetStatus(status);
    setDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "h-10 px-4 rounded-xl font-bold flex items-center gap-2 border shadow-sm transition-all",
              bgColor, color, "border-slate-200 hover:border-slate-300"
            )}
          >
            <StatusIcon className="w-4 h-4" />
            <span>{currentStatus}</span>
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-0 shadow-2xl rounded-2xl border-none overflow-hidden bg-white">
          <DropdownMenuLabel className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
            Change Lead Status
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="m-0" />
          
          <div className="max-h-100 overflow-y-auto no-scrollbar py-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase text-blue-600/60">CRE Stage</DropdownMenuLabel>
              {statusByStage.cre.map((status) => {
                const config = getStatusConfig(status);
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                      currentStatus === status ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm font-medium">{status}</span>
                    {currentStatus === status && <Check className="ml-auto w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase text-indigo-600/60">Sales Stage</DropdownMenuLabel>
              {statusByStage.sales.filter(s => !statusByStage.cre.includes(s)).map((status) => {
                const config = getStatusConfig(status);
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                      currentStatus === status ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm font-medium">{status}</span>
                    {currentStatus === status && <Check className="ml-auto w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase text-emerald-600/60">Implementation</DropdownMenuLabel>
              {statusByStage.implementation.filter(s => !statusByStage.sales.includes(s) && !statusByStage.cre.includes(s)).map((status) => {
                const config = getStatusConfig(status);
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                      currentStatus === status ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm font-medium">{status}</span>
                    {currentStatus === status && <Check className="ml-auto w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <StatusActionDialog 
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        lead={lead}
        targetStatus={targetStatus}
      />
    </>
  );
}
