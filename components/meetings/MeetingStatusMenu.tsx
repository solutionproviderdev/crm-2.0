"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  MoreVertical,
  CalendarDays,
  Clock,
  XCircle,
  CheckCircle2,
  BadgeDollarSign,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import {
  updateMeetingStatus,
  deleteMeeting,
  completeMeeting,
  markAsSold,
  getMeetingSlots,
  getSalesTeamMembers,
  getMeetingsByDate
} from "@/app/actions/leads";
import { LeadMeeting, MeetingSlot, User } from "@/lib/types";
import { useUser } from "@/components/providers/UserProvider";
import { MeetingSlotGrid } from "./MeetingSlotGrid";


type DialogType =
  | "reschedule"
  | "postpone"
  | "cancel"
  | "complete"
  | "sold"
  | "delete"
  | null;

interface MeetingStatusMenuProps {
  meeting: LeadMeeting;
  onUpdate?: (updated: LeadMeeting) => void;
  onDelete?: (meetingId: string) => void;
  stopPropagation?: boolean;
}

const TERMINAL_STATUSES = ["Sold", "Complete"];


export function MeetingStatusMenu({
  meeting,
  onUpdate,
  onDelete,
  stopPropagation = true,
}: MeetingStatusMenuProps) {
  const { user } = useUser();
  const isAdmin = user?.type === "Admin";
  const isTerminal = TERMINAL_STATUSES.includes(meeting.status);

  const [open, setOpen] = useState<DialogType>(null);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState(meeting.date);
  const [rescheduleSlot, setRescheduleSlot] = useState(meeting.slot);
  const [rescheduleExec, setRescheduleExec] = useState(meeting.sales_executive_id);
  const [salesTeams, setSalesTeams] = useState<User[]>([]);
  const [existingMeetings, setExistingMeetings] = useState<LeadMeeting[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Postpone state
  const [postponeReason, setPostponeReason] = useState("");
  const [postponeDate, setPostponeDate] = useState("");

  // Cancel state
  const [cancelReason, setCancelReason] = useState("");

  // Complete state
  const [completeComment, setCompleteComment] = useState("");
  const [completeProjectValue, setCompleteProjectValue] = useState("");
  const [completeBudget, setCompleteBudget] = useState("");
  const [completeFollowUp, setCompleteFollowUp] = useState("");

  // Sold state
  const [soldComment, setSoldComment] = useState("");
  const [soldProjectValue, setSoldProjectValue] = useState("");
  const [soldAmount, setSoldAmount] = useState("");
  const [soldBudget, setSoldBudget] = useState("");
  const [soldDate, setSoldDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");

  useEffect(() => {
    if (open === "reschedule") {
      const loadSchedule = async () => {
        setLoadingSchedule(true);
        const [slotsRes, salesRes, meetingsRes] = await Promise.all([
          getMeetingSlots(),
          getSalesTeamMembers(),
          getMeetingsByDate(rescheduleDate)
        ]);
        if (slotsRes.success) setSlots(slotsRes.data);
        if (salesRes.success) setSalesTeams(salesRes.data);
        if (meetingsRes.success) setExistingMeetings(meetingsRes.data);
        setLoadingSchedule(false);
      };
      loadSchedule();
    }
  }, [open, rescheduleDate]);

  const stopProp = (e: React.MouseEvent | React.PointerEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  const handleReschedule = async () => {
    setLoading(true);
    const result = await updateMeetingStatus(meeting.id, "Rescheduled", {
      date: rescheduleDate,
      slot: rescheduleSlot,
      salesExecutiveId: rescheduleExec || undefined,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Meeting rescheduled");
      onUpdate?.(result.data);
      setOpen(null);
    } else {
      toast.error(result.error);
    }
  };

  const handlePostpone = async () => {
    setLoading(true);
    const result = await updateMeetingStatus(meeting.id, "Postponed", {
      reason: postponeReason,
      date: postponeDate || undefined,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Meeting postponed");
      onUpdate?.(result.data);
      setOpen(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    const result = await updateMeetingStatus(meeting.id, "Canceled", {
      reason: cancelReason,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Meeting canceled");
      onUpdate?.(result.data);
      setOpen(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleComplete = async () => {
    if (!meeting.lead_id) return;
    setLoading(true);
    const result = await completeMeeting({
      meetingId: meeting.id,
      leadId: meeting.lead_id,
      projectValue: Number(completeProjectValue),
      clientsBudget: Number(completeBudget),
      followUpTime: completeFollowUp,
      comment: completeComment,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Meeting marked as Complete");
      onUpdate?.({ ...meeting, status: "Complete" });
      setOpen(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleSold = async () => {
    if (!meeting.lead_id) return;
    setLoading(true);
    const result = await markAsSold({
      meetingId: meeting.id,
      leadId: meeting.lead_id,
      projectValue: Number(soldProjectValue),
      soldAmount: Number(soldAmount),
      clientsBudget: Number(soldBudget),
      soldDate,
      paymentAmount: Number(paymentAmount),
      paymentMethod,
      paymentNote,
      nextFollowUpTime,
      comment: soldComment,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Meeting marked as Sold");
      onUpdate?.({ ...meeting, status: "Sold" });
      setOpen(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteMeeting(meeting.id);
    setLoading(false);
    if (result.success) {
      toast.success("Meeting deleted");
      onDelete?.(meeting.id);
      setOpen(null);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded-lg hover:bg-black/10 text-current transition-colors focus:outline-none"
            onPointerDown={stopProp}
            onClick={stopProp}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 rounded-2xl shadow-xl border-gray-100 z-200"
          onPointerDown={stopProp}
          onClick={stopProp}
        >
          {!isTerminal && (
            <>
              <DropdownMenuItem onClick={() => setOpen("reschedule")} className="gap-2 rounded-xl text-orange-600 focus:text-orange-600 focus:bg-orange-50">
                <CalendarDays className="w-3.5 h-3.5" />
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen("postpone")} className="gap-2 rounded-xl text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                <Clock className="w-3.5 h-3.5" />
                Postpone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen("cancel")} className="gap-2 rounded-xl text-red-600 focus:text-red-600 focus:bg-red-50">
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </DropdownMenuItem>
            </>
          )}

          {isAdmin && !isTerminal && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen("complete")} className="gap-2 rounded-xl text-teal-600 focus:text-teal-600 focus:bg-teal-50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen("sold")} className="gap-2 rounded-xl text-green-600 focus:text-green-600 focus:bg-green-50">
                <BadgeDollarSign className="w-3.5 h-3.5" />
                Sold
              </DropdownMenuItem>
            </>
          )}

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen("delete")} className="gap-2 rounded-xl text-red-700 focus:text-red-700 focus:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Reschedule Dialog ─────────────────────── */}
      <Dialog open={open === "reschedule"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-3xl max-w-2xl" onPointerDown={stopProp}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              Reschedule Meeting
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Current Schedule Summary */}
            <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Original Schedule</p>
                <p className="text-sm font-bold text-orange-950">
                  {format(new Date(meeting.date), "EEEE, MMM d")} @ {meeting.slot}
                </p>
              </div>
              <div className="h-8 w-px bg-orange-100 mx-4" />
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Target Slot</p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-black transition-colors",
                    rescheduleSlot ? "text-[var(--brand-primary)]" : "text-slate-300 italic"
                  )}>
                    {rescheduleExec && rescheduleSlot 
                      ? `${salesTeams.find(u => u.id === rescheduleExec)?.nickname || salesTeams.find(u => u.id === rescheduleExec)?.name || 'Someone'} @ ${rescheduleSlot}`
                      : "Picking slot..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select New Date</label>
                  <Input 
                    type="date" 
                    value={rescheduleDate} 
                    onChange={(e) => setRescheduleDate(e.target.value)} 
                    className="rounded-xl h-12 border-slate-200 focus:ring-[var(--brand-primary)]/10 font-bold" 
                  />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] text-slate-400 font-bold leading-relaxed">
                  <p>Picking a new slot will automatically release the previous time slot for other meetings.</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Slots</label>
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <MeetingSlotGrid 
                    slots={slots}
                    salesTeams={salesTeams}
                    existingMeetings={existingMeetings}
                    loading={loadingSchedule}
                    selectedSalesId={rescheduleExec || ""}
                    selectedSlotText={rescheduleSlot}
                    onSelect={(personId, slotText) => {
                      setRescheduleExec(personId);
                      setRescheduleSlot(slotText);
                    }}
                    excludeUserId={meeting.lead?.cre_id || undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-50 pt-4 mt-2">
            <Button variant="ghost" onClick={() => setOpen(null)} className="rounded-xl h-11 px-6 font-bold text-slate-500">Cancel</Button>
            <Button 
              onClick={handleReschedule} 
              disabled={loading || !rescheduleSlot || !rescheduleExec} 
              className="rounded-xl h-11 px-8 font-black bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Postpone Dialog ───────────────────────── */}
      <Dialog open={open === "postpone"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-3xl max-w-sm" onPointerDown={stopProp}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Postpone Meeting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reason (optional)</label>
              <Textarea value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} placeholder="Why is this being postponed?" className="rounded-xl resize-none h-24" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Expected New Date</label>
              <Input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} className="rounded-xl h-11" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handlePostpone} disabled={loading} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Postpone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ─────────────────────────── */}
      <Dialog open={open === "cancel"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-3xl max-w-sm" onPointerDown={stopProp}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Cancel Meeting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">Are you sure you want to cancel this meeting with <span className="font-bold text-gray-800">{meeting.lead?.name}</span>?</p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reason (optional)</label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." className="rounded-xl resize-none h-20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} className="rounded-xl">Keep Meeting</Button>
            <Button onClick={handleCancel} disabled={loading} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Complete Dialog ───────────────────────── */}
      <Dialog open={open === "complete"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-3xl max-w-md" onPointerDown={stopProp}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              Mark as Complete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Value (৳)</label>
                <Input type="number" value={completeProjectValue} onChange={(e) => setCompleteProjectValue(e.target.value)} placeholder="0" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client Budget (৳)</label>
                <Input type="number" value={completeBudget} onChange={(e) => setCompleteBudget(e.target.value)} placeholder="0" className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Follow-up Date & Time</label>
              <Input type="datetime-local" value={completeFollowUp} onChange={(e) => setCompleteFollowUp(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Comment</label>
              <Textarea value={completeComment} onChange={(e) => setCompleteComment(e.target.value)} placeholder="Meeting notes..." className="rounded-xl resize-none h-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleComplete} disabled={loading} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sold Dialog ───────────────────────────── */}
      <Dialog open={open === "sold"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-3xl max-w-lg" onPointerDown={stopProp}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-green-500" />
              Mark as Sold
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-96 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Value (৳)</label>
                <Input type="number" value={soldProjectValue} onChange={(e) => setSoldProjectValue(e.target.value)} placeholder="0" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sold Amount (৳)</label>
                <Input type="number" value={soldAmount} onChange={(e) => setSoldAmount(e.target.value)} placeholder="0" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client Budget (৳)</label>
                <Input type="number" value={soldBudget} onChange={(e) => setSoldBudget(e.target.value)} placeholder="0" className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sold Date</label>
                <Input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-green-50 border border-green-100 space-y-3">
              <p className="text-xs font-black text-green-700 uppercase tracking-widest">Payment Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment (৳)</label>
                  <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0" className="rounded-xl h-11 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none">
                    {["Cash", "Bank Transfer", "bKash", "Nagad", "Cheque"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Payment note (optional)" className="rounded-xl h-11 bg-white" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Next Follow-up</label>
              <Input type="datetime-local" value={nextFollowUpTime} onChange={(e) => setNextFollowUpTime(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Comment</label>
              <Textarea value={soldComment} onChange={(e) => setSoldComment(e.target.value)} placeholder="Sale notes..." className="rounded-xl resize-none h-20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSold} disabled={loading} className="rounded-xl bg-green-600 hover:bg-green-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────── */}
      <Dialog open={open === "delete"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="rounded-3xl max-w-sm" onPointerDown={stopProp}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete Meeting
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-2">
            Permanently delete this meeting with <span className="font-bold text-gray-800">{meeting.lead?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)} className="rounded-xl">Keep</Button>
            <Button onClick={handleDelete} disabled={loading} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
