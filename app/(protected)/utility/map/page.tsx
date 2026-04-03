import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMapData, getDivisions, getDistrictsByDivision } from "@/app/actions/utility/map";
import { MapClient } from "@/components/utility/MapClient";

export const metadata = {
  title: 'Map Utility - EaseIT CRM',
  description: 'Manage Divisions, Districts, and Visit Charges',
};

async function MapDataWrapper() {
  // Fetch required data in parallel
  const [mapData, divisions] = await Promise.all([
    getMapData(),
    getDivisions()
  ]);

  // For districts, since the UI allows adding areas to any district within the 
  // currently selected division, it's easier to preload all districts here 
  // or fetch them dynamically in MapClient. Since data size is small, we'll
  // preload all of them by running queries for all divisions.
  const districtsPromises = divisions.map(div => getDistrictsByDivision(div.id));
  const groupedDistricts = await Promise.all(districtsPromises);
  const allDistricts = groupedDistricts.flat();

  return (
    <MapClient 
      initialMapData={mapData} 
      divisions={divisions} 
      districts={allDistricts} 
    />
  );
}

function MapSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm ring-1 ring-[var(--brand-primary)]/10 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default async function MapUtilityPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams to opt into dynamic rendering properly in Next 15+ 
  await props.searchParams;

  return (
    <main className="h-[calc(100vh-4rem)] p-2 md:p-4">
      <Suspense fallback={<MapSkeleton />}>
        <MapDataWrapper />
      </Suspense>
    </main>
  );
}
