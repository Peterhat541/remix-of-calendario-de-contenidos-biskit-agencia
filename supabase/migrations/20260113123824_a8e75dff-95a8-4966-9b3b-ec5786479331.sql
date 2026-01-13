-- =============================================
-- FASE 2: Campos adicionales para calendar_posts
-- =============================================

-- Añadir campos para generación de contenido IA
ALTER TABLE public.calendar_posts
ADD COLUMN IF NOT EXISTS post_format TEXT DEFAULT 'post',
ADD COLUMN IF NOT EXISTS theme_context TEXT,
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_copy_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_image_prompt TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN public.calendar_posts.post_format IS 'Formato del post: post, carrusel, story, reel, gbp_post, gbp_oferta, gbp_evento';
COMMENT ON COLUMN public.calendar_posts.theme_context IS 'Contexto temático: Semana Santa, Día de la Madre, etc.';
COMMENT ON COLUMN public.calendar_posts.objective IS 'Objetivo: marca, ventas, educativo, prueba_social, captacion';
COMMENT ON COLUMN public.calendar_posts.ai_generated IS 'Indica si el contenido fue generado por IA';
COMMENT ON COLUMN public.calendar_posts.ai_copy_prompt IS 'Prompt utilizado para generar el copy';
COMMENT ON COLUMN public.calendar_posts.ai_image_prompt IS 'Prompt utilizado para generar la imagen';