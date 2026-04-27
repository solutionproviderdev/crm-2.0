import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
const VALID_ZONES = new Set(['lower', 'middle', 'upper'])

type DownloadedImage = {
  blob: Blob
  path: string
  label: string
}
type OpenAIImageData = {
  b64_json?: string
  url?: string
}

function cleanErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error'
  const message = err.message || 'Unknown error'
  if (message.includes("Unsupported type 'image/jpeg'")) {
    return 'OpenAI rejected the image because it was sent as JPEG. Upload a new source photo so Transform Studio can convert it to PNG before generation.'
  }
  if (message.toLowerCase().includes('unsupported image')) {
    return `OpenAI rejected the image format: ${message}`
  }
  return message
}

async function isPng(blob: Blob): Promise<boolean> {
  const header = new Uint8Array(await blob.slice(0, 8).arrayBuffer())
  return PNG_SIGNATURE.every((value, index) => header[index] === value)
}

async function toOpenAIFile(image: DownloadedImage, name: string): Promise<File> {
  if (!(await isPng(image.blob))) {
    if (image.label === 'Source image') {
      throw new Error('Source image is not a valid PNG. Please create a new transform job so the upload step can normalize the image.')
    }
    throw new Error(`${image.label} is not a valid PNG. Please repaint and upload the zone mask again.`)
  }
  return new File([await image.blob.arrayBuffer()], name, { type: 'image/png' })
}

async function readOpenAIImageBytes(image: OpenAIImageData): Promise<Uint8Array> {
  if (image.b64_json) {
    return Uint8Array.from(atob(image.b64_json), (c) => c.charCodeAt(0))
  }

  if (image.url) {
    const res = await fetch(image.url)
    if (!res.ok) throw new Error(`Failed to download OpenAI image URL: ${res.status} ${res.statusText}`)
    return new Uint8Array(await res.arrayBuffer())
  }

  throw new Error('OpenAI did not return an image payload.')
}

