'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Loader2, SlidersHorizontal } from 'lucide-react'
import { getAIProviders, getAIModels, getTransformPresets } from '@/app/actions/transform'
import type { TransformPreset, TransformAIProvider, TransformAIModel } from '@/app/actions/transform'

interface Config {
  prompt: string
  presetId: string
  roomType: string
  roomSizeDescription: string
  lightCondition: string
  finishType: string
  colorCode: string
  colorName: string
  handleStyle: string
  countertopMaterial: string
  countertopThicknessMm: number
  countertopColor: string
  backsplashDescription: string
  styleTags: string[]
  moodTags: string[]
  providerId: string
  modelId: string
}

const EMPTY_CONFIG: Config = {
  prompt: '',
  presetId: '',
  roomType: 'kitchen',
  roomSizeDescription: '',
  lightCondition: 'natural daylight',
  finishType: 'matte',
  colorCode: '',
  colorName: '',
  handleStyle: 'slim silver',
  countertopMaterial: 'quartz',
  countertopThicknessMm: 20,
  countertopColor: '',
  backsplashDescription: '',
  styleTags: [],
  moodTags: [],
  providerId: '',
  modelId: '',
}

interface Props {
  onGenerate: (config: Record<string, unknown>, modelId: string) => void
  isGenerating: boolean
}

function promptFromPreset(preset: TransformPreset): string {
  const cfg = preset.config as Record<string, unknown>
  const prompt = typeof cfg.prompt === 'string' ? cfg.prompt.trim() : ''
  if (prompt) return prompt

  const parts = [
    cfg.colorName && `${cfg.colorName} cabinet fronts`,
    cfg.finishType && `${cfg.finishType} finish`,
    cfg.handleStyle && `${cfg.handleStyle} handles`,
    cfg.countertopColor && `${cfg.countertopColor} countertop`,
    cfg.backsplashDescription && `${cfg.backsplashDescription} backsplash`,
    Array.isArray(cfg.styleTags) && cfg.styleTags.length > 0 && `${cfg.styleTags.join(', ')} style`,
    Array.isArray(cfg.moodTags) && cfg.moodTags.length > 0 && `${cfg.moodTags.join(', ')} mood`,
  ].filter(Boolean)

  return parts.length > 0
    ? `Create a photorealistic kitchen cabinet visualization with ${parts.join(', ')}.`
    : ''
}

