import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getEmployeeById } from "@/lib/supabase/employees";
import { getCurrentUser } from "@/app/actions/auth";
import { UserProfileClient } from "@/components/users/UserProfileClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const result = await getEmployeeById(userId);
  return {
    title: result.success
      ? `${result.data.name} | EaseIT CRM`
      : "Employee Profile | EaseIT CRM",
  };
}

/**
 * UserContent
 * ─────────────────────────────────────────────────────────────────────────────
 * Async Server Component that fetches user data inside the Suspense boundary.
 * getUserById uses cookies() (user-scoped RLS client), so it is dynamic data
 * that must not be called at the page shell level in Next.js 16.
 */
async function UserContent({ userId }: { userId: string }) {
  const [result, currentUser] = await Promise.all([
    getEmployeeById(userId),
    getCurrentUser(),
  ]);
  
  if (!result.success) notFound();
  
  const isAdmin = currentUser?.type === "Admin";
  
  return <UserProfileClient user={result.data} isAdmin={isAdmin} />;
}

/**
 * UserProfilePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Static shell — only unwraps `params`. All dynamic fetching happens inside
 * <Suspense> via UserContent to avoid blocking the route.
 */
export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-6 animate-pulse">
          {/* Cover skeleton */}
          <div className="h-44 rounded-2xl bg-gray-200" />
          {/* Avatar + name skeleton */}
          <div className="flex items-end gap-4 -mt-10 px-2">
            <div className="h-24 w-24 rounded-2xl bg-gray-200 border-4 border-white shadow-lg shrink-0" />
            <div className="space-y-2 pb-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          {/* Tabs skeleton */}
          <div className="flex gap-4 border-b pb-0">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <UserContent userId={userId} />
    </Suspense>
  );
}
