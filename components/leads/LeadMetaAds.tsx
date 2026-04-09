"use client";

import { Lead } from "@/lib/types";
import { Megaphone, ExternalLink, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";

interface LeadMetaAdsProps {
  lead: Lead;
}

export function LeadMetaAds({ lead }: LeadMetaAdsProps) {
  const pageInfo = lead.page_info;

  if (!pageInfo && lead.source !== "Facebook" && lead.source !== "Instagram") {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Meta Ad Context</span>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-100/50 space-y-4">
        {pageInfo ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={pageInfo.pageProfilePicture} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                  {pageInfo.pageName?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold text-slate-700">{pageInfo.pageName || "Facebook Page"}</p>
                <div className="flex items-center gap-1">
                  <Globe className={cn("w-3 h-3 transition-colors", lead.source === "Facebook" ? "text-blue-600" : "text-pink-600")} />
                  <span className="text-[10px] text-slate-500">Linked Account</span>
                </div>
              </div>
            </div>
            
            {pageInfo.fbSenderID && (
              <Badge variant="outline" className="bg-white/80 text-[10px] font-bold text-slate-500 border-slate-200">
                ID: {pageInfo.fbSenderID.substring(0, 8)}...
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-slate-400" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-500 italic">Partial Ad Metadata</p>
                <p className="text-[10px] text-slate-400">Source: {lead.source}</p>
             </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>Linked Product Ads</span>
            <span className="text-blue-500 flex items-center gap-1 cursor-pointer hover:underline">
              View on Meta <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          
          <div className="p-3 rounded-lg bg-white/60 border border-white flex items-center justify-center border-dashed">
            <p className="text-[10px] text-slate-400 font-medium">No ad creative preview available for this lead type</p>
          </div>
        </div>
      </div>
    </div>
  );
}
