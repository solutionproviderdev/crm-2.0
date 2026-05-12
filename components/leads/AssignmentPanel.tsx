"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shuffle, UserRound } from "lucide-react";
import { toast } from "sonner";
import { reassignLeadOwner } from "@/app/actions/leads";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Department, Lead, LeadLifecycleAssignment, User } from "@/lib/types";
import { UserSelect } from "./UserSelect";

interface AssignmentPanelProps {
  lead: Lead;
  users: User[];
  departments: Department[];
  assignments: LeadLifecycleAssignment[];
}

export function AssignmentPanel({
  lead,
  users,
  departments,
  assignments,
}: AssignmentPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(
    lead.current_owner_id || lead.sales_executive_id || lead.cre_id || ""
  );
  const [departmentId, setDepartmentId] = useState(lead.current_department_id || "");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentOwner = useMemo(
    () =>
      users.find(
        (user) =>
          user.id === (lead.current_owner_id || lead.sales_executive_id || lead.cre_id)
      ) || null,
    [lead, users]
  );

  const currentDepartment =
    departments.find((department) => department.id === lead.current_department_id) ||
    currentOwner?.department ||
    null;

  const currentAssignment = assignments.find((assignment) => assignment.is_current);

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error("Select an owner");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    startTransition(async () => {
      const result = await reassignLeadOwner({
        leadId: lead.id,
        assignedTo: selectedUserId,
        departmentId: departmentId || null,
        reason,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Owner reassigned");
      setOpen(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3 text-sm font-black">
            <span className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[var(--brand-primary)]" />
              Assignment
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-full text-xs font-black"
              onClick={() => setOpen(true)}
            >
              <Shuffle className="h-3.5 w-3.5" />
              Reassign
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm dark:border-slate-950">
              <AvatarImage src={currentOwner?.profile_picture || ""} />
              <AvatarFallback className="bg-[var(--brand-primary)] text-xs font-black text-white">
                {currentOwner?.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                {currentOwner?.name || "Unassigned"}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {currentDepartment?.name || "No department"} / {currentOwner?.role?.name || "No role"}
              </p>
            </div>
            <Badge variant="outline" className="rounded-full text-[10px] font-black">
              Current
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <AssignmentStat label="History" value={assignments.length} />
            <AssignmentStat
              label="Assigned"
              value={
                currentAssignment
                  ? new Date(currentAssignment.assigned_at).toLocaleDateString()
                  : "None"
              }
            />
          </div>

          {currentAssignment?.reason && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {currentAssignment.reason}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reassign Owner</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-bold">New owner</label>
              <UserSelect
                users={users}
                value={selectedUserId}
                onSelect={setSelectedUserId}
                placeholder="Select responsible owner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Department</label>
              <Select value={departmentId || "auto"} onValueChange={(value) => setDepartmentId(value === "auto" ? "" : value)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Use owner department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Use owner department</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Reason*</label>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why is this record being reassigned?"
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssignmentStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
