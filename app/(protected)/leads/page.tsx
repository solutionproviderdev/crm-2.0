import { Suspense } from 'react';
import {
  getFilteredLeads,
  getLeadFilterOptions,
  getLeadStatusCounts,
  getAllActiveUsers
} from '@/app/actions/leads';
import { LeadsPageContent } from '@/components/leads/LeadsPageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface LeadsPageProps {
	searchParams: Promise<{
		page?: string;
		limit?: string;
		status?: string;
		source?: string;
		startDate?: string;
		endDate?: string;
		creId?: string;
		salesId?: string;
		search?: string;
		sortBy?: string;
		order?: string;
	}>;
}

export const metadata = {
	title: 'Lead Management | EaseIT CRM',
	description: 'Manage, track and convert sales leads',
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
	const params = await searchParams;

	const today = format(new Date(), "yyyy-MM-dd");
	const filterParams = {
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 20,
    status: params.status === 'all' ? undefined : params.status,
    source: params.source === 'all' ? undefined : params.source,
    creId: params.creId === 'all' ? undefined : params.creId,
    salesExecutiveId: params.salesId === 'all' ? undefined : params.salesId,
    search: params.search || undefined,
    startDate: params.search ? params.startDate : (params.startDate || today),
    endDate: params.search ? params.endDate : (params.endDate || today),
    sortBy: params.sortBy || 'created_at',
    sortOrder: (params.order as 'asc' | 'desc') || 'desc',
  };

	// Parallel data fetching — each is independently cached:
	// - getFilteredLeads: cached per filter combination, short TTL
	// - getLeadFilterOptions: cached for hours (rarely changes)
	// - getLeadStatusCounts: cached separately so chart shows true totals, not page totals
	// - getAllActiveUsers: cached for hours (user roster changes infrequently)
	const [leadsResult, filterOptionsResult, statusCountsResult, usersResult] = await Promise.all([
		getFilteredLeads(filterParams),
		getLeadFilterOptions(),
		getLeadStatusCounts(),
		getAllActiveUsers(),
	]);

	if (!leadsResult.success) {
		return (
			<div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
				Error loading leads: {leadsResult.error}
			</div>
		);
	}

	const allUsers = usersResult.success ? usersResult.data : [];

	return (
		<div className="mx-auto py-8 px-4 w-full">
			<Suspense fallback={<LeadsSkeleton />}>
				<LeadsPageContent
					initialData={{
						leads: leadsResult.data.leads,
						total: leadsResult.data.total,
						totalPages: leadsResult.data.totalPages,
						filters: filterOptionsResult.success
							? filterOptionsResult.data
							: { statuses: [], sources: [] },
						statusCounts: statusCountsResult.success
							? statusCountsResult.data
							: [],
					}}
					users={allUsers}
				/>
			</Suspense>
		</div>
	);
}

function LeadsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64 rounded-lg" />
					<Skeleton className="h-4 w-40 rounded-lg" />
				</div>
				<Skeleton className="h-10 w-48 rounded-lg" />
			</div>
			<Skeleton className="h-[300px] w-full rounded-2xl" />
			<div className="flex gap-4">
				<Skeleton className="h-10 flex-1 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
				<Skeleton className="h-10 w-32 rounded-lg" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
				{[...Array(8)].map((_, i) => (
					<Skeleton key={i} className="h-64 w-full rounded-2xl" />
				))}
			</div>
		</div>
	);
}
