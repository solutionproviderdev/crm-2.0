"use client";

import { useState, useTransition, useEffect } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { IMPLEMENTATION_STAGES } from "@/lib/pipeline-stages";
import { getPipelineLeads } from "@/app/actions/leads";
import { PipelineFilters } from "./PipelineFilters";
import { PipelineStageBoard } from "./PipelineStageBoard";
import { PipelineGridBoard } from "./PipelineGridBoard";
import { ProjectPipelineCard } from "./ProjectPipelineCard";
import type { Lead, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Construction } from "lucide-react";

interface ProjectPipelineContentProps {
  initialData: Record<string, Lead[]>;
  users: User[];
  userId: string;
  isAdmin: boolean;
}

function PipelineSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {IMPLEMENTATION_STAGES.map((stage) => (
        <div key={stage} className="w-72 shrink-0 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProjectPipelineContent({
  initialData,
  users,
  userId,
  isAdmin,
}: ProjectPipelineContentProps) {
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
        stages: IMPLEMENTATION_STAGES,
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
  }, [status, creId, salesId, startDate, endDate, userId, isAdmin]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-(--brand-primary)/10 p-2.5 rounded-xl border border-(--brand-primary)/20">
            <Construction className="h-6 w-6 text-(--brand-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Project Pipeline</h1>
            <p className="text-sm text-gray-500 font-medium">
              {Object.values(stageData).reduce((s, a) => s + a.length, 0)} leads across {IMPLEMENTATION_STAGES.length} implementation stages
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <PipelineFilters stages={IMPLEMENTATION_STAGES} users={users} isAdmin={isAdmin} />

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Board */}
      {isPending ? (
        <PipelineSkeleton />
      ) : layout === "grid" ? (
        <PipelineGridBoard
          stages={IMPLEMENTATION_STAGES}
          stageData={stageData}
          renderCard={(lead) => <ProjectPipelineCard lead={lead} />}
        />
      ) : (
        <PipelineStageBoard
          stages={IMPLEMENTATION_STAGES}
          stageData={stageData}
          renderCard={(lead) => <ProjectPipelineCard lead={lead} />}
        />
      )}
    </div>
  );
}
