'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type StepStatus = 'pending' | 'running' | 'done' | 'failed'

interface Step {
  step_name: string
  status: StepStatus
  cost_usd: number | null
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

const STEP_ORDER = ['lower', 'middle', 'upper', 'composite']

const STEP_LABELS: Record<string, string> = {
  lower:     'Lower Cabinet Zone',
  middle:    'Countertop & Backsplash',
  upper:     'Upper Cabinet Zone',
  composite: 'Final Composition',
}

export function JobProgressTracker({ jobId }: { jobId: string }) {
  const [steps, setSteps] = useState<Step[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Initial load
    supabase
      .from('transform_generation_steps')
      .select('*')
      .eq('job_id', jobId)
      .then(({ data }) => { if (data) setSteps(data as Step[]) })

    // ── Channel 1: live step updates ─────────────────────────────────────
    const stepsChannel = supabase
      .channel(`transform-steps-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transform_generation_steps',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new as Step
          setSteps((prev) => {
            const idx = prev.findIndex((s) => s.step_name === updated.step_name)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = updated
              return next
            }
            return [...prev, updated]
          })
        }
      )
      .subscribe()

    // ── Channel 2: job status — auto-refresh when generation completes ───
    // When the composite step finishes it sets status='review'. Without this
    // the user would have to manually refresh to see the before/after slider.
    const jobChannel = supabase
      .channel(`transform-job-status-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transform_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          if (newStatus === 'review' || newStatus === 'approved') {
            // Small delay so all DB writes settle before the server component re-fetches
            setTimeout(() => router.refresh(), 800)
          }
          if (newStatus === 'failed') {
            setTimeout(() => router.refresh(), 500)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(stepsChannel)
      supabase.removeChannel(jobChannel)
    }
  }, [jobId, router])

  return (
    <div className="flex flex-col gap-3">
      {STEP_ORDER.map((stepName) => {
        const step = steps.find((s) => s.step_name === stepName)
        const status: StepStatus = step?.status ?? 'pending'

        return (
          <div
            key={stepName}
            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${
              status === 'running'
                ? 'bg-blue-50 border border-blue-100'
                : status === 'done'
                ? 'bg-green-50 border border-green-100'
                : status === 'failed'
                ? 'bg-red-50 border border-red-100'
                : 'bg-gray-50 border border-gray-100'
            }`}
          >
            {status === 'done'    && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
            {status === 'running' && <Loader2     className="w-5 h-5 text-blue-500 animate-spin shrink-0" />}
            {status === 'failed'  && <XCircle     className="w-5 h-5 text-red-400 shrink-0" />}
            {status === 'pending' && <Circle      className="w-5 h-5 text-gray-300 shrink-0" />}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{STEP_LABELS[stepName]}</p>
              {status === 'running' && (
                <p className="text-xs text-blue-500 mt-0.5">Processing…</p>
              )}
              {status === 'failed' && step?.error_message && (
                <p className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-words">
                  {step.error_message}
                </p>
              )}
              {status === 'done' && step?.completed_at && step?.started_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.round((new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000)}s
                </p>
              )}
            </div>

            {step?.cost_usd != null && step.cost_usd > 0 && (
              <span className="text-xs text-gray-400 font-mono shrink-0">
                ${step.cost_usd.toFixed(4)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
