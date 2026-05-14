"use client";

import {
  Lead,
  User as UserType,
  type LifecycleStatusGroup,
  type LifecycleTransitionRule,
} from "@/lib/types";
import { 
  Sheet, 
  SheetContent, 
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UserCheck, 
  Briefcase, 
  Coins,
  History,
  Activity,
  Info,
  MessageCircle
} from "lucide-react";

import { LeadStatusControl } from "./LeadStatusControl";
import { LeadRequirements } from "./LeadRequirements";
import { LeadPhoneNumbers } from "./LeadPhoneNumbers";
import { LeadAddressEditor } from "./LeadAddressEditor";
import { LeadMetaAds } from "./LeadMetaAds";
import { LeadFinanceSidebar } from "./LeadFinanceSidebar";
import { LeadMeetingsSidebar } from "./LeadMeetingsSidebar";
import { LeadCallLogSidebar } from "./LeadCallLogSidebar";
import { LeadFollowUpSidebar } from "./LeadFollowUpSidebar";
import { LeadCommentsSidebar } from "./LeadCommentsSidebar";
import { UserSelect } from "./UserSelect";
import { bulkAssignLeads } from "@/app/actions/leads";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface LeadSidebarProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  allUsers: UserType[];
  lifecycleStatusGroups?: LifecycleStatusGroup[];
  lifecycleTransitionRules?: LifecycleTransitionRule[];
}

export function LeadSidebar({
  lead,
  isOpen,
  onClose,
  allUsers,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
}: LeadSidebarProps) {
  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-white border-l shadow-2xl">
        
        {/* Header - Identity */}
        <div className="p-6 pb-4 bg-slate-50/50 border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-white shadow-md">
              <AvatarImage src={lead.profile_picture || ""} />
              <AvatarFallback className="bg-[var(--brand-primary)] text-white text-xl font-black">
                {lead.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">
                  {lead.name}
                </SheetTitle>
                <Badge variant="outline" className="bg-white font-bold text-[10px] tracking-widest text-[var(--brand-primary)] border-[var(--brand-primary)]/20 uppercase">
                  {lead.cid}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 text-[10px] font-bold py-0 h-5">
                  {lead.source}
                </Badge>
                <span className="text-[10px] text-slate-400 font-bold uppercase italic">
                  Created {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-6 space-y-6 pb-12">
            
            {/* Quick Actions & Status */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[var(--brand-primary)]" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pipeline & Status</span>
              </div>
              <LeadStatusControl
                lead={lead}
                lifecycleStatusGroups={lifecycleStatusGroups}
                lifecycleTransitionRules={lifecycleTransitionRules}
                users={allUsers}
              />
            </section>

            <Separator className="bg-slate-100" />

            {/* Accordion Sections */}
            <div className="space-y-3">
              <SidebarSection 
                title="Financials" 
                icon={<Coins className="w-4 h-4 text-amber-500" />}
                defaultOpen
              >
                <LeadFinanceSidebar lead={lead} />
              </SidebarSection>

              <SidebarSection 
                title="Current Meeting" 
                icon={<Briefcase className="w-4 h-4 text-purple-500" />}
                badge={lead.meetings && lead.meetings.length > 0 ? lead.meetings.length.toString() : undefined}
              >
                <LeadMeetingsSidebar lead={lead} />
              </SidebarSection>

              <SidebarSection 
                title="Follow-ups" 
                icon={<History className="w-4 h-4 text-indigo-500" />}
                badge={lead.follow_ups?.filter(f => f.status !== "Complete").length.toString()}
              >
                <LeadFollowUpSidebar lead={lead} />
              </SidebarSection>

              <SidebarSection 
                title="Communication Logs" 
                icon={<Activity className="w-4 h-4 text-emerald-500" />}
              >
                <LeadCallLogSidebar lead={lead} />
              </SidebarSection>

              <SidebarSection 
                title="Internal Comments" 
                icon={<MessageCircle className="w-4 h-4 text-blue-500" />}
                badge={lead.comments && lead.comments.length > 0 ? lead.comments.length.toString() : undefined}
              >
                <LeadCommentsSidebar lead={lead} />
              </SidebarSection>

              <SidebarSection
                title="Assignment"
                icon={<UserCheck className="w-4 h-4 text-blue-500" />}
              >
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-1">Assign Owner</span>
                  </div>
                  <UserSelect
                    users={allUsers}
                    value={lead.current_owner_id || lead.cre_id || ""}
                    onSelect={async (val) => {
                      const res = await bulkAssignLeads([lead.id], val);
                      if (res.success) toast.success("Owner updated");
                      else toast.error(res.error);
                    }}
                    placeholder="Select owner"
                  />
                </div>
              </SidebarSection>

              <SidebarSection 
                title="Lead Info & Meta Ads" 
                icon={<Info className="w-4 h-4 text-slate-500" />}
              >
                <div className="space-y-6 pt-2">
                  <LeadPhoneNumbers lead={lead} />
                  <LeadAddressEditor lead={lead} />
                  <LeadRequirements lead={lead} />
                  <LeadMetaAds lead={lead} />
                </div>
              </SidebarSection>
            </div>

          </div>
        </div>

        {/* Footer - Navigation links */}
        <div className="p-4 bg-slate-50 border-t flex items-center justify-center gap-4">
           <a 
              href={`/leads/${lead.id}`} 
              className="flex items-center gap-2 text-xs font-bold text-[var(--brand-primary)] hover:underline"
           >
             <Info className="w-3.5 h-3.5" />
             View Full Details Page
           </a>
           <div className="w-px h-3 bg-slate-200" />
           <div className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-not-allowed">
             <History className="w-3.5 h-3.5" />
             Activity Log
           </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

function SidebarSection({ title, icon, children, defaultOpen = false, badge }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-slate-50/40 border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 focus:outline-none group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100'}`}>
            {icon}
          </div>
          <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isOpen ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
            {title}
          </span>
          {badge && badge !== "0" && (
             <Badge className="h-4 px-1 text-[8px] bg-[var(--brand-primary)] text-white border-none font-black min-w-[16px] flex justify-center">
               {badge}
             </Badge>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white rounded-xl p-4 border border-slate-100/50 shadow-inner">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
