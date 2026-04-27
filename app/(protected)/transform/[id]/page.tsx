import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getTransformJob, getSignedUrl, approveJob, rejectJob, regenerateZone } from '@/app/actions/transform'
import { JobProgressTracker } from '@/components/transform/JobProgressTracker'
import { BeforeAfterSlider } from '@/components/transform/BeforeAfterSlider'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import { RejectDialog } from '@/components/transform/RejectDialog'
import { CheckCircle2, XCircle, RotateCcw, Clock, DollarSign } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

function formatDuration(s: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

function formatCost(job: { total_cost_usd: number | null; ai_model?: { cost_per_image_usd: number; display_name: string } | null }) {
  if (!job.total_cost_usd) return '—'
  const p = job.ai_model?.cost_per_image_usd
  const n = job.ai_model?.display_name ?? 'model'
  if (p) return `$${Number(job.total_cost_usd).toFixed(4)} (3 × ${n} @ $${Number(p).toFixed(3)}/image)`
  return `$${Number(job.total_cost_usd).toFixed(4)}`
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:      { label: 'Draft',         cls: 'bg-gray-100 text-gray-600' },
  queued:     { label: 'Queued',        cls: 'bg-blue-50 text-blue-600' },
  processing: { label: 'Processing',    cls: 'bg-amber-50 text-amber-600' },
  review:     { label: 'Under Review',  cls: 'bg-purple-50 text-purple-700' },
  approved:   { label: 'Approved',      cls: 'bg-green-50 text-green-700' },
  failed:     { label: 'Failed',        cls: 'bg-red-50 text-red-600' },
}

async function Content({ jobId }: { jobId: string }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return notFound()

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users').select('type, role:roles(permissions)').eq('id', session.user.id).single()

  const perms = (profile?.role as { permissions?: Record<string, Record<string, boolean>> } | null)?.permissions ?? {}
  const canReview = profile?.type === 'Admin' || perms['Transform Studio']?.['Review & Approve Jobs'] === true

  const result = await getTransformJob(jobId)
  if (!result.success || !result.data) return notFound()
  const job = result.data
  const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE['draft']

  const isProcessing = ['queued', 'processing'].includes(job.status)
  const hasOutput = ['review', 'approved'].includes(job.status) && job.output_image_path

  let sourceUrl = ''
  let outputUrl = ''
  if (job.source_file_path) {
    const r = await getSignedUrl('transform-sources', job.source_file_path)
    if (r.success) sourceUrl = r.url!
  }
  if (hasOutput && job.output_image_path) {
    const r = await getSignedUrl('transform-outputs', job.output_image_path)
    if (r.success) outputUrl = r.url!
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-gray-900">Job #{job.job_number}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>{badge.label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Created {new Date(job.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <Loader2 className="h-5 w-5 text-[#046288] animate-spin" />
            <h2 className="font-bold text-gray-900">Generation in Progress</h2>
          </div>
          <JobProgressTracker jobId={jobId} />
        </div>
      )}

      {hasOutput && sourceUrl && outputUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Before → After</h2>
          <BeforeAfterSlider beforeUrl={sourceUrl} afterUrl={outputUrl} />
        </div>
      )}

      {job.status === 'failed' && !hasOutput && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center space-y-2">
          <XCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="font-bold text-red-800">Generation Failed</p>
          {job.review_comment && <p className="text-sm text-red-600">{job.review_comment}</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: 'Cost', value: formatCost(job) },
          { icon: Clock, label: 'Duration', value: formatDuration(job.duration_seconds) },
          { icon: CheckCircle2, label: 'Status', value: badge.label },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#046288]/10">
              <Icon className="h-4 w-4 text-[#046288]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5 break-words">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {job.status === 'review' && (
        <div className="flex flex-wrap gap-3 justify-end">
          <form action={async () => { 'use server'; await regenerateZone(jobId, 'lower') }}>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-all">
              <RotateCcw className="h-4 w-4" /> Regenerate Lower
            </button>
          </form>
          {canReview && (
            <>
              <RejectDialog jobId={jobId} />
              <form action={async () => { 'use server'; await approveJob(jobId) }}>
                <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]">
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {job.status === 'failed' && (job.steps?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Generation Steps</h2>
          <JobProgressTracker jobId={jobId} />
        </div>
      )}
    </div>
  )
}

export default async function TransformDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="py-8 px-4 w-full">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#046288]" /></div>}>
        <Content jobId={id} />
      </Suspense>
    </div>
  )
}
