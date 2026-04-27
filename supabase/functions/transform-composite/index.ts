import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface Step {
  step_name: string
  result_path: string | null
  cost_usd: number | null
  started_at: string | null
  completed_at: string | null
}

Deno.serve(async (req) => {
  try {
    const { jobId } = await req.json()

    // Mark composite step as running
    await supabase.from('transform_generation_steps').upsert({
      job_id: jobId,
      step_name: 'composite',
      status: 'running',
      started_at: new Date().toISOString()
    }, { onConflict: 'job_id,step_name' })

    // Load job + all zone steps
    const { data: job, error: jobErr } = await supabase
      .from('transform_jobs')
      .select('*, steps:transform_generation_steps(*)')
      .eq('id', jobId)
      .single()

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 })
    }

    const steps = (job.steps as Step[]) ?? []
    const stepsByName = Object.fromEntries(steps.map((s) => [s.step_name, s]))

    // v1: use the upper zone result as the primary composite output.
    // A future version can use sharp WASM on Deno to blend zone masks.
    const primaryResultPath = stepsByName['upper']?.result_path
    if (!primaryResultPath) throw new Error('Upper zone result not found')

    // Calculate totals
    const zones = ['lower', 'middle', 'upper']
    const totalCost = zones.reduce((sum, z) => sum + (Number(stepsByName[z]?.cost_usd) || 0), 0)

    const startedAts = steps
      .filter((s) => s.started_at)
      .map((s) => new Date(s.started_at!).getTime())
    const firstStarted = startedAts.length > 0 ? Math.min(...startedAts) : Date.now()
    const durationSeconds = Math.round((Date.now() - firstStarted) / 1000)

    // Transition job to review status
    await supabase.from('transform_jobs').update({
      status: 'review',
      output_image_path: primaryResultPath,
      total_cost_usd: totalCost,
      duration_seconds: durationSeconds,
      current_step: null,
      updated_at: new Date().toISOString()
    }).eq('id', jobId)

    await supabase.from('transform_generation_steps').upsert({
      job_id: jobId,
      step_name: 'composite',
      status: 'done',
      result_path: primaryResultPath,
      cost_usd: 0,
      completed_at: new Date().toISOString()
    }, { onConflict: 'job_id,step_name' })

    return new Response(JSON.stringify({
      success: true,
      outputPath: primaryResultPath,
      totalCostUsd: totalCost,
      durationSeconds
    }))

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 })
  }
})
