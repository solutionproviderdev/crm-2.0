"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, GitBranch, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  updatePipelineStatus,
  updateStatusTransition,
} from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Department,
  LifecycleStatusGroup,
  LifecycleStatusOption,
  LifecycleTransitionRule,
} from "@/lib/types";

interface PipelineSettingsDashboardProps {
  groups: LifecycleStatusGroup[];
  transitions: LifecycleTransitionRule[];
  departments: Department[];
  mode: "statuses" | "transitions";
}

export function PipelineSettingsDashboard({
  groups,
  transitions,
  departments,
  mode,
}: PipelineSettingsDashboardProps) {
  const statusById = new Map(
    groups.flatMap((group) => group.statuses.map((status) => [status.id, { status, group }] as const))
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-primary)]">
          Pipeline Settings
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
          {mode === "statuses" ? "Stages and Statuses" : "Status Transitions"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Configure lifecycle labels, default departments, and movement rules used by pipeline boards.
        </p>
      </header>

      {mode === "statuses" ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.id} className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
                <CardTitle className="flex items-center gap-2 text-sm font-black">
                  <Settings2 className="h-4 w-4 text-[var(--brand-primary)]" />
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
                {group.statuses.map((status) => (
                  <StatusRow key={status.id} status={status} departments={departments} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
            <CardTitle className="flex items-center gap-2 text-sm font-black">
              <GitBranch className="h-4 w-4 text-[var(--brand-primary)]" />
              Transition Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {transitions.map((transition) => (
              <TransitionRow
                key={transition.id}
                transition={transition}
                fromName={
                  transition.from_status_id
                    ? statusById.get(transition.from_status_id)?.status.name || "Unknown"
                    : "Any status"
                }
                toName={statusById.get(transition.to_status_id)?.status.name || "Unknown"}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusRow({
  status,
  departments,
}: {
  status: LifecycleStatusOption;
  departments: Department[];
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(status.name);
  const [departmentId, setDepartmentId] = useState(status.default_department_id || "none");
  const [isTerminal, setIsTerminal] = useState(status.is_terminal);
  const [isConversionPoint, setIsConversionPoint] = useState(status.is_conversion_point);

  function save() {
    startTransition(async () => {
      const result = await updatePipelineStatus({
        id: status.id,
        name,
        defaultDepartmentId: departmentId === "none" ? null : departmentId,
        isTerminal,
        isConversionPoint,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Status updated");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
      <div className="space-y-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} className="font-bold" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{status.description || status.code}</p>
      </div>

      <Select value={departmentId} onValueChange={setDepartmentId}>
        <SelectTrigger>
          <SelectValue placeholder="Default department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No default department</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <Checkbox checked={isTerminal} onCheckedChange={(checked) => setIsTerminal(checked === true)} />
          Terminal
        </label>
        <label className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <Checkbox
            checked={isConversionPoint}
            onCheckedChange={(checked) => setIsConversionPoint(checked === true)}
          />
          Conversion
        </label>
        <Button size="sm" onClick={save} disabled={isPending || !name.trim()}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Save
        </Button>
      </div>
    </div>
  );
}

function TransitionRow({
  transition,
  fromName,
  toName,
}: {
  transition: LifecycleTransitionRule;
  fromName: string;
  toName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [requiresNote, setRequiresNote] = useState(transition.requires_note);
  const [requiresAssignment, setRequiresAssignment] = useState(transition.requires_assignment);
  const [requiresFollowUp, setRequiresFollowUp] = useState(transition.requires_follow_up);

  function save() {
    startTransition(async () => {
      const result = await updateStatusTransition({
        id: transition.id,
        requiresNote,
        requiresAssignment,
        requiresFollowUp,
        isActive: true,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Transition updated");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-black text-slate-950 dark:text-slate-50">
          {fromName} &gt; {toName}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Rule controls what the status dialog requires before this move is accepted.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <Checkbox checked={requiresNote} onCheckedChange={(checked) => setRequiresNote(checked === true)} />
          Note
        </label>
        <label className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <Checkbox
            checked={requiresAssignment}
            onCheckedChange={(checked) => setRequiresAssignment(checked === true)}
          />
          Assignment
        </label>
        <label className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
          <Checkbox
            checked={requiresFollowUp}
            onCheckedChange={(checked) => setRequiresFollowUp(checked === true)}
          />
          Follow-up
        </label>
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Save
        </Button>
      </div>
    </div>
  );
}
