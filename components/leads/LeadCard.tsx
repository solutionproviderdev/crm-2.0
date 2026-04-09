"use client";

import { Lead } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  ArrowRight,
  Info
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface LeadCardProps {
  lead: Lead;
  onOpenSidebar?: () => void;
}

export function LeadCard({ lead, onOpenSidebar }: LeadCardProps) {
  // Get latest comment
  const latestComment = lead.comments && lead.comments.length > 0 ? lead.comments[0] : null;
  // Get next/latest meeting
  const nextMeeting = lead.meetings && lead.meetings.length > 0 ? lead.meetings[0] : null;

  return (
    <Card className="group relative hover:border-[var(--brand-primary)]/40 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden bg-white rounded-4xl border-gray-100/80 ring-1 ring-gray-100/50">
      {/* Top Gradient Accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5 transition-opacity duration-500",
        lead.status === "New" ? "bg-blue-400" :
        lead.status === "Sold" ? "bg-emerald-400" :
        lead.status === "Meeting Fixed" ? "bg-teal-400" :
        "bg-gray-200"
      )} />


      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-5">
          <Badge 
            variant="secondary" 
            className={cn(
              "font-bold text-[9px] px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm transition-all duration-300 group-hover:scale-105",
              lead.status === "New" ? "bg-blue-50 text-blue-600 border-blue-100" :
              lead.status === "Sold" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              lead.status === "Meeting Fixed" ? "bg-teal-50 text-teal-600 border-teal-100" :
              "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            {lead.status}
          </Badge>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2.5">
              {lead.cre && (
                <div className="relative group/avatar">
                  <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-gray-100 shadow-sm transition-transform duration-300 hover:scale-110 hover:z-20">
                    <AvatarImage src={lead.cre.profile_picture || ""} />
                    <AvatarFallback className="text-[10px] bg-[var(--brand-primary)] text-white font-bold">
                      {lead.cre.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute hidden group-hover/avatar:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl animate-in fade-in zoom-in duration-200">
                    CRE: {lead.cre.name}
                  </div>
                </div>
              )}
              {lead.sales_executive && (
                <div className="relative group/avatar">
                  <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-gray-100 shadow-sm transition-transform duration-300 hover:scale-110 hover:z-20">
                    <AvatarImage src={lead.sales_executive.profile_picture || ""} />
                    <AvatarFallback className="text-[10px] bg-emerald-600 text-white font-bold">
                      {lead.sales_executive.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute hidden group-hover/avatar:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-lg whitespace-nowrap z-50 shadow-xl animate-in fade-in zoom-in duration-200">
                    Sales: {lead.sales_executive.name}
                  </div>
                </div>
              )}
            </div>

            {/* Info Icon Trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onOpenSidebar?.();
              }}
              className="h-8 w-8 rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-[var(--brand-primary)] hover:bg-gray-50 transition-all active:scale-95 translate-y-0.5"
            >
              <Info className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        <Link href={`/leads/${lead.id}`} className="block group/link mb-5">
          <h3 className="font-extrabold text-gray-900 text-lg group-hover/link:text-[var(--brand-primary)] transition-colors line-clamp-1 mb-1 tracking-tight">
            {lead.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase py-0.5 px-2 bg-gray-50 rounded-md border border-gray-100">
               ID: {lead.cid || "Pending"}
            </span>
            <span className="text-[10px] text-gray-400 font-bold italic opacity-60">
              via {lead.source}
            </span>
          </div>
        </Link>

        {/* Enrichment: Latest Comment */}
        {latestComment && (
          <div className="mb-5 p-3 rounded-2xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 group-hover:bg-[var(--brand-primary)]/10 transition-colors duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="h-3 w-3 text-[var(--brand-primary)]" />
              <span className="text-[10px] font-extrabold text-[var(--brand-primary)] uppercase tracking-wider">Latest Activity</span>
            </div>
            <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed font-medium italic">
              &ldquo;{latestComment.comment}&rdquo;
            </p>
          </div>
        )}

        <div className="space-y-2.5 mb-6">
           <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-600 group/item">
             <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover/item:text-[var(--brand-primary)] group-hover/item:bg-[var(--brand-primary)]/10 transition-all duration-300">
               <Phone className="h-3.5 w-3.5" />
             </div>
             <span className="tracking-tight">{lead.phones[0]}</span>
           </div>
           
           <div className="flex items-start gap-2.5 text-[11px] font-bold text-gray-600 group/item">
             <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover/item:text-[var(--brand-primary)] group-hover/item:bg-[var(--brand-primary)]/10 transition-all duration-300 shrink-0">
               <MapPin className="h-3.5 w-3.5" />
             </div>
             <span className="line-clamp-2 leading-snug italic font-medium opacity-80">
                {lead.address.area ? `${lead.address.area}, ${lead.address.district}` : "No verified address"}
             </span>
           </div>

           {nextMeeting && (
             <div className="flex items-center gap-2.5 text-[11px] font-bold text-[var(--brand-primary)] group/item">
                <div className="p-1.5 rounded-lg bg-[var(--brand-primary)]/5 group-hover/item:bg-[var(--brand-primary)]/20 transition-all duration-300">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <span>Meeting: {format(new Date(nextMeeting.date || nextMeeting.created_at), "MMM d, h:mm a")}</span>
             </div>
           )}
        </div>

        {/* Enrichment: Payment Progress (If Sold) */}
        {lead.status === "Sold" && lead.finance?.soldAmount && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-tighter">
              <span className="text-gray-400">Project Value</span>
              <span className="text-emerald-600">৳{lead.finance.soldAmount.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
              <div 
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (lead.finance.totalPayment || 0) / (lead.finance.soldAmount || 1) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold italic text-gray-400">
              <span>Paid: ৳{(lead.finance.totalPayment || 0).toLocaleString()}</span>
              <span>{Math.round((lead.finance.totalPayment || 0) / (lead.finance.soldAmount || 1) * 100)}%</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 gap-2 rounded-xl font-bold text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
            asChild
          >
            <a href={`tel:${lead.phones[0]}`}>
               <Phone className="h-3.5 w-3.5 text-gray-400" />
               Call
            </a>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-10 gap-2 bg-[var(--brand-primary)] hover:bg-[#035170] shadow-md shadow-[var(--brand-primary)]/20 font-bold transition-all active:scale-95 rounded-xl group/btn"
            asChild
          >
            <Link href={`/leads/${lead.id}`}>
               Details
               <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
