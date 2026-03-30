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
import { Lead } from "@/lib/types";
import { 
  addLeadComment, 
  addLeadPhone, 
  completeMeeting, 
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

interface StatusActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  targetStatus: string;
}

export function StatusActionDialog({ 
  isOpen, 
  onClose, 
  lead, 
  targetStatus 
}: StatusActionDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [followUpTime, setFollowUpTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
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

  // Reset form when targetStatus or lead changes
  useEffect(() => {
    if (isOpen) {
      setComment("");
      setPhone("");
      setFollowUpTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setProjectValue(lead.finance?.projectValue?.toString() || "0");
      setClientsBudget(lead.finance?.clientsBudget?.toString() || "0");
      setProjectStatus({
        status: lead.project_status?.status || "",
        subStatus: lead.project_status?.subStatus || ""
      });
    }
  }, [isOpen, targetStatus, lead]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result;

      switch (targetStatus) {
        case "Number Collected":
          result = await addLeadPhone(lead.id, phone);
          if (result.success) {
            await addLeadComment(lead.id, comment || `Status changed to ${targetStatus}`);
            await updateLead(lead.id, { status: targetStatus });
          }
          break;

        case "Call Reschedule":
        case "Message Rescheduled":
          result = await addLeadFollowUp({ 
            leadId: lead.id, 
            time: followUpTime, 
            comment: comment 
          });
          if (result.success) {
            await updateLead(lead.id, { status: targetStatus });
          }
          break;

        case "Ongoing":
          result = await updateLeadProjectStatus(
            lead.id, 
            projectStatus.status, 
            projectStatus.subStatus, 
            comment
          );
          break;

        case "Meeting Complete":
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
          break;

        case "Sold":
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
          break;

        case "Prospect":
          result = await updateLead(lead.id, { 
            status: targetStatus,
            finance: {
              ...(lead.finance || {}),
              projectValue: Number(projectValue),
              clientsBudget: Number(clientsBudget)
            }
          });
          if (result.success) {
            await addLeadComment(lead.id, comment);
            await addLeadFollowUp({ leadId: lead.id, time: followUpTime });
          }
          break;

        default:
          // Simple status change with comment
          result = await updateLead(lead.id, { status: targetStatus });
          if (result.success) {
            await addLeadComment(lead.id, comment || `Status changed to ${targetStatus}`);
          }
          break;
      }

      if (result?.success) {
        toast.success(`Lead status updated to ${targetStatus}`);
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
    switch (targetStatus) {
      case "Number Collected":
        return (
          <div className="space-y-4">
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
      case "Message Rescheduled":
        return (
          <div className="space-y-4">
            <FollowUpSection value={followUpTime} onChange={setFollowUpTime} required />
            <CommentSection value={comment} onChange={setComment} />
          </div>
        );

      case "Ongoing":
        return (
          <div className="space-y-4">
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
        return <CommentSection value={comment} onChange={setComment} />;
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
