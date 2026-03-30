import { getLeadDetails, getAllActiveUsers } from "@/app/actions/leads";
import { notFound } from "next/navigation";
import { GeneralInfo } from "@/components/leads/GeneralInfo";
import { LeadDetailsTabs } from "@/components/leads/LeadDetailsTabs";
import { MeetingList } from "@/components/leads/MeetingList";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const [result, usersRes] = await Promise.all([
    getLeadDetails(id),
    getAllActiveUsers()
  ]);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const lead = result.data;
  const allUsers = usersRes.success ? usersRes.data : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* Top Header/Breadcrumb */}
      <div className="h-16 border-b bg-white flex items-center px-6 shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/leads">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{lead.name}</h1>
            <p className="text-xs text-slate-500 font-medium">{lead.cid || "Pending CID"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Core Info & Meetings (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <GeneralInfo lead={lead} allUsers={allUsers} />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <MeetingList meetings={lead.meetings || []} leadId={lead.id} />
            </Suspense>
          </div>

          {/* Right Column: Tabs (Comments, Follow-ups, Finance) (4/12) */}
          <div className="lg:col-span-4">
            <Suspense fallback={<Skeleton className="h-150 w-full" />}>
              <LeadDetailsTabs lead={lead} />
            </Suspense>
          </div>

        </div>
      </div>
    </div>
  );
}
