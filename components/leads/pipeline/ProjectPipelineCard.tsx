"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { getStageConfig } from "@/lib/pipeline-stages";
import type { Lead } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, DollarSign, ArrowRight, Tag } from "lucide-react";

interface ProjectPipelineCardProps {
  lead: Lead;
}

export function ProjectPipelineCard({ lead }: ProjectPipelineCardProps) {
  const config = getStageConfig(lead.status);

  const soldAmount = lead.finance?.soldAmount ?? 0;
  const totalPayment = lead.finance?.totalPayment ?? 0;
  const paymentPct = soldAmount > 0 ? Math.min(100, Math.round((totalPayment / soldAmount) * 100)) : 0;

  const projectStatus = lead.project_status?.status;
  const projectSubStatus = lead.project_status?.subStatus;

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
        {/* Header: name + team avatars */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate group-hover:text-[var(--brand-primary)] transition-colors">
              {lead.name}
            </p>
            <p className="text-[10px] text-gray-400 font-bold">
              {lead.cid ?? "CID Pending"}
            </p>
          </div>
          {/* Team avatars */}
          <div className="flex -space-x-2 shrink-0">
            {lead.sales_executive && (
              <div className="relative group/avatar">
                <Avatar className="h-7 w-7 border-2 border-white ring-1 ring-gray-100">
                  <AvatarImage src={lead.sales_executive.profile_picture ?? ""} />
                  <AvatarFallback className="text-[9px] bg-emerald-600 text-white font-bold">
                    {lead.sales_executive.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute hidden group-hover/avatar:block bottom-full right-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl">
                  SE: {lead.sales_executive.name}
                </div>
              </div>
            )}
            {lead.cre && (
              <div className="relative group/avatar">
                <Avatar className="h-7 w-7 border-2 border-white ring-1 ring-gray-100">
                  <AvatarImage src={lead.cre.profile_picture ?? ""} />
                  <AvatarFallback className="text-[9px] bg-[var(--brand-primary)] text-white font-bold">
                    {lead.cre.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute hidden group-hover/avatar:block bottom-full right-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl">
                  CRE: {lead.cre.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project status chips */}
        {(projectStatus || projectSubStatus) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3 w-3 text-gray-300 shrink-0" />
            {projectStatus && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {projectStatus}
              </span>
            )}
            {projectSubStatus && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                {projectSubStatus}
              </span>
            )}
          </div>
        )}

        {/* Phone */}
        {lead.phones?.[0] && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Phone className="h-3 w-3 text-gray-300 shrink-0" />
            <span className="text-[11px] font-bold">{lead.phones[0]}</span>
          </div>
        )}

        {/* Payment progress */}
        {soldAmount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-500">
                <DollarSign className="h-3 w-3 shrink-0 text-gray-300" />
                <span className="text-[11px] font-bold">
                  ৳{soldAmount.toLocaleString()}
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-extrabold",
                  paymentPct >= 100
                    ? "text-emerald-600"
                    : paymentPct >= 50
                    ? "text-blue-600"
                    : "text-orange-500"
                )}
              >
                {paymentPct}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  paymentPct >= 100
                    ? "bg-emerald-500"
                    : paymentPct >= 50
                    ? "bg-blue-500"
                    : "bg-orange-400"
                )}
                style={{ width: `${paymentPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              ৳{totalPayment.toLocaleString()} paid · ৳
              {Math.max(0, soldAmount - totalPayment).toLocaleString()} due
            </p>
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
