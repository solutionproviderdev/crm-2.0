"use client";

import { PackageSearch } from "lucide-react";
import type { Lead } from "@/lib/types";

interface PipelineGridBoardProps {
  /** Ordered stage names — defines the order of leads in the grid */
  stages: readonly string[];
  /** Grouped lead data keyed by stage */
  stageData: Record<string, Lead[]>;
  /** Card component to render per lead */
  renderCard: (lead: Lead) => React.ReactNode;
}

export function PipelineGridBoard({
  stages,
  stageData,
  renderCard,
}: PipelineGridBoardProps) {
  // Flatten all leads while maintaining the stage order
  const allLeads = stages.flatMap((stage) => stageData[stage] ?? []);

  if (allLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 border border-gray-100 rounded-2xl bg-white shadow-sm mt-4">
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <PackageSearch className="h-10 w-10 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-bold text-base">No leads found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4">
      {allLeads.map((lead) => (
        <div key={lead.id}>{renderCard(lead)}</div>
      ))}
    </div>
  );
}
