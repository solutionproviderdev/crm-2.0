"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Lock, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { getStageConfig } from "@/lib/pipeline-stages";
import type {
  Lead,
  LifecycleStatusGroup,
  LifecycleStatusOption,
  LifecycleTransitionRule,
  User,
} from "@/lib/types";
import { StatusActionDialog } from "../status-modals/StatusActionDialog";

interface LifecyclePipelineBoardProps {
  stages: readonly string[];
  stageData: Record<string, Lead[]>;
  lifecycleStatusGroups: LifecycleStatusGroup[];
  lifecycleTransitionRules: LifecycleTransitionRule[];
  users: User[];
  renderCard: (lead: Lead) => ReactNode;
  onUpdated?: () => void;
}

interface SelectedMove {
  lead: Lead;
  targetStatus: LifecycleStatusOption;
  targetStage: LifecycleStatusGroup;
  transition: LifecycleTransitionRule;
}

const legacyStatusNames: Record<string, string> = {
  "Call Reschedule": "Call Rescheduled",
  Close: "Closed",
  "Mesurement Done": "Measurement Done",
};

const normalizeStatusName = (status: string) => legacyStatusNames[status] || status;

export function LifecyclePipelineBoard({
  stages,
  stageData,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
  users,
  renderCard,
  onUpdated,
}: LifecyclePipelineBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedMove, setSelectedMove] = useState<SelectedMove | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const statusLookup = useMemo(() => {
    const flattened = lifecycleStatusGroups.flatMap((group) =>
      group.statuses.map((status) => ({ group, status }))
    );

    return {
      byId: new Map(flattened.map((item) => [item.status.id, item])),
      byName: new Map(flattened.map((item) => [item.status.name, item])),
    };
  }, [lifecycleStatusGroups]);

  const columns = stages.map((stage) => {
    const matched = statusLookup.byName.get(stage);
    return {
      name: stage,
      status: matched?.status,
      group: matched?.group,
      leads: stageData[stage] ?? [],
    };
  });

  const getLeadStatus = (lead: Lead) => {
    if (lead.current_status_id) {
      const byId = statusLookup.byId.get(lead.current_status_id);
      if (byId) return byId;
    }

    return statusLookup.byName.get(normalizeStatusName(lead.status));
  };

  const findAllowedMove = (lead: Lead, targetStatusId: string) => {
    const current = getLeadStatus(lead);
    if (!current) return null;

    return lifecycleTransitionRules.find(
      (rule) =>
        rule.from_status_id === current.status.id &&
        rule.to_status_id === targetStatusId
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const lead = findLeadById(String(event.active.id), stageData);
    setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const lead = activeLead;
    setActiveLead(null);

    if (!lead || !event.over) return;

    const targetStatusId = String(event.over.id).replace("status:", "");
    const target = statusLookup.byId.get(targetStatusId);
    if (!target) return;

    const current = getLeadStatus(lead);
    if (current?.status.id === target.status.id) return;

    const transition = findAllowedMove(lead, target.status.id);
    if (!transition) {
      toast.error(`Invalid move: ${current?.status.name || lead.status} -> ${target.status.name}`);
      return;
    }

    setSelectedMove({
      lead,
      targetStatus: target.status,
      targetStage: target.group,
      transition,
    });
  };

  const totalLeads = Object.values(stageData).reduce(
    (sum, leads) => sum + leads.length,
    0
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveLead(null)}
      >
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <div
            className="flex min-w-max gap-4"
            style={{ minHeight: "calc(100vh - 280px)" }}
          >
            {columns.map((column) => (
              <PipelineDropColumn
                key={column.name}
                stage={column.name}
                statusId={column.status?.id}
                leads={column.leads}
                renderCard={renderCard}
              />
            ))}
          </div>
        </div>

        {totalLeads === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="rounded-2xl border border-gray-200 bg-gray-100 p-5">
              <PackageSearch className="h-10 w-10 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-700">No leads found</p>
              <p className="mt-1 text-sm text-gray-400">
                Try adjusting your filters or check back later.
              </p>
            </div>
          </div>
        )}

        <DragOverlay>
          {activeLead ? (
            <div className="w-72 rotate-1 opacity-95 shadow-2xl">
              {renderCard(activeLead)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedMove && (
        <StatusActionDialog
          isOpen
          onClose={() => setSelectedMove(null)}
          lead={selectedMove.lead}
          targetStatus={selectedMove.targetStatus.name}
          targetStatusId={selectedMove.targetStatus.id}
          targetStageId={selectedMove.targetStage.id}
          targetTransition={selectedMove.transition}
          users={users}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}

function PipelineDropColumn({
  stage,
  statusId,
  leads,
  renderCard,
}: {
  stage: string;
  statusId?: string;
  leads: Lead[];
  renderCard: (lead: Lead) => ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `status:${statusId || stage}`,
    disabled: !statusId,
  });
  const config = getStageConfig(stage);
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/60 shadow-sm transition",
        isOver && "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/5 ring-2 ring-[var(--brand-primary)]/15"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-gray-100 px-4 py-3",
          config.headerBg
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn("rounded-lg bg-white/60 p-1.5", config.color)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span
            className={cn(
              "truncate text-xs font-extrabold uppercase tracking-tight",
              config.color
            )}
          >
            {stage}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-black",
            config.bg,
            config.color,
            config.border
          )}
        >
          {leads.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 max-h-[calc(100vh-320px)] custom-scrollbar">
        {!statusId && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
            <Lock className="h-4 w-4" />
            Missing lifecycle status id.
          </div>
        )}
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="rounded-full bg-gray-100 p-3">
              <PackageSearch className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400">
              Drop valid records here
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <DraggableLeadCard key={lead.id} lead={lead}>
              {renderCard(lead)}
            </DraggableLeadCard>
          ))
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({
  lead,
  children,
}: {
  lead: Lead;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      className={cn(
        "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

function findLeadById(id: string, stageData: Record<string, Lead[]>) {
  for (const leads of Object.values(stageData)) {
    const lead = leads.find((item) => item.id === id);
    if (lead) return lead;
  }
  return null;
}