export function ConfigPanel({ onGenerate, isGenerating }: Props) {
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG)
  const [presets, setPresets] = useState<TransformPreset[]>([])
  const [providers, setProviders] = useState<TransformAIProvider[]>([])
  const [models, setModels] = useState<TransformAIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    Promise.all([getTransformPresets(), getAIProviders()]).then(([presetsRes, providersRes]) => {
      if (presetsRes.success) setPresets(presetsRes.data ?? [])
      if (providersRes.success) {
        const active = (providersRes.data ?? []).filter((p) => p.is_active)
        setProviders(active)
        if (active.length > 0) {
          setConfig((c) => ({ ...c, providerId: active[0].id }))
        }
      }
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!config.providerId) return
    getAIModels(config.providerId).then((res) => {
      if (res.success) {
        const activeModels = res.data ?? []
        setModels(activeModels)
        setConfig((c) => ({
          ...c,
          modelId: activeModels.some((m) => m.id === c.modelId) ? c.modelId : (activeModels[0]?.id ?? ''),
        }))
      }
    })
  }, [config.providerId])

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    const cfg = preset.config as Record<string, unknown>

    setConfig((c) => ({
      ...c,
      presetId,
      prompt: promptFromPreset(preset),
      finishType: (cfg.finishType as string) ?? c.finishType,
      colorCode: (cfg.colorCode as string) ?? c.colorCode,
      colorName: (cfg.colorName as string) ?? c.colorName,
      handleStyle: (cfg.handleStyle as string) ?? c.handleStyle,
      countertopMaterial: (cfg.countertopMaterial as string) ?? c.countertopMaterial,
      countertopThicknessMm: (cfg.countertopThicknessMm as number) ?? c.countertopThicknessMm,
      countertopColor: (cfg.countertopColor as string) ?? c.countertopColor,
      backsplashDescription: (cfg.backsplashDescription as string) ?? c.backsplashDescription,
      styleTags: (cfg.styleTags as string[]) ?? c.styleTags,
      moodTags: (cfg.moodTags as string[]) ?? c.moodTags,
      lightCondition: (cfg.lightCondition as string) ?? c.lightCondition,
      roomType: (cfg.roomType as string) ?? c.roomType,
    }))
  }

  const selectedModel = models.find((m) => m.id === config.modelId)
  const estimatedCost = selectedModel ? (Number(selectedModel.cost_per_image_usd) * 3).toFixed(4) : null
  const isValid = config.prompt.trim() !== '' && config.modelId !== ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-[#046288]" />
      </div>
    )
  }

  const fieldCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#046288]/20 focus:border-[#046288] transition-all"
  const labelCls = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-0.5"

  return (
    <div className="space-y-5">
      {presets.length > 0 && (
        <div>
          <label className={labelCls}>Saved Prompt / Preset</label>
          <div className="relative">
            <select
              className={`${fieldCls} appearance-none pr-8`}
              value={config.presetId}
              onChange={(e) => applyPreset(e.target.value)}
            >
              <option value="">Custom prompt</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Cabinet Prompt</label>
        <textarea
          className={`${fieldCls} min-h-32 resize-y leading-relaxed`}
          value={config.prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="Example: Transform the cabinets into matte warm white shaker-style fronts with slim brushed brass handles and a light quartz countertop. Keep the kitchen layout realistic."
        />
        <p className="mt-2 text-xs text-gray-400">
          This prompt is saved with the job and combined with per-zone cabinet instructions during generation.
        </p>
      </div>

      <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-4">
        <h3 className="font-black text-sm text-gray-800">Provider &amp; Model</h3>

        {providers.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
            No active AI providers configured. Ask an admin to add one in Settings - AI Providers.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Provider</label>
              <div className="relative">
                <select className={`${fieldCls} appearance-none pr-8`} value={config.providerId} onChange={(e) => set('providerId', e.target.value)}>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Image Edit Model</label>
              <div className="relative">
                <select className={`${fieldCls} appearance-none pr-8`} value={config.modelId} onChange={(e) => set('modelId', e.target.value)}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} ({m.model_id}) - Inpainting
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {selectedModel && (
          <div className="text-xs text-gray-500 bg-white rounded-xl p-3 border border-gray-100">
            <span className="font-bold text-gray-700">{selectedModel.display_name}</span>
            <span className="mx-1">-</span>
            <span className="font-mono">{selectedModel.model_id}</span>
            <span className="mx-1">-</span>
            <span>{selectedModel.supports_inpainting ? 'Image editing / inpainting' : 'Generation only'}</span>
          </div>
        )}

        {estimatedCost && (
          <div className="flex items-center justify-between text-sm bg-white rounded-xl p-3 border border-gray-100">
            <span className="text-gray-500">Estimated cost (3 zones)</span>
            <span className="font-black text-[#046288]">${estimatedCost}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          Advanced settings
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
          <div>
            <label className={labelCls}>Room Type</label>
            <select className={`${fieldCls} appearance-none`} value={config.roomType} onChange={(e) => set('roomType', e.target.value)}>
              <option value="kitchen">Kitchen</option>
              <option value="living-room">Living Room / TV Wall</option>
              <option value="bedroom">Bedroom Wardrobe</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Light Condition</label>
            <input className={fieldCls} value={config.lightCondition} onChange={(e) => set('lightCondition', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Cabinet Finish</label>
            <input className={fieldCls} value={config.finishType} onChange={(e) => set('finishType', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Color Name</label>
            <input className={fieldCls} value={config.colorName} onChange={(e) => set('colorName', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Handle Style</label>
            <input className={fieldCls} value={config.handleStyle} onChange={(e) => set('handleStyle', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Countertop Material</label>
            <input className={fieldCls} value={config.countertopMaterial} onChange={(e) => set('countertopMaterial', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Countertop Thickness (mm)</label>
            <input className={fieldCls} type="number" min={10} max={60} value={config.countertopThicknessMm} onChange={(e) => set('countertopThicknessMm', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Countertop Color</label>
            <input className={fieldCls} value={config.countertopColor} onChange={(e) => set('countertopColor', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Backsplash Description</label>
            <input className={fieldCls} value={config.backsplashDescription} onChange={(e) => set('backsplashDescription', e.target.value)} />
          </div>
        </div>
      )}

      <button
        onClick={() => {
          const generationConfig: Record<string, unknown> = { ...config }
          delete generationConfig.providerId
          onGenerate(generationConfig, config.modelId)
        }}
        disabled={!isValid || isGenerating || providers.length === 0}
        className="w-full py-3.5 bg-[#046288] hover:bg-[#034e6d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
      >
        {isGenerating ? 'Starting generation...' : 'Generate'}
      </button>
    </div>
  )
}
