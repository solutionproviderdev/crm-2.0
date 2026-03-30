"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { LeadFollowUp, Lead, User, MeetingSlot, LeadMeeting } from "@/lib/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Loader2, 
  MessageSquare,
  History,
  UserCheck,
  Phone,
  MapPin,
  User as UserIcon,
  Check
} from "lucide-react";
import { completeFollowUp } from "@/app/actions/follow-ups";
import { getMeetingSlots, getMeetingsByDate, getAllActiveUsers } from "@/app/actions/leads";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { isPast, parseISO, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FollowUpModalProps {
  reminder: (LeadFollowUp & { lead: Lead }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: LeadFollowUp) => void;
}

export function FollowUpModal({ reminder, isOpen, onClose, onSuccess }: FollowUpModalProps) {
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [nextTime, setNextTime] = useState("");
  
  // New States
  const [type, setType] = useState<"Call" | "Physical Meeting">("Call");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [slotId, setSlotId] = useState<string>("");
  
  const [users, setUsers] = useState<User[]>([]);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [existingMeetings, setExistingMeetings] = useState<LeadMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; type: string } | null>(null);

  const isLate = reminder ? isPast(parseISO(reminder.time)) : false;

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data: userProfile } = await supabase
            .from("users")
            .select("id, type")
            .eq("id", authUser.id)
            .single();
          
          setCurrentUser(userProfile);
          setAssignedTo(authUser.id);
        }

        const [usersRes, slotsRes] = await Promise.all([
          getAllActiveUsers(),
          getMeetingSlots()
        ]);

        if (usersRes.success) setUsers(usersRes.data);
        if (slotsRes.success) setSlots(slotsRes.data);
      };
      fetchData();
    }
  }, [isOpen]);

  const fetchExistingMeetings = useCallback(async () => {
    if (!meetingDate) return;
    setLoadingMeetings(true);
    const res = await getMeetingsByDate(meetingDate);
    if (res.success) setExistingMeetings(res.data);
    setLoadingMeetings(false);
  }, [meetingDate]);

  useEffect(() => {
    let active = true;
    if (isOpen && active) {
      // Defer to avoid "setState synchronously within effect" lint
      const timer = setTimeout(() => {
        if (active) fetchExistingMeetings();
      }, 0);
      return () => { 
        active = false;
        clearTimeout(timer);
      };
    }
    return () => { active = false; };
  }, [isOpen, meetingDate, fetchExistingMeetings]);

  useEffect(() => {
    if (!isOpen || !meetingDate) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`followup_meetings_${meetingDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_meetings"
        },
        () => {
          fetchExistingMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, meetingDate, fetchExistingMeetings]);

  const handleComplete = () => {
    if (!reminder) return;
    if (!comment.trim()) {
      toast.error("Please add a summary comment.");
      return;
    }

    if (type === "Physical Meeting" && (!meetingDate || !slotId)) {
      toast.error("Please select a date and slot for the physical meeting.");
      return;
    }

    startTransition(async () => {
      const result = await completeFollowUp({
        id: reminder.id,
        leadId: reminder.lead_id,
        status: isLate ? "Late Complete" : "Complete",
        comment,
        nextFollowUpTime: type === "Call" ? (nextTime || undefined) : undefined,
        type,
        assignedTo,
        meetingDate: type === "Physical Meeting" ? meetingDate : undefined,
        slotId: type === "Physical Meeting" ? slotId : undefined,
      });

      if (result.success) {
        toast.success("Follow-up recorded successfully!");
        onSuccess(result.data);
        onClose();
        setComment("");
        setNextTime("");
        setSlotId("");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!reminder) return null;
  const lead = reminder.lead as Lead;
  const isAdmin = currentUser?.type === "Admin";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-[2.5rem] max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
        {/* Modal Header Wrap */}
        <div className="bg-linear-to-br from-[#0462181] to-[#024d6b] p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <UserCheck className="w-32 h-32" />
          </div>
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 opacity-80 uppercase tracking-widest text-[10px] font-black">
                <History className="w-3.5 h-3.5" />
                Processing Follow-up
              </div>
              
              {/* Timing Badge */}
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm",
                isLate ? "bg-orange-500/20 text-orange-200" : "bg-emerald-500/20 text-emerald-200"
              )}>
                {isLate ? "Recording as Late" : "On-Time Interaction"}
              </div>
            </div>
            <DialogTitle className="text-3xl font-black leading-tight">
              Record Interaction with <br />
              <span className="text-orange-400">{lead?.name || "the Customer"}</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Assignment & Type Toggle */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="w-3 h-3" />
                Assign Responsibility
              </label>
              <Select 
                value={assignedTo} 
                onValueChange={setAssignedTo} 
                disabled={!isAdmin}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-bold">
                  <SelectValue placeholder="Select Assignee" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-bold py-3 rounded-xl">
                      {u.name} {u.id === currentUser?.id ? "(You)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" />
                Follow-up Type
              </label>
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 h-12">
                <button
                  onClick={() => setType("Call")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase transition-all",
                    type === "Call" ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Phone className="w-3 h-3" />
                  Call
                </button>
                <button
                  onClick={() => setType("Physical Meeting")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase transition-all",
                    type === "Physical Meeting" ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <MapPin className="w-3 h-3" />
                  Meeting
                </button>
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                Conversation Summary
              </label>
              {isLate && (
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tighter">
                  Late Execution
                </span>
              )}
            </div>
            <Textarea
              placeholder="What did you discuss? Use bullet points for key requirements..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-30 rounded-3xl border-slate-200 focus:ring-[var(--brand-primary)]/10 font-bold p-5 resize-none placeholder:text-slate-300 text-base"
            />
          </div>

          {/* Next Steps / Meeting Slots */}
          <div className="p-8 bg-slate-50 rounded-4xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                {type === "Call" ? "Next Call (Optional)" : "Book Meeting Slot"}
              </label>
              <div className="text-right">
                {type === "Call" && !nextTime ? (
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 uppercase tracking-wider italic">No further step</span>
                ) : type === "Physical Meeting" && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-tighter">Selected Assignment</p>
                    <p className="text-xs font-bold text-slate-700">
                      {assignedTo && slotId 
                        ? `${users.find(u => u.id === assignedTo)?.name.split(' ')[0]} @ ${slotId}`
                        : "Please select a slot"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {type === "Call" ? (
              <div className="space-y-4">
                <Input
                  type="datetime-local"
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  className="h-16 rounded-2xl border-slate-200 bg-white shadow-xs focus:ring-[var(--brand-primary)]/10 font-bold px-6 text-lg"
                />
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic px-2">
                  * Leave blank if no follow-up is planned.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-xs">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Meeting Date</label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm font-bold px-5"
                  />
                </div>

                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-max">
                      <div className="flex bg-slate-50 border-b border-slate-200">
                        <div className="w-24 shrink-0 p-3 text-[10px] font-black text-slate-400 text-center border-r border-slate-200">TEAM</div>
                        {slots.map(s => (
                          <div key={s.id} className="w-20 shrink-0 p-3 text-[10px] font-black text-slate-500 text-center border-r border-slate-200 uppercase tracking-tighter">{s.slot_text}</div>
                        ))}
                      </div>
                      <div className="flex flex-col">
                        {loadingMeetings ? (
                          <div className="h-48 flex items-center justify-center bg-slate-50/30">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                          </div>
                        ) : (
                          users.map((person) => (
                            <div key={person.id} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                              <div className="w-24 shrink-0 p-3 bg-slate-50/50 border-r border-slate-200 flex items-center justify-center">
                                <span className="text-[10px] font-black text-slate-600 truncate w-full text-center">{person.nickname || person.name.split(' ')[0]}</span>
                              </div>
                              {slots.map((slot) => {
                                const meeting = existingMeetings.find(m => m.sales_executive_id === person.id && m.slot === slot.slot_text);
                                const isSelected = assignedTo === person.id && slotId === slot.slot_text;
                                if (meeting) return (
                                  <div key={slot.id} className="w-20 shrink-0 h-12 bg-red-50/30 flex items-center justify-center border-r border-slate-100">
                                    <Badge className="text-[8px] bg-red-100 text-red-600 border-none px-1.5 py-0.5 pointer-events-none font-black shadow-sm">BUSY</Badge>
                                  </div>
                                );
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => {
                                      setAssignedTo(person.id);
                                      setSlotId(slot.slot_text);
                                    }}
                                    className={cn(
                                      "w-20 shrink-0 h-10 border-r border-slate-100 transition-all flex items-center justify-center relative",
                                      isSelected ? "bg-[var(--brand-primary)] ring-inset ring-2 ring-[var(--brand-primary)]/20" : "bg-white hover:bg-[var(--brand-primary)]/5"
                                    )}
                                  >
                                    {isSelected && <Check className="w-4 h-4 text-white animate-in zoom-in-50 duration-200" />}
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="rounded-2xl h-14 px-8 font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest text-[11px]"
          >
            Go Back
          </Button>
          <Button 
            onClick={handleComplete} 
            disabled={isPending || !comment.trim()}
            className="rounded-2xl h-14 px-12 font-black bg-[var(--brand-primary)] hover:bg-[#034d6b] text-white shadow-xl shadow-[var(--brand-primary)]/20 transition-all uppercase tracking-widest text-[11px]"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Interaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