Deno.serve(async (req) => {
  let parsedBody: { jobId: string; zone: string; isRetry?: boolean } | null = null

  try {
    parsedBody = await req.json()
    const { jobId, zone, isRetry } = parsedBody!
    if (!VALID_ZONES.has(zone)) {
      throw new Error(`Invalid transform zone "${zone}"`)
    }

    // ── Load job + model config ──────────────────────────────────────────
    const { data: job, error: jobError } = await supabase
      .from('transform_jobs')
      .select('*, ai_model:transform_ai_models(*, provider:transform_ai_providers(*))')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 })
    }

    console.log('transform-process-zone:start', {
      jobId,
      zone,
      isRetry: Boolean(isRetry),
      modelId: job.ai_model?.model_id,
      sourcePath: job.source_file_path,
      maskPath: (job.zones as Record<string, string> | null)?.[zone],
    })

    // Skip if this zone is already done (handles duplicate retries from pg_cron)
    const { data: existingStep } = await supabase
      .from('transform_generation_steps')
      .select('status')
      .eq('job_id', jobId)
      .eq('step_name', zone)
      .maybeSingle()

    if (existingStep?.status === 'done') {
      return new Response(JSON.stringify({ skipped: true, reason: 'already done' }))
    }

    // ── Mark step as running ─────────────────────────────────────────────
    await supabase.from('transform_generation_steps').upsert({
      job_id: jobId,
      step_name: zone,
      status: 'running',
      started_at: new Date().toISOString()
    }, { onConflict: 'job_id,step_name' })

    await supabase.from('transform_jobs')
      .update({ status: 'processing', current_step: zone, updated_at: new Date().toISOString() })
      .eq('id', jobId)

    // ── Build prompt for this zone ───────────────────────────────────────
    const config = job.config_snapshot as Record<string, unknown>
    const prompt = buildZonePrompt(zone, config)

    // ── Download source image + mask from Storage ────────────────────────
    if (!job.source_file_path) throw new Error('Source image path is missing for this transform job.')
    if (!job.zones || !(job.zones as Record<string, string>)[zone]) {
      throw new Error(`Mask path is missing for ${zone} zone.`)
    }

    const { data: sourceFile, error: sourceErr } = await supabase.storage
      .from('transform-sources')
      .download(job.source_file_path)

    const zoneMaskPath = (job.zones as Record<string, string>)[zone]
    const { data: maskFile, error: maskErr } = await supabase.storage
      .from('transform-sources')
      .download(zoneMaskPath)

    if (!sourceFile || sourceErr || !maskFile || maskErr) {
      throw new Error(`Source or mask file not found: ${sourceErr?.message || maskErr?.message}`)
    }

    console.log('transform-process-zone:downloaded', {
      jobId,
      zone,
      modelId: job.ai_model?.model_id,
      sourcePath: job.source_file_path,
      sourceType: sourceFile.type || 'unknown',
      sourceSize: sourceFile.size,
      maskPath: zoneMaskPath,
      maskType: maskFile.type || 'unknown',
      maskSize: maskFile.size,
    })

    const sourceIsPng = await isPng(sourceFile)
    const maskIsPng = await isPng(maskFile)

    console.log('transform-process-zone:openai-inputs', {
      jobId,
      zone,
      modelId: job.ai_model?.model_id,
      sourceType: sourceFile.type || 'unknown',
      sourceSize: sourceFile.size,
      sourceIsPng,
      maskType: maskFile.type || 'unknown',
      maskSize: maskFile.size,
      maskIsPng,
    })

    if (!sourceIsPng) {
      throw new Error('Source image is not a valid PNG. Please create a new transform job so the upload step can normalize the image.')
    }
    if (!maskIsPng) {
      throw new Error(`Mask for ${zone} zone is not a valid PNG. Please repaint and upload the zone mask again.`)
    }

    // ── Call OpenAI Images Edit endpoint ─────────────────────────────────
    const openai = new OpenAI({
      apiKey: job.ai_model.provider.api_key_encrypted
    })

    const startTime = Date.now()
    const imageFile = await toOpenAIFile({ blob: sourceFile, path: job.source_file_path, label: 'Source image' }, 'source.png')
    const maskFileForOpenAI = await toOpenAIFile({ blob: maskFile, path: zoneMaskPath, label: `${zone} mask` }, `mask_${zone}.png`)

    const editRequest: Record<string, unknown> = {
      model: job.ai_model.model_id,
      image: imageFile,
      mask: maskFileForOpenAI,
      prompt: prompt.positive,
      n: 1,
      size: '1024x1024',
    }

    if (job.ai_model.model_id === 'dall-e-2') {
      editRequest.response_format = 'b64_json'
    }

    console.log('transform-process-zone:openai-edit', {
      jobId,
      zone,
      modelId: job.ai_model.model_id,
      sourcePath: job.source_file_path,
      maskPath: zoneMaskPath,
      imageName: imageFile.name,
      imageType: imageFile.type,
      imageSize: imageFile.size,
      maskName: maskFileForOpenAI.name,
      maskType: maskFileForOpenAI.type,
      maskSize: maskFileForOpenAI.size,
    })

    let response
    try {
      response = await openai.images.edit(editRequest as never)
    } catch (err) {
      console.error('transform-process-zone:openai-error', {
        jobId,
        zone,
        modelId: job.ai_model.model_id,
        sourcePath: job.source_file_path,
        maskPath: zoneMaskPath,
        sourceType: imageFile.type,
        maskType: maskFileForOpenAI.type,
        message: err instanceof Error ? err.message : String(err),
      })
      throw err
    }

    const durationMs = Date.now() - startTime
    const image = (response.data?.[0] ?? {}) as OpenAIImageData
    const imageBytes = await readOpenAIImageBytes(image)

    // ── Upload result to Storage ─────────────────────────────────────────
    const outputPath = `${job.created_by}/${jobId}/${zone}_result.png`
    const { error: uploadErr } = await supabase.storage
      .from('transform-outputs')
      .upload(outputPath, imageBytes, { contentType: 'image/png', upsert: true })

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)

    const costUsd = Number(job.ai_model.cost_per_image_usd)

    // ── Mark step as done ────────────────────────────────────────────────
    await supabase.from('transform_generation_steps').upsert({
      job_id: jobId,
      step_name: zone,
      status: 'done',
      prompt_used: prompt.positive,
      result_path: outputPath,
      cost_usd: costUsd,
      images_generated: 1,
      completed_at: new Date().toISOString()
    }, { onConflict: 'job_id,step_name' })

    // ── Chain to next step ───────────────────────────────────────────────
    const zoneChain: Record<string, string> = {
      lower: 'middle',
      middle: 'upper',
      upper: 'composite'
    }
    const nextStep = zoneChain[zone]

    if (nextStep === 'composite') {
      fetch(`${SUPABASE_URL}/functions/v1/transform-composite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })
    } else if (nextStep) {
      fetch(`${SUPABASE_URL}/functions/v1/transform-process-zone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, zone: nextStep })
      })
    }

    return new Response(JSON.stringify({ success: true, zone, outputPath, durationMs }))

  } catch (err) {
    const errorMessage = cleanErrorMessage(err)
    console.error('transform-process-zone:failed', {
      jobId: parsedBody?.jobId,
      zone: parsedBody?.zone,
      message: errorMessage,
    })

    // Best-effort: mark step + job as failed
    try {
      if (parsedBody?.jobId && parsedBody?.zone) {
        await supabase.from('transform_generation_steps').upsert({
          job_id: parsedBody.jobId,
          step_name: parsedBody.zone,
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        }, { onConflict: 'job_id,step_name' })

        await supabase.from('transform_jobs')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', parsedBody.jobId)
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 })
  }
})

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildZonePrompt(zone: string, config: Record<string, unknown>) {
  const userPrompt = typeof config.prompt === 'string' ? config.prompt.trim() : ''
  const finish = (config.finishType as string) || 'realistic cabinet finish'
  const color = (config.colorName as string) || 'the requested cabinet color'
  const handle = (config.handleStyle as string) || 'clean modern hardware'
  const countertopMat = (config.countertopMaterial as string) || 'realistic countertop material'
  const countertopThick = (config.countertopThicknessMm as number) || 20
  const countertopColor = (config.countertopColor as string) || 'coordinated countertop color'
  const backsplash = (config.backsplashDescription as string) || 'coordinated backsplash'
  const style = Array.isArray(config.styleTags) ? (config.styleTags as string[]).join(', ') : ''
  const mood = Array.isArray(config.moodTags) ? config.moodTags as string[] : []
  const moodStr = mood.join(', ')
  const light = (config.lightCondition as string) ?? 'natural daylight'

  const zonePrompts: Record<string, string> = {
    lower: `Modular base kitchen cabinet, ${finish} finish, color ${color}, ${handle} handles,
      floor-to-countertop height 850mm, depth 600mm, soft-close drawers and shutters,
      photorealistic, sharp cabinet edges, matching existing floor level and shadow direction,
      no change to floor tiles or adjacent walls, lived-in realistic look,
      interior style: ${style}, mood: ${moodStr}, lighting: ${light}`,

    middle: `Kitchen countertop ${countertopMat} ${countertopThick}mm ${countertopColor} with integrated backsplash ${backsplash},
      seamless joint with the lower ${finish} cabinets below,
      photorealistic, natural light reflection, no change outside this zone,
      style: ${style}, mood: ${moodStr}`,

    upper: `Overhead wall-mounted kitchen cabinet row, ${finish} finish, color ${color},
      matching lower cabinets exactly, ${handle} handles,
      height 700mm depth 350mm, aligned horizontally with base cabinets,
      subtle LED strip along bottom edge, photorealistic, ceiling untouched,
      style: ${style}, mood: ${moodStr}, lighting: ${light}`
  }

  const consistency = `Preserve the original room geometry, wall positions, floor, ceiling, windows,
    camera angle, lens perspective, lighting direction, shadows, and all unmasked areas.
    Only edit the transparent masked area for this zone. Keep the result photorealistic
    and consistent with the source photo.`

  const negative = `Do not create showroom render, CGI artifacts, changed floor, changed ceiling,
    changed windows, extra furniture added, text overlay, logo, watermark,
    distorted perspective, changed camera angle, visible seams between zones.`

  const basePrompt = userPrompt || 'Create a photorealistic kitchen cabinet visualization.'

  return {
    positive: `${basePrompt}\n\nZone instruction: ${zonePrompts[zone] ?? ''}\n\nConsistency rules: ${consistency}\n\nNegative instructions: ${negative}`,
    negative
  }
}
