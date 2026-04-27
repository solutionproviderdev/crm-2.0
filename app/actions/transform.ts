'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransformJob {
  id: string
  job_number: number
  created_by: string
  status: 'draft' | 'queued' | 'processing' | 'review' | 'approved' | 'failed'
  current_step: string | null
  preset_id: string | null
  config_snapshot: Record<string, unknown>
  source_file_path: string | null
  zones: Record<string, string> | null
  output_image_path: string | null
  ai_model_id: string | null
  total_cost_usd: number | null
  duration_seconds: number | null
  reviewer_id: string | null
  review_comment: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  // Joined
  ai_model?: {
    id: string
    model_id: string
    display_name: string
    cost_per_image_usd: number
    provider?: {
      id: string
      name: string
      provider_key: string
    }
  } | null
}

export interface TransformGenerationStep {
  id: string
  job_id: string
  step_name: string
  status: 'pending' | 'running' | 'done' | 'failed'
  prompt_used: string | null
  result_path: string | null
  cost_usd: number | null
  images_generated: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
}

export interface TransformAIProvider {
  id: string
  name: string
  provider_key: string
  api_key_encrypted: string
  is_active: boolean
  added_by: string | null
  created_at: string
  updated_at: string
  models?: TransformAIModel[]
}

export interface TransformAIModel {
  id: string
  provider_id: string
  model_id: string
  display_name: string
  supports_inpainting: boolean
  cost_per_image_usd: number
  is_active: boolean
  created_at: string
}

