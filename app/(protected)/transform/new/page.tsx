'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Paintbrush, Settings2, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  createTransformJob,
  saveJobSourceFile,
  saveJobZones,
  triggerGeneration,
} from '@/app/actions/transform'
import ZonePainterWrapper from '@/components/transform/ZonePainterWrapper'
import { ConfigPanel } from '@/components/transform/ConfigPanel'
import { toast } from 'sonner'

type Zone = 'lower' | 'middle' | 'upper'

const SUPPORTED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const OPENAI_EDIT_IMAGE_SIZE = 1024

async function normalizeImageToPng(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Could not read this image. Please upload a valid JPG, PNG, or WEBP file.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = OPENAI_EDIT_IMAGE_SIZE
  canvas.height = OPENAI_EDIT_IMAGE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser image conversion is unavailable.')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, OPENAI_EDIT_IMAGE_SIZE, OPENAI_EDIT_IMAGE_SIZE)

  const scale = Math.min(OPENAI_EDIT_IMAGE_SIZE / bitmap.width, OPENAI_EDIT_IMAGE_SIZE / bitmap.height)
  const drawWidth = Math.round(bitmap.width * scale)
  const drawHeight = Math.round(bitmap.height * scale)
  const dx = Math.round((OPENAI_EDIT_IMAGE_SIZE - drawWidth) / 2)
  const dy = Math.round((OPENAI_EDIT_IMAGE_SIZE - drawHeight) / 2)
  ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight)
  bitmap.close()

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== 'image/png') {
        reject(new Error('Failed to convert image to PNG.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

const STEPS = [
  { icon: Upload,     label: 'Upload Photo' },
  { icon: Paintbrush, label: 'Paint Zones'  },
  { icon: Settings2,  label: 'Configure'   },
]

export default function NewTransformJobPage() {
  const router = useRouter()
  const [step, setStep]               = useState(0)
  const [jobId, setJobId]             = useState<string | null>(null)
  const [imageUrl, setImageUrl]       = useState<string | null>(null)
  const [userId, setUserId]           = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDragging, setIsDragging]   = useState(false)

  // ── Step 0: Upload photo ────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!SUPPORTED_UPLOAD_TYPES.has(file.type)) {
      toast.error('Only JPG, PNG, or WEBP files are supported'); return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB'); return
    }
    setIsUploading(true)
    try {
      const jobResult = await createTransformJob()
      if (!jobResult.success) throw new Error(jobResult.error)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      setUserId(user.id)
      setJobId(jobResult.jobId)

      const pngFile = await normalizeImageToPng(file)
      if (pngFile.size > 20 * 1024 * 1024) {
        throw new Error('Converted PNG must be under 20MB. Try a smaller source photo.')
      }

      const path = `${user.id}/${jobResult.jobId}/source.png`
      const { error: uploadErr } = await supabase.storage
        .from('transform-sources')
        .upload(path, pngFile, { contentType: 'image/png', upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)

      await saveJobSourceFile(jobResult.jobId, path)
      setImageUrl(URL.createObjectURL(pngFile))
      setStep(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [])

  // ── Step 1: Save zone masks ─────────────────────────────────────────────
  const handleMasksReady = useCallback(async (masks: Record<Zone, Blob>) => {
    if (!jobId || !userId) return
    setIsUploading(true)
    try {
      const supabase = createClient()
      const paths: Record<Zone, string> = { lower: '', middle: '', upper: '' }
      for (const zone of ['lower', 'middle', 'upper'] as Zone[]) {
        if (masks[zone].type !== 'image/png') {
          throw new Error(`Mask upload failed (${zone}): mask must be a PNG`)
        }
        const path = `${userId}/${jobId}/mask_${zone}.png`
        const { error } = await supabase.storage
          .from('transform-sources')
          .upload(path, masks[zone], { contentType: 'image/png', upsert: true })
        if (error) throw new Error(`Mask upload failed (${zone}): ${error.message}`)
        paths[zone] = path
      }
      const result = await saveJobZones(jobId, paths)
      if (!result.success) throw new Error(result.error)
      setStep(2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save zones')
    } finally {
      setIsUploading(false)
    }
  }, [jobId, userId])

  // ── Step 2: Generate ────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (config: Record<string, unknown>, modelId: string) => {
    if (!jobId) return
    setIsGenerating(true)
    try {
      const result = await triggerGeneration(jobId, config, modelId)
      if (!result.success) throw new Error(result.error)
      router.push(`/transform/${jobId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start generation')
      setIsGenerating(false)
    }
  }, [jobId, router])


  return (
    <div
      className="flex flex-col w-full mx-auto"
      style={{ height: 'calc(100vh - 80px)', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── Step Progress — compact floating pill bar ───────────────────── */}
      <div className="flex items-center justify-center py-3 shrink-0">
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-sm shadow-black/[0.04] border border-gray-200/70">
          {STEPS.map((s, i) => {
            const done = i < step
            const curr = i === step
            return (
              <div key={i} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                    done ? 'text-green-600'
                    : curr ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-400'
                  }`}
                >
                  <div className={`flex items-center justify-center w-5 h-5 rounded-lg text-[10px] font-black transition-all ${
                    done ? 'bg-green-500 text-white'
                    : curr ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-1 transition-colors duration-500 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Step 0 — Upload (immersive drop zone) ──────────────────────── */}
      {step === 0 && (
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4 animate-in fade-in duration-300">
          <label
            className={`relative flex flex-col items-center justify-center gap-6 w-full max-w-2xl rounded-3xl cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'bg-[#046288]/[0.04] border-[#046288] shadow-xl shadow-[#046288]/10 scale-[1.01]'
                : 'bg-white/80 backdrop-blur-xl border-gray-200/70 hover:border-[#046288]/40 hover:shadow-lg hover:shadow-black/[0.04] hover:bg-white'
            } border-2 border-dashed`}
            style={{ height: 'min(420px, 60vh)' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setIsDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-[#046288] animate-spin" />
                <p className="text-sm font-bold text-gray-500">Uploading…</p>
              </div>
            ) : (
              <>
                <div className={`p-5 rounded-3xl transition-all duration-300 ${
                  isDragging ? 'bg-[#046288]/15 scale-110' : 'bg-[#046288]/[0.07]'
                }`}>
                  <Upload className={`h-10 w-10 transition-colors ${isDragging ? 'text-[#046288]' : 'text-[#046288]/70'}`} />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-base font-black text-gray-800">Drop your photo here</p>
                  <p className="text-sm text-gray-400">or click to browse • JPG, PNG, WEBP up to 20MB</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#046288]/[0.06] rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#046288]/40" />
                  <span className="text-[11px] font-bold text-[#046288]/70">Customer kitchen photo recommended</span>
                </div>
              </>
            )}
            <input
              type="file" className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </label>
        </div>
      )}

      {/* ── Step 1 — Paint Zones (immersive — ZonePainter owns the UI) ── */}
      {step === 1 && imageUrl && (
        <div className="flex-1 min-h-0 mx-2 mb-2 rounded-2xl overflow-hidden border border-gray-200/60 animate-in fade-in duration-300">
          <ZonePainterWrapper
            imageUrl={imageUrl}
            onMasksReady={handleMasksReady}
            isUploading={isUploading}
          />
        </div>
      )}

      {/* ── Step 2 — Configure & Generate (scrollable glass panel) ──────── */}
      {step === 2 && (
        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 animate-in fade-in duration-300">
          <div className="flex-1 min-h-0 w-full max-w-3xl mx-auto overflow-y-auto rounded-2xl bg-white/90 backdrop-blur-2xl border border-gray-200/70 shadow-sm">
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black text-gray-900">Configure &amp; Generate</h2>
                <p className="text-sm text-gray-400 mt-0.5">Choose a saved prompt or write your own, select a model, then generate.</p>
              </div>
              <ConfigPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
