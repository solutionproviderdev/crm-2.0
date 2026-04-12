"use client";

import { Lead } from "@/lib/types";
import { useState, useTransition, useRef, useEffect } from "react";
import { addLeadComment } from "@/app/actions/leads";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserCircle, MessageSquare } from "lucide-react";

interface LeadCommentsSidebarProps {
  lead: Lead;
}

export function LeadCommentsSidebar({ lead }: LeadCommentsSidebarProps) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const feedRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!comment.trim()) return;

    startTransition(async () => {
      const result = await addLeadComment(lead.id, comment);
      if (result.success) {
        setComment("");
        toast.success("Comment added");
      } else {
        toast.error(result.error);
      }
    });
  };

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [lead.comments]);

  return (
    <div className="flex flex-col h-[400px] bg-slate-50/30 rounded-xl border border-slate-100 overflow-hidden group/feed">
      {/* Feed */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar"
      >
        {lead.comments && lead.comments.length > 0 ? (
          lead.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Avatar className="w-6 h-6 shrink-0 border border-white shadow-sm">
                <AvatarImage src={c.user?.profile_picture || ""} />
                <AvatarFallback className="text-[8px] bg-slate-200">
                  {c.user?.name?.charAt(0) || <UserCircle className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-800 tracking-tight truncate">
                    {c.user?.name || "System"}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl rounded-tl-none bg-white border border-slate-100/80 shadow-sm relative group">
                  <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-8">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No internal notes</p>
          </div>
        )}
      </div>

      {/* Quick Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-center bg-slate-50 rounded-xl p-0.5 pl-3 border border-slate-100 focus-within:border-[var(--brand-primary)]/30 transition-all">
          <Input 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-[11px] text-slate-700 h-8 p-0"
            placeholder="Type a quick note..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button 
            size="icon" 
            className="rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] h-7 w-7 shrink-0 shadow-sm transition-transform active:scale-95"
            onClick={handleSend}
            disabled={!comment.trim() || isPending}
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