export interface TransformPreset {
  id: string
  name: string
  is_system: boolean
  created_by: string | null
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

const OPENAI_IMAGE_EDIT_MODELS = [
  {
    model_id: 'gpt-image-1.5',
    display_name: 'GPT Image 1.5',
    supports_inpainting: true,
    cost_per_image_usd: 0.040000,
    is_active: true,
  },
  {
    model_id: 'gpt-image-1',
    display_name: 'GPT Image 1',
    supports_inpainting: true,
    cost_per_image_usd: 0.040000,
    is_active: true,
  },
  {
    model_id: 'gpt-image-1-mini',
    display_name: 'GPT Image 1 Mini',
    supports_inpainting: true,
    cost_per_image_usd: 0.020000,
    is_active: true,
  },
  {
    model_id: 'dall-e-2',
    display_name: 'DALL-E 2',
    supports_inpainting: true,
    cost_per_image_usd: 0.018000,
    is_active: true,
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Job CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new draft transform job.
 * Returns the new job ID.
 */
export async function createTransformJob(): Promise<{ success: true; jobId: string } | { success: false; error: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('transform_jobs')
    .insert({ created_by: user.id, status: 'draft' })
    .select('id')
    .single()

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to create job' }
  return { success: true, jobId: data.id }
}

/**
 * Persist the uploaded source file path after browser-side storage upload.
 */
export async function saveJobSourceFile(jobId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('transform_jobs')
    .update({ source_file_path: filePath, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('created_by', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Save the three zone mask storage paths.
 */
export async function saveJobZones(
  jobId: string,
  zones: { lower: string; middle: string; upper: string }
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('transform_jobs')
    .update({ zones, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('created_by', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Save config snapshot + model, create pending step rows, then trigger
 * the Edge Function chain starting with the lower zone.
 */
export async function triggerGeneration(
  jobId: string,
  config: Record<string, unknown>,
  modelId: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Pre-create step rows in pending state so Realtime shows them immediately
  const steps = ['lower', 'middle', 'upper', 'composite']
  const { error: stepsErr } = await supabase
    .from('transform_generation_steps')
    .insert(steps.map((step) => ({ job_id: jobId, step_name: step, status: 'pending' })))

  if (stepsErr) {
    console.error('Failed to insert generation steps:', stepsErr.message)
    // Non-fatal: the edge function will upsert these anyway
  }

  const { error: updateErr } = await supabase
    .from('transform_jobs')
    .update({
      status: 'queued',
      config_snapshot: config,
      ai_model_id: modelId,
      current_step: 'lower',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .eq('created_by', user.id)

  if (updateErr) return { success: false, error: updateErr.message }

  const edgeUrl = process.env.TRANSFORM_EDGE_FUNCTION_URL

  if (!edgeUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'TRANSFORM_EDGE_FUNCTION_URL or SUPABASE_SERVICE_ROLE_KEY not set' }
  }

  // Fire-and-forget — the edge function chains itself asynchronously.
  // Do NOT await; awaiting would hang the server action for 30–90 s (one full OpenAI call).
  fetch(`${edgeUrl}/transform-process-zone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, zone: 'lower' })
  }).catch((err) => {
    console.error('Failed to trigger edge function:', err)
  })

  revalidatePath('/transform')
  return { success: true }
}

/**
 * Approve a completed job (requires transform_review permission).
 */
export async function approveJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('transform_jobs')
    .update({
      status: 'approved',
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/transform')
  return { success: true }
}

/**
 * Reject a job with a review comment.
 */
export async function rejectJob(jobId: string, comment: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('transform_jobs')
    .update({
      status: 'failed',
      reviewer_id: user.id,
      review_comment: comment,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/transform')
  return { success: true }
}

/**
 * Re-trigger a single zone (e.g., after a failure).
 */
export async function regenerateZone(
  jobId: string,
  zone: 'lower' | 'middle' | 'upper'
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Reset the requested zone AND every step that runs after it.
  // Without this, the Edge Function skips already-done downstream steps
  // and the composite uses the old upper result, so the user sees no change.
  const zoneOrder = ['lower', 'middle', 'upper', 'composite']
  const zoneIndex = zoneOrder.indexOf(zone)
  const stepsToReset = zoneOrder.slice(zoneIndex)

  await supabase
    .from('transform_generation_steps')
    .update({ status: 'pending', result_path: null, error_message: null })
    .eq('job_id', jobId)
    .in('step_name', stepsToReset)

  // Clear the now-stale output so the before/after slider is hidden during re-run
  await supabase
    .from('transform_jobs')
    .update({
      status: 'processing',
      current_step: zone,
      output_image_path: null,
      total_cost_usd: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  const edgeUrl = process.env.TRANSFORM_EDGE_FUNCTION_URL
  if (!edgeUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { success: false, error: 'Edge Function URL not configured' }

  // Fire-and-forget — same pattern as triggerGeneration
  fetch(`${edgeUrl}/transform-process-zone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, zone })
  }).catch((err) => {
    console.error('Failed to trigger regeneration:', err)
  })

  revalidatePath(`/transform/${jobId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List transform jobs for the current user.
 * Admins and reviewers see all jobs; operators see only their own.
 */
export async function getTransformJobs(statusFilter?: string): Promise<{
  success: boolean
  data?: TransformJob[]
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  let query = supabase
    .from('transform_jobs')
    .select('*, ai_model:transform_ai_models(id, model_id, display_name, cost_per_image_usd, provider:transform_ai_providers(id, name, provider_key))')
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []) as unknown as TransformJob[] }
}

/**
 * Get a single job by ID (with steps).
 */
export async function getTransformJob(jobId: string): Promise<{
  success: boolean
  data?: TransformJob & { steps: TransformGenerationStep[] }
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('transform_jobs')
    .select(`
      *,
      ai_model:transform_ai_models(
        id, model_id, display_name, cost_per_image_usd,
        provider:transform_ai_providers(id, name, provider_key)
      ),
      steps:transform_generation_steps(*)
    `)
    .eq('id', jobId)
    .single()

  if (error || !data) return { success: false, error: error?.message ?? 'Job not found' }
  return { success: true, data: data as unknown as TransformJob & { steps: TransformGenerationStep[] } }
}

/**
 * Generate a signed URL for a storage file.
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to create signed URL' }
  return { success: true, url: data.signedUrl }
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset queries
// ─────────────────────────────────────────────────────────────────────────────

export async function getTransformPresets(): Promise<{
  success: boolean
  data?: TransformPreset[]
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('transform_presets')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name')

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []) as TransformPreset[] }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Provider management (admin only)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAIProviders(): Promise<{
  success: boolean
  data?: TransformAIProvider[]
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('transform_ai_providers')
    .select('*, models:transform_ai_models(*)')
    .order('created_at')

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []) as unknown as TransformAIProvider[] }
}

export async function getAIModels(providerId?: string): Promise<{
  success: boolean
  data?: TransformAIModel[]
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let query = supabase
    .from('transform_ai_models')
    .select('*')
    .eq('is_active', true)
    .eq('supports_inpainting', true)
    .order('display_name')

  if (providerId) query = query.eq('provider_id', providerId)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []) as TransformAIModel[] }
}

export async function addAIProvider(
  name: string,
  providerKey: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Use admin client to bypass RLS for admin operations validated at app layer
  const admin = createAdminClient()

  const { data: provider, error } = await admin
    .from('transform_ai_providers')
    .insert({ name, provider_key: providerKey, api_key_encrypted: apiKey, added_by: user.id })
    .select('id')
    .single()

  if (error || !provider) return { success: false, error: error?.message ?? 'Failed to add provider' }

  // Seed default models for known providers
  if (providerKey === 'openai') {
    await admin.from('transform_ai_models').insert(
      OPENAI_IMAGE_EDIT_MODELS.map((model) => ({ ...model, provider_id: provider.id }))
    )
  }

  revalidatePath('/settings/ai-providers')
  return { success: true }
}

export async function toggleProvider(
  providerId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('transform_ai_providers')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', providerId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/ai-providers')
  return { success: true }
}

/**
 * Seed default models for a provider that already exists.
 * Safe to call multiple times — uses upsert on (provider_id, model_id).
 */
export async function seedModelsForProvider(
  providerId: string,
  providerKey: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  if (providerKey === 'openai') {
    const { error } = await admin.from('transform_ai_models').upsert(
      OPENAI_IMAGE_EDIT_MODELS.map((model) => ({ ...model, provider_id: providerId })),
      { onConflict: 'provider_id,model_id' }
    )
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/settings/ai-providers')
  return { success: true }
}
