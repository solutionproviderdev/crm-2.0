"use client";

import { Lead } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone, MessageCircle, MapPin, Clock, ArrowRight, Info,
  CalendarDays, AlertTriangle, Flame
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface LeadCardProps {
  lead: Lead;
  onOpenSidebar?: () => void;
}

// Status → colour mapping
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "New":             { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    dot: "bg-blue-400" },
  "Fresh":           { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-100",     dot: "bg-sky-400" },
  "Contacted":       { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-100",  dot: "bg-indigo-400" },
  "Meeting Fixed":   { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-100",    dot: "bg-teal-400" },
  "Meeting Complete":{ bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-100",    dot: "bg-cyan-400" },
  "Ongoing":         { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100",   dot: "bg-amber-400" },
  "Sold":            { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-400" },
  "Lost":            { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-100",    dot: "bg-rose-400" },
  "Closed":          { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400" },
};
const DEFAULT_STATUS = { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };

const PRIORITY_STYLES: Record<string, { label: string; classes: string } | undefined> = {
  high:   { label: "High",   classes: "bg-orange-50 text-orange-600 border-orange-200" },
  urgent: { label: "Urgent", classes: "bg-red-50 text-red-600 border-red-200" },
};

export function LeadCard({ lead, onOpenSidebar }: LeadCardProps) {
  const st = STATUS_STYLES[lead.status] ?? DEFAULT_STATUS;
  const priority = PRIORITY_STYLES[lead.priority?.toLowerCase() ?? ""];

  // Owner: prefer new system, fallback to legacy
  const owner = lead.current_owner ?? lead.cre ?? lead.sales_executive ?? null;
  const ownerLabel = lead.current_owner ? "Owner" : lead.cre ? "CRE" : lead.sales_executive ? "Sales" : null;

  // Contact
  const phone = lead.phones?.[0] ?? null;
  const extraPhones = (lead.phones?.length ?? 0) - 1;
  const area = [lead.address?.area, lead.address?.district].filter(Boolean).join(", ");

  // Activity counts
  const commentCount = lead.comments?.length ?? 0;
  const meetingCount = lead.meetings?.length ?? 0;

  // Next pending follow-up
  const nextFollowUp = lead.follow_ups
    ?.filter(f => f.status !== "Complete" && f.status !== "Late Complete")
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())[0] ?? null;
  const followUpOverdue = nextFollowUp ? isPast(parseISO(nextFollowUp.time)) : false;

  // Requirements
  const reqs = lead.requirements ?? [];
  const visibleReqs = reqs.slice(0, 3);
  const extraReqs = reqs.length - visibleReqs.length;

  // Finance
  const finance = lead.finance;
  const soldAmt = finance?.soldAmount ?? 0;
  const paidAmt = finance?.totalPayment ?? 0;
  const dueAmt  = finance?.totalDue ?? 0;
  const payPct  = soldAmt > 0 ? Math.min(100, Math.round((paidAmt / soldAmt) * 100)) : 0;

  const isLostOrClosed = lead.status === "Lost" || lead.status === "Closed";
  const lostNote = lead.lost_reason ?? lead.close_reason ?? null;

  return (
    <div className={cn(
      "group relative bg-white rounded-3xl border border-slate-100 shadow-sm",
      "hover:shadow-xl hover:-translate-y-1 hover:border-slate-200 transition-all duration-300 overflow-hidden flex flex-col"
    )}>
      {/* Top accent bar */}
      <div className={cn("h-1 w-full", st.dot)} />

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Row 1: Status + Priority + Sidebar btn */}
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", st.bg, st.text, st.border)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
            {lead.status}
          </span>
          {priority && (
            <span className={cn("inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border", priority.classes)}>
              {lead.priority === "urgent" ? <Flame className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
              {priority.label}
            </span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); onOpenSidebar?.(); }}
            className="ml-auto h-7 w-7 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 transition-all"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 2: Identity */}
        <Link href={`/leads/${lead.id}`} className="block group/name">
          <h3 className="font-black text-slate-800 text-[15px] leading-tight group-hover/name:text-[var(--brand-primary)] transition-colors line-clamp-1 uppercase tracking-tight">
            {lead.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] font-black tracking-widest text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10 px-2 py-0.5 rounded-md uppercase">
              {lead.cid || "—"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 italic">{lead.source}</span>
            {lead.page_info?.pageName && (
              <span className="text-[9px] font-bold text-slate-400 italic">· {lead.page_info.pageName}</span>
            )}
          </div>
        </Link>

        {/* Row 3: Owner strip */}
        {owner && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border border-white shadow-sm shrink-0">
              <AvatarImage src={owner.profile_picture || ""} />
              <AvatarFallback className="text-[9px] bg-[var(--brand-primary)] text-white font-black">{owner.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-slate-600 truncate">{owner.name}</span>
            {ownerLabel && (
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md ml-auto shrink-0">{ownerLabel}</span>
            )}
          </div>
        )}

        {/* Row 4: Contact */}
        {phone && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{phone}</span>
            {extraPhones > 0 && <span className="text-[9px] text-slate-400 font-bold">+{extraPhones}</span>}
            {area && <span className="text-[9px] text-slate-400 font-bold ml-auto flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{area}</span>}
          </div>
        )}

        {/* Row 5: Requirements */}
        {visibleReqs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleReqs.map((r, i) => (
              <span key={i} className="text-[9px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{r}</span>
            ))}
            {extraReqs > 0 && <span className="text-[9px] font-black text-slate-400">+{extraReqs}</span>}
          </div>
        )}

        {/* Row 6: Activity bar */}
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />{commentCount}
            </span>
          )}
          {meetingCount > 0 && (
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />{meetingCount}
            </span>
          )}
          {nextFollowUp && (
            <span className={cn("flex items-center gap-1 ml-auto", followUpOverdue ? "text-red-500 font-black" : "text-slate-400")}>
              <Clock className="w-3 h-3" />
              {followUpOverdue ? "Overdue" : format(parseISO(nextFollowUp.time), "MMM d, h:mm a")}
            </span>
          )}
        </div>

        {/* Row 7: Finance (Sold leads) */}
        {soldAmt > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-50">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>Sold ৳{soldAmt.toLocaleString()}</span>
              <span className={dueAmt > 0 ? "text-rose-500" : "text-emerald-500"}>
                {dueAmt > 0 ? `Due ৳${dueAmt.toLocaleString()}` : "Cleared"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${payPct}%` }} />
            </div>
          </div>
        )}

        {/* Row 8: Lost/close reason */}
        {isLostOrClosed && lostNote && (
          <div className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-2.5 py-1.5 line-clamp-2 italic">
            {lostNote}
          </div>
        )}

        {/* Row 9: Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          {phone && (
            <Button variant="outline" size="sm" className="flex-1 h-9 gap-1.5 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 text-xs" asChild>
              <a href={`tel:${phone}`}><Phone className="w-3.5 h-3.5" />Call</a>
            </Button>
          )}
          <Button variant="default" size="sm" className="flex-1 h-9 gap-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 shadow-sm font-bold text-xs rounded-xl" asChild>
            <Link href={`/leads/${lead.id}`}>Details<ArrowRight className="w-3.5 h-3.5" /></Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
