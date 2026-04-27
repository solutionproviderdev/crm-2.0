-- Add current OpenAI image editing/inpainting models for existing providers.
-- The app still filters by is_active + supports_inpainting, so admins can disable
-- unavailable models without code changes.

INSERT INTO public.transform_ai_models (
  provider_id,
  model_id,
  display_name,
  supports_inpainting,
  cost_per_image_usd,
  is_active
)
SELECT
  p.id,
  m.model_id,
  m.display_name,
  true,
  m.cost_per_image_usd,
  true
FROM public.transform_ai_providers p
CROSS JOIN (
  VALUES
    ('gpt-image-1.5', 'GPT Image 1.5', 0.040000::numeric),
    ('gpt-image-1', 'GPT Image 1', 0.040000::numeric),
    ('gpt-image-1-mini', 'GPT Image 1 Mini', 0.020000::numeric),
    ('dall-e-2', 'DALL-E 2', 0.018000::numeric)
) AS m(model_id, display_name, cost_per_image_usd)
WHERE p.provider_key = 'openai'
ON CONFLICT (provider_id, model_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  supports_inpainting = true,
  cost_per_image_usd = EXCLUDED.cost_per_image_usd;

UPDATE public.transform_ai_models m
SET supports_inpainting = false
FROM public.transform_ai_providers p
WHERE m.provider_id = p.id
  AND p.provider_key = 'openai'
  AND m.model_id IN ('dall-e-3');
