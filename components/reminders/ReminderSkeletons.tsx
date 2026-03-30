import { Skeleton } from "@/components/ui/skeleton";

export function ReminderStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-50" />
            <div className="w-4 h-4 rounded-full bg-slate-50" />
          </div>
          <div className="h-6 w-12 bg-slate-50 rounded-lg mb-1" />
          <div className="h-3 w-20 bg-slate-50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function ReminderCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-50" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-50 rounded-md" />
            <div className="h-3 w-16 bg-slate-50 rounded-md" />
          </div>
        </div>
        <div className="w-16 h-6 rounded-xl bg-slate-50" />
      </div>
      
      <div className="space-y-2.5">
        <div className="h-3 w-full bg-slate-50 rounded-md" />
        <div className="h-3 w-2/3 bg-slate-50 rounded-md" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <div className="h-8 flex-1 bg-slate-50 rounded-xl" />
        <div className="h-8 w-8 bg-slate-50 rounded-xl" />
        <div className="h-8 w-8 bg-slate-50 rounded-xl" />
      </div>
    </div>
  );
}

export function RemindersListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ReminderCardSkeleton key={i} />
      ))}
    </div>
  );
}
