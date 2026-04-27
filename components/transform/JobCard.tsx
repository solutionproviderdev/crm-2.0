import Link from 'next/link'
import { Clock, DollarSign, ArrowRight } from 'lucide-react'
import type { TransformJob } from '@/app/actions/transform'

interface Props {
  job: TransformJob
}

const STATUS_CONFIG: Record<string, { label: string; dotCls: string; cardCls: string }> = {
  draft:      { label: 'Draft',         dotCls: 'bg-gray-400',   cardCls: 'border-gray-100' },
  queued:     { label: 'Queued',        dotCls: 'bg-blue-400',   cardCls: 'border-blue-100' },
  processing: { label: 'Processing',    dotCls: 'bg-amber-400 animate-pulse', cardCls: 'border-amber-100' },
  review:     { label: 'Under Review',  dotCls: 'bg-purple-500', cardCls: 'border-purple-100' },
  approved:   { label: 'Approved',      dotCls: 'bg-green-500',  cardCls: 'border-green-100' },
  failed:     { label: 'Failed',        dotCls: 'bg-red-400',    cardCls: 'border-red-100' },
}

function formatDuration(s: number | null) {
  if (!s) return null
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export function JobCard({ job }: Props) {
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG['draft']

  return (
    <Link
      href={`/transform/${job.id}`}
      className={`group flex flex-col bg-white rounded-2xl border ${cfg.cardCls} p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Job #{job.job_number}
          </p>
          <p className="text-sm font-black text-gray-900 mt-0.5">
            {(job.config_snapshot?.colorName as string) || 'New Transformation'}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#046288] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>

      {/* ── Status badge ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotCls}`} />
        <span className="text-xs font-bold text-gray-600">{cfg.label}</span>
      </div>

      {/* ── Meta info ────────────────────────────────────────────── */}
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
        {job.total_cost_usd != null && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${Number(job.total_cost_usd).toFixed(4)}
          </span>
        )}
        {job.duration_seconds != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(job.duration_seconds)}
          </span>
        )}
        <span className="ml-auto">
          {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </Link>
  )
}
