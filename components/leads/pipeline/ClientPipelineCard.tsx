"use client";

import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import { getStageConfig } from "@/lib/pipeline-stages";
import type { Lead } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  Calendar,
  DollarSign,
  ArrowRight,
  MapPin,
} from "lucide-react";

interface ClientPipelineCardProps {
  lead: Lead;
}

export function ClientPipelineCard({ lead }: ClientPipelineCardProps) {
  const config = getStageConfig(lead.status);
  const nextMeeting = lead.meetings && lead.meetings.length > 0 ? lead.meetings[0] : null;
  const budget = lead.finance?.clientsBudget ?? lead.finance?.projectValue;
  const soldAmount = lead.finance?.soldAmount;

  return (
    <Link
      href={`/leads/${lead.id}`}
      className={cn(
        "group block rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/30 overflow-hidden"
      )}
    >
      {/* Status accent line */}
      <div className={cn("h-1 w-full", config.bg, config.border)} />

      <div className="px-4 py-3 space-y-3">
        {/* Header row: name + Sales exec avatar */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate group-hover:text-[var(--brand-primary)] transition-colors">
              {lead.name}
            </p>
            <p className="text-[10px] text-gray-400 font-bold">
              {lead.cid ?? "CID Pending"} · {lead.source}
            </p>
          </div>
          {lead.sales_executive && (
            <div className="relative group/avatar shrink-0">
              <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-gray-100 shadow-sm">
                <AvatarImage src={lead.sales_executive.profile_picture ?? ""} />
                <AvatarFallback className="text-[10px] bg-emerald-600 text-white font-bold">
                  {lead.sales_executive.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute hidden group-hover/avatar:block bottom-full right-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl">
                {lead.sales_executive.name}
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        {(lead.address.area || lead.address.district) && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPin className="h-3 w-3 text-gray-300 shrink-0" />
            <span className="text-[11px] font-medium truncate">
              {lead.address.area
                ? `${lead.address.area}, ${lead.address.district}`
                : lead.address.district}
            </span>
          </div>
        )}

        {/* Phone */}
        {lead.phones?.[0] && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Phone className="h-3 w-3 text-gray-300 shrink-0" />
            <span className="text-[11px] font-bold">{lead.phones[0]}</span>
          </div>
        )}

        {/* Next meeting */}
        {nextMeeting && (
          <div className="flex items-center gap-1.5 text-[var(--brand-primary)]">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="text-[11px] font-bold">
              {format(new Date(nextMeeting.date ?? nextMeeting.created_at), "MMM d")}
              {nextMeeting.slot ? ` · ${nextMeeting.slot}` : ""}
            </span>
          </div>
        )}

        {/* Budget / Sold amount */}
        {(soldAmount || budget) && (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span className="text-[11px] font-extrabold">
              {soldAmount
                ? `৳${soldAmount.toLocaleString()} sold`
                : `৳${budget?.toLocaleString()} budget`}
            </span>
          </div>
        )}

        {/* Footer CTA */}
        <div className="flex items-center justify-end pt-1 border-t border-gray-50">
          <span className="flex items-center gap-1 text-[10px] font-extrabold text-gray-400 group-hover:text-[var(--brand-primary)] transition-colors uppercase tracking-wider">
            View Details
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
