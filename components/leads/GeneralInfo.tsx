"use client";

import { Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  MapPin, 
  Globe, 
  FileText, 
  Calendar,
  Building2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadStatusControl } from "./LeadStatusControl";
import { LeadPhoneNumbers } from "./LeadPhoneNumbers";
import { LeadAddressEditor } from "./LeadAddressEditor";
import { LeadRequirements } from "./LeadRequirements";
import { User as UserType } from "@/lib/types";

interface GeneralInfoProps {
  lead: Lead;
  allUsers: UserType[];
}

export function GeneralInfo({ lead, allUsers }: GeneralInfoProps) {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--brand-primary)]" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">General Information</CardTitle>
              <p className="text-xs text-slate-500">Core identity and contact details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LeadStatusControl lead={lead} />
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-xs h-9 gap-2">
              <Plus className="w-4 h-4" />
              Create Quotation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Personal & Contact */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-primary)]/10 transition-colors">
                  <User className="w-4 h-4 text-slate-500 group-hover:text-[var(--brand-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Full Name</p>
                  <p className="text-sm font-semibold text-slate-700">{lead.name}</p>
                </div>
              </div>

              <LeadPhoneNumbers lead={lead} />

              <div className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-primary)]/10 transition-colors">
                  <Globe className="w-4 h-4 text-slate-500 group-hover:text-[var(--brand-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Source</p>
                  <Badge variant="outline" className="mt-1 bg-slate-50 font-bold text-[var(--brand-primary)] border-[var(--brand-primary)]/20">
                    {lead.source}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Column: Address & Assignment Details */}
            <div className="space-y-8">
              <LeadAddressEditor lead={lead} />
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">CRE Status</p>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-none">
                      {lead.cre_id ? "Assigned" : "Unassigned"}
                    </Badge>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Sales Status</p>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-bold border-none">
                       {lead.sales_executive_id ? "Assigned" : "Unassigned"}
                    </Badge>
                 </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requirements Card */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--brand-primary)]" />
              Detailed Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadRequirements lead={lead} />
          </CardContent>
        </Card>

        {/* Project Status Card */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--brand-primary)]" />
              Project Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase">Current Phase</span>
              <Badge className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]">
                {lead.project_status?.status || "Unknown"}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase">Current Milestone</span>
              <span className="text-xs font-semibold text-slate-700">
                {lead.project_status?.subStatus || "None"}
              </span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Lead Created</p>
                <p className="text-xs font-semibold text-slate-700">{new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
