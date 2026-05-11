"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Lead, LifecycleTransitionRule, UpdateLeadInput, User } from "@/lib/types";
import {
  addLeadComment,
  addLeadPhone,
  attachStatusNote,
  completeMeeting,
  createSupportRequest,
  markAsSold,
  updateLead,
  updateLeadProjectStatus
} from "@/app/actions/leads";
import { addLeadFollowUp } from "@/app/actions/follow-ups";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { 
  CommentSection, 
  ProjectFinancialsSection, 
  FollowUpSection, 
  PaymentSection, 
  ProjectStatusSection 
} from "./StatusFormSections";
import { format } from "date-fns";
import { MeetingFixedWizard } from "./MeetingFixedWizard";
import { UserSelect } from "../UserSelect";

interface StatusActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  targetStatus: string;
  targetStatusId?: string;
  targetStageId?: string;
  targetTransition?: LifecycleTransitionRule;
  users?: User[];
  onUpdated?: () => void;
}

export function StatusActionDialog({ 
  isOpen, 
  onClose, 
  lead, 
  targetStatus,
  targetStatusId,
  targetStageId,
  targetTransition,
  users = [],
  onUpdated
}: StatusActionDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [followUpTime, setFollowUpTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [assignedTo, setAssignedTo] = useState(lead.current_owner_id || lead.sales_executive_id || lead.cre_id || "");
  const [projectValue, setProjectValue] = useState(lead.finance?.projectValue?.toString() || "0");
  const [clientsBudget, setClientsBudget] = useState(lead.finance?.clientsBudget?.toString() || "0");
  const [projectStatus, setProjectStatus] = useState({
    status: lead.project_status?.status || "",
    subStatus: lead.project_status?.subStatus || ""
  });
  
  // Payment State (for Sold)
  const [paymentData, setPaymentData] = useState({
    soldAmount: "0",
    soldDate: format(new Date(), "yyyy-MM-dd"),
    paymentAmount: "0",
    paymentMethod: "Cash",
    paymentNote: ""
  });

  // Reset form when the same mounted dialog opens for another lead/status.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComment("");
      setPhone("");
      setFollowUpTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setAssignedTo(lead.current_owner_id || lead.sales_executive_id || lead.cre_id || "");
      setProjectValue(lead.finance?.projectValue?.toString() || "0");
      setClientsBudget(lead.finance?.clientsBudget?.toString() || "0");
      setProjectStatus({
        status: lead.project_status?.status || "",
        subStatus: lead.project_status?.subStatus || ""
      });
    }
  }, [isOpen, targetStatus, lead]);

  const buildStatusUpdate = (extra: UpdateLeadInput = {}): UpdateLeadInput => {
    const update: UpdateLeadInput = {
      ...extra,
      status: targetStatus,
    };

    if (targetStatusId) update.current_status_id = targetStatusId;
    if (targetStageId) update.current_stage_id = targetStageId;
    if (targetTransition?.requires_assignment && assignedTo) {
      update.current_owner_id = assignedTo;
    }

    return update;
  };

  const validateTransitionRequirements = () => {
    if (targetStatus === "Meeting Fixed") return true;

    if (targetTransition?.requires_note && !comment.trim()) {
      toast.error("A note is required for this transition");
      return false;
    }

    if (targetTransition?.requires_assignment && !assignedTo) {
      toast.error("Assignment is required for this transition");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateTransitionRequirements()) return;

    setLoading(true);
    try {
      let result;

      switch (targetStatus) {
        case "Number Collected":
          result = await addLeadPhone(lead.id, phone);
          if (result.success) {
            await addLeadComment(lead.id, comment || `Status changed to ${targetStatus}`);
            await updateLead(lead.id, buildStatusUpdate());
            await attachStatusNote(lead.id, comment || `Phone number collected`);
          }
          break;

        case "Call Reschedule":
        case "Call Rescheduled":
        case "Message Rescheduled":
          result = await addLeadFollowUp({
            leadId: lead.id,
            time: followUpTime,
            comment: comment
          });
          if (result.success) {
            await updateLead(lead.id, buildStatusUpdate());
            await attachStatusNote(lead.id, comment || `Follow-up scheduled`);
          }
          break;

        case "Ongoing":
          result = await updateLeadProjectStatus(
            lead.id,
            projectStatus.status,
            projectStatus.subStatus,
            comment
          );
          if (result.success && (targetStatusId || targetStageId)) {
            await updateLead(lead.id, buildStatusUpdate());
            await attachStatusNote(lead.id, comment || `Status set to Ongoing`);
          }
          break;

        case "Meeting Complete": {
          const meetingId = lead.meetings?.[0]?.id;
          if (!meetingId) {
            toast.error("No active meeting found to complete");
            setLoading(false);
            return;
          }
          result = await completeMeeting({
            meetingId,
            leadId: lead.id,
            projectValue: Number(projectValue),
            clientsBudget: Number(clientsBudget),
            followUpTime,
            comment
          });
          if (result.success && (targetStatusId || targetStageId)) {
            await updateLead(lead.id, buildStatusUpdate());
            await attachStatusNote(lead.id, comment || `Meeting completed`);
          }
          break;
        }

        case "Sold": {
          const activeMeetingId = lead.meetings?.[0]?.id;
          if (!activeMeetingId) {
            toast.error("No active meeting found to mark as sold");
            setLoading(false);
            return;
          }
          result = await markAsSold({
            meetingId: activeMeetingId,
            leadId: lead.id,
            projectValue: Number(projectValue),
            soldAmount: Number(paymentData.soldAmount),
            clientsBudget: Number(clientsBudget),
            soldDate: paymentData.soldDate,
            paymentAmount: Number(paymentData.paymentAmount),
            paymentMethod: paymentData.paymentMethod,
            paymentNote: paymentData.paymentNote,
            nextFollowUpTime: followUpTime,
            comment
          });
          if (
            result.success &&
            (targetTransition?.requires_assignment || targetStatusId || targetStageId)
          ) {
            await updateLead(lead.id, buildStatusUpdate());
            await attachStatusNote(lead.id, comment || `Lead marked as sold`);
          }
          break;
        }

        case "Prospect":
          result = await updateLead(lead.id, buildStatusUpdate({
            finance: {
              ...(lead.finance || {}),
              projectValue: Number(projectValue),
              clientsBudget: Number(clientsBudget)
            }
          }));
          if (result.success) {
            await addLeadComment(lead.id, comment);
            await addLeadFollowUp({ leadId: lead.id, time: followUpTime });
            await attachStatusNote(lead.id, comment || `Marked as prospect`);
          }
          break;

        case "Need Support":
          result = await updateLead(lead.id, buildStatusUpdate());
          if (result.success) {
            const supportNote = comment || "Support requested";
            await addLeadComment(lead.id, supportNote);
            await createSupportRequest({
              leadId: lead.id,
              subject: `Support needed: ${lead.name}`,
              description: supportNote,
              priority:
                lead.priority === "urgent" || lead.priority === "high"
                  ? lead.priority
                  : "normal",
              assignedTo: assignedTo || undefined,
            });
            await attachStatusNote(lead.id, supportNote);
          }
          break;

        default:
          result = await updateLead(lead.id, buildStatusUpdate());
          if (result.success) {
            const defaultNote = comment || `Status changed to ${targetStatus}`;
            await addLeadComment(lead.id, defaultNote);
            await attachStatusNote(lead.id, defaultNote);
            if (targetTransition?.requires_follow_up) {
              await addLeadFollowUp({ leadId: lead.id, time: followUpTime, comment });
            }
          }
          break;
      }

      if (result?.success) {
        toast.success(`Lead status updated to ${targetStatus}`);
        onUpdated?.();
        onClose();
      } else {
        toast.error(result?.error || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    const transitionFields = (
      <TransitionRequirementFields
        targetTransition={targetTransition}
        users={users}
        assignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        followUpTime={followUpTime}
        onFollowUpTimeChange={setFollowUpTime}
        showFollowUp={targetTransition?.requires_follow_up && !["Call Reschedule", "Call Rescheduled", "Message Rescheduled", "Meeting Complete", "Prospect", "Sold"].includes(targetStatus)}
      />
    );

    switch (targetStatus) {
      case "Number Collected":
        return (
          <div className="space-y-4">
            {transitionFields}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Phone Number*</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="+880..."
                required
              />
            </div>
            <CommentSection value={comment} onChange={setComment} />
          </div>
        );

      case "Call Reschedule":
      case "Call Rescheduled":
      case "Message Rescheduled":
        return (
          <div className="space-y-4">
            {transitionFields}
            <FollowUpSection value={followUpTime} onChange={setFollowUpTime} required />
            <CommentSection value={comment} onChange={setComment} />
          </div>
        );

      case "Ongoing":
        return (
          <div className="space-y-4">
            {transitionFields}
            <ProjectStatusSection 
              status={projectStatus.status}
              subStatus={projectStatus.subStatus}
              onStatusChange={val => setProjectStatus(prev => ({ ...prev, status: val, subStatus: "" }))}
              onSubStatusChange={val => setProjectStatus(prev => ({ ...prev, subStatus: val }))}
            />
            <CommentSection value={comment} onChange={setComment} />
          </div>
        );

      case "Meeting Complete":
      case "Prospect":
        return (
          <div className="space-y-4">
            {transitionFields}
            <ProjectFinancialsSection 
              projectValue={projectValue}
              clientsBudget={clientsBudget}
              onProjectValueChange={setProjectValue}
              onClientsBudgetChange={setClientsBudget}
              required={targetStatus === "Meeting Complete"}
            />
            <FollowUpSection value={followUpTime} onChange={setFollowUpTime} required />
            <CommentSection value={comment} onChange={setComment} required={targetStatus === "Meeting Complete"} />
          </div>
        );

      case "Sold":
        return (
          <div className="space-y-4">
            {transitionFields}
            <ProjectFinancialsSection 
              projectValue={projectValue}
              clientsBudget={clientsBudget}
              onProjectValueChange={setProjectValue}
              onClientsBudgetChange={setClientsBudget}
              required
            />
            <PaymentSection 
              data={paymentData}
              onChange={(f, v) => setPaymentData(prev => ({ ...prev, [f]: v }))}
            />
            <FollowUpSection value={followUpTime} onChange={setFollowUpTime} required />
            <CommentSection value={comment} onChange={setComment} required />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {transitionFields}
            <CommentSection value={comment} onChange={setComment} required={targetTransition?.requires_note} />
          </div>
        );
    }
  };

  // Special case for Meeting Fixed - we actually want to show the booking wizard
  // For now, I'll recommend the user use the "Book Meeting" button or I'll integrate it later.
  // The User specifically asked to implement "Meeting Fixed" as well in CreStatus.
  
  if (targetStatus === "Meeting Fixed") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-150 p-0 border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Meeting Fixed Appointment Wizard</DialogTitle>
          </DialogHeader>
          <MeetingFixedWizard
            lead={lead}
            onSuccess={() => {
              onClose();
              onUpdated?.();
            }}
            onCancel={onClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125 max-h-225 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Update Status to <span className="text-blue-600">{targetStatus}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderFormFields()}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-w-25">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransitionRequirementFields({
  targetTransition,
  users,
  assignedTo,
  onAssignedToChange,
  followUpTime,
  onFollowUpTimeChange,
  showFollowUp,
}: {
  targetTransition?: LifecycleTransitionRule;
  users: User[];
  assignedTo: string;
  onAssignedToChange: (value: string) => void;
  followUpTime: string;
  onFollowUpTimeChange: (value: string) => void;
  showFollowUp?: boolean;
}) {
  const requiresAssignment = Boolean(targetTransition?.requires_assignment);

  if (!requiresAssignment && !showFollowUp) return null;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      {requiresAssignment && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Assign Owner*</label>
          <UserSelect
            users={users}
            value={assignedTo}
            onSelect={onAssignedToChange}
            placeholder="Select responsible owner"
          />
        </div>
      )}
      {showFollowUp && (
        <FollowUpSection
          value={followUpTime}
          onChange={onFollowUpTimeChange}
          required
        />
      )}
    </div>
  );
}
