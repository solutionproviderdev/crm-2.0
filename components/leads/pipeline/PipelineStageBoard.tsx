"use client";

import { cn } from "@/utils/cn";
import { getStageConfig } from "@/lib/pipeline-stages";
import type { Lead } from "@/lib/types";
import { PackageSearch } from "lucide-react";

interface PipelineStageBoardProps {
  /** Ordered stage names — defines column order */
  stages: readonly string[];
  /** Grouped lead data keyed by stage */
  stageData: Record<string, Lead[]>;
  /** Card component to render per lead */
  renderCard: (lead: Lead) => React.ReactNode;
}

export function PipelineStageBoard({
  stages,
  stageData,
  renderCard,
}: PipelineStageBoardProps) {
  const totalLeads = Object.values(stageData).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div
        className="flex gap-4 min-w-max"
        style={{ minHeight: "calc(100vh - 280px)" }}
      >
        {stages.map((stage) => {
          const leads = stageData[stage] ?? [];
          const config = getStageConfig(stage);
          const Icon = config.icon;

          return (
            <div
              key={stage}
              className="flex flex-col w-72 shrink-0 rounded-2xl border border-gray-100 shadow-sm bg-gray-50/60 overflow-hidden"
            >
              {/* Column Header */}
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 border-b border-gray-100",
                  config.headerBg
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg bg-white/60", config.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-extrabold uppercase tracking-tight",
                      config.color
                    )}
                  >
                    {stage}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full",
                    config.bg,
                    config.color,
                    "border",
                    config.border
                  )}
                >
                  {leads.length}
                </span>
              </div>

              {/* Card List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-320px)] custom-scrollbar">
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <div className="p-3 rounded-full bg-gray-100">
                      <PackageSearch className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-[11px] font-semibold text-gray-400">
                      No leads here
                    </p>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <div key={lead.id}>{renderCard(lead)}</div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No results at all state */}
      {totalLeads === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="p-5 rounded-2xl bg-gray-100 border border-gray-200">
            <PackageSearch className="h-10 w-10 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-bold text-base">No leads found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
