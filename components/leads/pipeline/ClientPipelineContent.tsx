"use client";

import { useState, useTransition, useEffect } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { getPipelineLeads } from "@/app/actions/leads";
import { PipelineFilters } from "./PipelineFilters";
import { PipelineGridBoard } from "./PipelineGridBoard";
import { LifecyclePipelineBoard } from "./LifecyclePipelineBoard";
import { ClientPipelineCard } from "./ClientPipelineCard";
import type { Lead, LifecycleStatusGroup, LifecycleTransitionRule, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Handshake } from "lucide-react";

interface ClientPipelineContentProps {
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

export function ClientPipelineContent({
  initialData,
  stages,
  users,
  userId,
  isAdmin,
  lifecycleStatusGroups,
  lifecycleTransitionRules,
}: ClientPipelineContentProps) {
  const [stageData, setStageData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [status] = useQueryState("status", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [creId] = useQueryState("creId", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [salesId] = useQueryState("salesId", parseAsString.withDefault("all").withOptions({ shallow: false }));
  const [startDate] = useQueryState("startDate", parseAsString.withOptions({ shallow: false }));
  const [endDate] = useQueryState("endDate", parseAsString.withOptions({ shallow: false }));
  const [layout] = useQueryState("layout", parseAsString.withDefault("kanban").withOptions({ shallow: false }));

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      const result = await getPipelineLeads({
        stages,
        stageCode: "client",
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
  }, [status, creId, salesId, startDate, endDate, userId, isAdmin, stages]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-(--brand-primary)/10 p-2.5 rounded-xl border border-(--brand-primary)/20">
            <Handshake className="h-6 w-6 text-(--brand-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Client Pipeline</h1>
            <p className="text-sm text-gray-500 font-medium">
              {Object.values(stageData).reduce((s, a) => s + a.length, 0)} leads across {stages.length} client statuses
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <PipelineFilters stages={stages} users={users} isAdmin={isAdmin} />

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Board */}
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
          onUpdated={() => {
            startTransition(async () => {
              const result = await getPipelineLeads({
                stages,
                stageCode: "client",
                status: status !== "all" ? status : undefined,
                creId: creId !== "all" ? creId : undefined,
                salesExecutiveId: salesId !== "all" ? salesId : undefined,
                startDate: startDate ?? undefined,
                endDate: endDate ?? undefined,
                userId,
                isAdmin,
              });
              if (result.success) setStageData(result.data);
            });
          }}
        />
      )}
    </div>
  );
}
