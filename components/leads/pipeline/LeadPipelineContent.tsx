"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { AlertCircle, Users } from "lucide-react";
import { getPipelineLeads } from "@/app/actions/leads";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead, LifecycleStatusGroup, LifecycleTransitionRule, User } from "@/lib/types";
import { PipelineFilters } from "./PipelineFilters";
import { PipelineGridBoard } from "./PipelineGridBoard";
import { LifecyclePipelineBoard } from "./LifecyclePipelineBoard";
import { ClientPipelineCard } from "./ClientPipelineCard";

interface LeadPipelineContentProps {
  initialData: Record<string, Lead[]>;
  stages: string[];
  users: User[];
  userId: string;
  isAdmin: boolean;
  lifecycleStatusGroups: LifecycleStatusGroup[];
  lifecycleTransitionRules: LifecycleTransitionRule[];
}

function PipelineSkeleton({ stages }: { stages: string[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div key={stage} className="w-72 shrink-0 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LeadPipelineContent({
  initialData,
  stages,
  users,
  userId,
  isAdmin,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
}: LeadPipelineContentProps) {
  const [stageData, setStageData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [status] = useQueryState("status", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [creId] = useQueryState("creId", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [salesId] = useQueryState("salesId", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [startDate] = useQueryState("startDate", parseAsString.withOptions({ shallow: false }));
  const [endDate] = useQueryState("endDate", parseAsString.withOptions({ shallow: false }));
  const [layout] = useQueryState("layout", parseAsString.withDefault("kanban").withOptions({ shallow: false }));

  const refreshBoard = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const result = await getPipelineLeads({
        stages,
        stageCode: "lead",
        status: status !== "all" ? status : undefined,
        creId: creId !== "all" ? creId : undefined,
        salesExecutiveId: salesId !== "all" ? salesId : undefined,
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        userId,
        isAdmin,
      });

      if (result.success) {
        setStageData(result.data);
      } else {
        setError(result.error);
      }
    });
  }, [creId, endDate, isAdmin, salesId, stages, startDate, status, userId]);

  useEffect(() => {
    refreshBoard();
  }, [refreshBoard]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-(--brand-primary)/20 bg-(--brand-primary)/10 p-2.5">
            <Users className="h-6 w-6 text-(--brand-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lead Pipeline</h1>
            <p className="text-sm font-medium text-gray-500">
              {Object.values(stageData).reduce((sum, leads) => sum + leads.length, 0)} leads across {stages.length} lead statuses
            </p>
          </div>
        </div>
      </div>

      <PipelineFilters stages={stages} users={users} isAdmin={isAdmin} />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {isPending ? (
        <PipelineSkeleton stages={stages} />
      ) : layout === "grid" ? (
        <PipelineGridBoard
          stages={stages}
          stageData={stageData}
          renderCard={(lead) => <ClientPipelineCard lead={lead} lifecycleStatusGroups={lifecycleStatusGroups} />}
        />
      ) : (
        <LifecyclePipelineBoard
          stages={stages}
          stageData={stageData}
          lifecycleStatusGroups={lifecycleStatusGroups}
          lifecycleTransitionRules={lifecycleTransitionRules}
          users={users}
          renderCard={(lead) => <ClientPipelineCard lead={lead} lifecycleStatusGroups={lifecycleStatusGroups} />}
          onUpdated={refreshBoard}
        />
      )}
    </div>
  );
}
