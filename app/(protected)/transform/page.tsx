import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Wand2 } from 'lucide-react'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getTransformJobs } from '@/app/actions/transform'
import { JobCard } from '@/components/transform/JobCard'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Transform Studio | EaseIT CRM',
  description: 'AI-powered kitchen cabinet visualisation',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Queued', value: 'queued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Review', value: 'review' },
  { label: 'Approved', value: 'approved' },
]

async function TransformContent({ status }: { status: string }) {
  const result = await getTransformJobs(status === 'all' ? undefined : status)
  const jobs = result.success ? (result.data ?? []) : []

  if (!result.success) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        Error loading jobs: {result.error}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="p-5 rounded-3xl bg-[#046288]/10">
          <Wand2 className="h-10 w-10 text-[#046288]" />
        </div>
        <h2 className="text-lg font-black text-gray-900">No jobs yet</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Start a new transformation to visualise cabinet upgrades on a customer photo.
        </p>
        <Link
          href="/transform/new"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#046288] hover:bg-[#034e6d] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}

export default async function TransformPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? 'all'

  return (
    <div className="mx-auto py-8 px-4 w-full max-w-7xl">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#046288]/10 text-[#046288]">
              <Wand2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Transform Studio</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            AI-powered kitchen cabinet visualisation
          </p>
        </div>
        <Link
          href="/transform/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#046288] hover:bg-[#034e6d] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      {/* ── Status filter tabs ────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/transform?status=${tab.value}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              status === tab.value
                ? 'bg-[#046288] text-white shadow-md shadow-[#046288]/20'
                : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-100 hover:border-gray-200'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* ── Jobs list ─────────────────────────────────────────────── */}
      <Suspense fallback={<TransformListSkeleton />}>
        <TransformContent status={status} />
      </Suspense>
    </div>
  )
}

function TransformListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  )
}
