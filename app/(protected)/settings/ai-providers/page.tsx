'use client'

import { useEffect, useState } from 'react'
import { Loader2, Cpu, Plus, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { useUser } from '@/components/providers/UserProvider'
import { getAIProviders, addAIProvider, toggleProvider, seedModelsForProvider } from '@/app/actions/transform'
import type { TransformAIProvider } from '@/app/actions/transform'

export default function AIProvidersPage() {
  const { user } = useUser()
  const [providers, setProviders]     = useState<TransformAIProvider[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [dialogOpen, setDialogOpen]   = useState(false)

  // Add form state
  const [name, setName]           = useState('')
  const [providerKey, setProviderKey] = useState('openai')
  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [isSaving, setIsSaving]   = useState(false)

  const reload = async () => {
    setIsLoading(true)
    const res = await getAIProviders()
    if (res.success) setProviders(res.data ?? [])
    setIsLoading(false)
  }

  useEffect(() => { reload() }, [])

  if (user?.type !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-50 text-red-400">
          <Cpu className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Only administrators can manage AI provider credentials.
        </p>
      </div>
    )
  }

  const handleAdd = async () => {
    if (!name.trim() || !apiKey.trim()) return
    setIsSaving(true)
    const res = await addAIProvider(name.trim(), providerKey.trim(), apiKey.trim())
    if (res.success) {
      toast.success(`${name} added successfully`)
      setDialogOpen(false)
      setName(''); setProviderKey('openai'); setApiKey('')
      reload()
    } else {
      toast.error(res.error)
    }
    setIsSaving(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    const res = await toggleProvider(id, !current)
    if (res.success) {
      toast.success(current ? 'Provider disabled' : 'Provider enabled')
      reload()
    } else {
      toast.error(res.error)
    }
  }

  const handleSeedModels = async (id: string, key: string) => {
    const res = await seedModelsForProvider(id, key)
    if (res.success) {
      toast.success('Models seeded successfully')
      reload()
    } else {
      toast.error(res.error ?? 'Failed to seed models')
    }
  }

  const maskApiKey = (key: string) => key.slice(0, 8) + '••••••••••••••••'

  const fieldCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#046288]/20 focus:border-[#046288] transition-all"
  const labelCls = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5"

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#046288]/10 text-[#046288]">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Providers</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Manage AI provider credentials for Transform Studio
          </p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#046288] hover:bg-[#034e6d] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.02]">
              <Plus className="h-4 w-4" />
              Add Provider
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
              <Dialog.Title className="text-lg font-black text-gray-900 mb-1">Add AI Provider</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mb-6">
                The API key is stored in the database and used only by the Edge Functions at generation time.
              </Dialog.Description>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Provider Name</label>
                  <input className={fieldCls} placeholder="e.g. OpenAI" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Provider Key</label>
                  <select className={`${fieldCls} appearance-none`} value={providerKey} onChange={(e) => setProviderKey(e.target.value)}>
                    <option value="openai">openai</option>
                    <option value="custom">custom</option>
                  </select>
                  {providerKey === 'custom' && (
                    <input className={`${fieldCls} mt-2`} placeholder="e.g. stability-ai" value={providerKey} onChange={(e) => setProviderKey(e.target.value)} />
                  )}
                </div>
                <div>
                  <label className={labelCls}>API Key</label>
                  <div className="relative">
                    <input
                      className={`${fieldCls} pr-10`}
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleAdd}
                  disabled={!name.trim() || !apiKey.trim() || isSaving}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#046288] hover:bg-[#034e6d] disabled:opacity-40 rounded-xl transition-all"
                >
                  {isSaving ? 'Adding…' : 'Add Provider'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* ── Provider list ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-[#046288]" />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Cpu className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-500">No providers yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Provider" to configure OpenAI</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Provider header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900">{provider.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      provider.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {provider.is_active ? '● Active' : '○ Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    Key: {maskApiKey(provider.api_key_encrypted)}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(provider.id, provider.is_active)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 hover:border-gray-400 rounded-lg text-gray-600 transition-all"
                >
                  {provider.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                  {provider.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Models */}
              {provider.models && provider.models.length > 0 ? (
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Models</p>
                  <div className="space-y-2">
                    {provider.models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${model.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm font-medium text-gray-700">{model.display_name}</span>
                          {model.supports_inpainting && (
                            <span className="text-[10px] font-bold bg-[#046288]/10 text-[#046288] px-1.5 py-0.5 rounded">Inpainting</span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-gray-400">${Number(model.cost_per_image_usd).toFixed(3)}/image</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-sm text-amber-600">No models found for this provider.</p>
                  {provider.provider_key === 'openai' && (
                    <button
                      onClick={() => handleSeedModels(provider.id, provider.provider_key)}
                      className="text-xs font-bold px-3 py-1.5 bg-[#046288] text-white rounded-lg hover:bg-[#034e6d] transition-all"
                    >
                      Seed Default Models
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
