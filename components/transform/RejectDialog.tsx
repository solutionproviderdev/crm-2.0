'use client'

import { useState } from 'react'
import { XCircle } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { rejectJob } from '@/app/actions/transform'

export function RejectDialog({ jobId }: { jobId: string }) {
  const [open, setOpen]       = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    if (!comment.trim()) return
    setLoading(true)
    await rejectJob(jobId, comment.trim())
    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold rounded-xl transition-all">
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
          <Dialog.Title className="text-lg font-black text-gray-900 mb-1">Reject Job</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-5">
            Provide a reason for rejection. This will be visible to the operator.
          </Dialog.Description>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Colors don't match client spec, please redo with SP-GR07…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all"
          />

          <div className="flex gap-3 mt-5 justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleReject}
              disabled={!comment.trim() || loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl transition-all"
            >
              {loading ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
