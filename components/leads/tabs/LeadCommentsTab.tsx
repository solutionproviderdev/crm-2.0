"use client";

import { Lead, LeadComment } from "@/lib/types";
import { useState, useTransition, useEffect, useRef } from "react";
import { addLeadComment } from "@/app/actions/leads";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserCircle, MessageSquare } from "lucide-react";

interface LeadCommentsTabProps {
  lead: Lead;
}

export function LeadCommentsTab({ lead }: LeadCommentsTabProps) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lead.comments]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b shrink-0 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-[var(--brand-primary)]" />
          Internal Comments
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {lead.comments?.length || 0} Total
        </span>
      </div>

      {/* Comment List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20"
      >
        {lead.comments?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-xs font-bold">No comments yet</p>
          </div>
        ) : (
          lead.comments?.map((c) => (
            <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Avatar className="w-8 h-8 shrink-0 border border-slate-100 shadow-sm">
                <AvatarImage src={c.user?.profile_picture || ""} />
                <AvatarFallback className="text-[10px] bg-slate-200">
                  {c.user?.name?.charAt(0) || <UserCircle className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">{c.user?.name || "System"}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-white border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white shrink-0">
        <div className="flex gap-2 items-center bg-slate-50 rounded-2xl p-1 pl-4 border border-slate-100 focus-within:border-[var(--brand-primary)]/30 transition-all">
          <Input 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs text-slate-700 h-9 p-0"
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button 
            size="icon" 
            className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] h-8 w-8 shrink-0 shadow-sm"
            onClick={handleSend}
            disabled={!comment.trim() || isPending}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
