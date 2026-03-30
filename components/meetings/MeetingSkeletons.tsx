import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

export function MeetingListSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-min">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-[240px]">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Top Left: Lead Profile */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-16 rounded-md opacity-60" />
                </div>
              </div>
              <Skeleton className="h-3 w-32 rounded-md mt-2" />
              <div className="flex gap-2 mt-auto pb-2">
                 <Skeleton className="h-6 w-16 rounded-lg" />
                 <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            </div>

            {/* Top Right: Status & Requirements */}
            <div className="flex flex-col items-end gap-3 text-right">
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-12 w-full rounded-xl opacity-30" />
            </div>

            {/* Bottom Left: Finance & Projects */}
            <div className="flex flex-col justify-end gap-2 border-t pt-3">
              <Skeleton className="h-3 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-lg mt-1" />
            </div>

            {/* Bottom Right: Team & Actions */}
            <div className="flex flex-col justify-end items-end gap-3 border-t pt-3">
              <div className="flex -space-x-2">
                <Skeleton className="h-8 w-8 rounded-full border-2 border-white" />
                <Skeleton className="h-8 w-8 rounded-full border-2 border-white" />
              </div>
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetingGridSkeleton() {
  return (
    <div className="flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-[600px]">
      {/* Left Column: Sales Team */}
      <div className="w-16 md:w-48 border-r border-slate-100 flex flex-col pt-[53px]">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 border-b border-slate-50 flex items-center px-4 gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <Skeleton className="h-4 w-24 rounded-lg hidden md:block" />
          </div>
        ))}
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Header: Time slots */}
        <div className="h-12 border-b border-slate-100 bg-slate-50/50 flex whitespace-nowrap overflow-x-auto no-scrollbar">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="min-w-32 border-r border-slate-100 flex items-center justify-center">
              <Skeleton className="h-4 w-12 rounded-lg" />
            </div>
          ))}
        </div>
        
        {/* Cells */}
        <div className="flex-1 grid grid-cols-12 grid-rows-8 gap-px bg-slate-50">
          {[...Array(96)].map((_, i) => (
            <div key={i} className="bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
