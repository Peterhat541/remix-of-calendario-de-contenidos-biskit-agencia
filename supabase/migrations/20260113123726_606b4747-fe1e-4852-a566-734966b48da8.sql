-- =============================================
-- FASE 1: Campos contacto + tabla content_profiles
-- =============================================

-- A1. Añadir campos opcionales a calendar_contacts
ALTER TABLE public.calendar_contacts
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS google_business_url TEXT,
ADD COLUMN IF NOT EXISTS tone_style TEXT,
ADD COLUMN IF NOT EXISTS emoji_style TEXT DEFAULT 'moderado',
ADD COLUMN IF NOT EXISTS cta_style TEXT,
ADD COLUMN IF NOT EXISTS forbidden_words TEXT[],
ADD COLUMN IF NOT EXISTS brand_notes TEXT;

-- Añadir comentarios descriptivos
COMMENT ON COLUMN public.calendar_contacts.instagram_url IS 'URL del perfil de Instagram del cliente';
COMMENT ON COLUMN public.calendar_contacts.facebook_url IS 'URL del perfil de Facebook del cliente';
COMMENT ON COLUMN public.calendar_contacts.linkedin_url IS 'URL del perfil de LinkedIn del cliente';
COMMENT ON COLUMN public.calendar_contacts.google_business_url IS 'URL del perfil de Google Business del cliente';
COMMENT ON COLUMN public.calendar_contacts.tone_style IS 'Estilo de tono: formal, informal, técnico, cercano, etc.';
COMMENT ON COLUMN public.calendar_contacts.emoji_style IS 'Uso de emojis: no, moderado, si';
COMMENT ON COLUMN public.calendar_contacts.cta_style IS 'Estilo de llamadas a la acción preferido';
COMMENT ON COLUMN public.calendar_contacts.forbidden_words IS 'Palabras prohibidas en el contenido';
COMMENT ON COLUMN public.calendar_contacts.brand_notes IS 'Notas adicionales sobre la marca';

-- A2. Crear tabla content_profiles (perfil editorial por contacto)
CREATE TABLE IF NOT EXISTS public.content_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.calendar_contacts(id) ON DELETE CASCADE,
  source_data JSONB DEFAULT '{}'::jsonb,
  brand_summary TEXT,
  tone_guidelines JSONB DEFAULT '{}'::jsonb,
  vocabulary JSONB DEFAULT '{"recommended": [], "forbidden": []}'::jsonb,
  hashtags_base JSONB DEFAULT '[]'::jsonb,
  visual_style JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(3,2) DEFAULT 0.00,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT content_profiles_contact_id_unique UNIQUE (contact_id)
);

-- Comentarios para content_profiles
COMMENT ON TABLE public.content_profiles IS 'Perfil editorial generado por IA para cada contacto';
COMMENT ON COLUMN public.content_profiles.source_data IS 'URLs y ejemplos utilizados para el análisis';
COMMENT ON COLUMN public.content_profiles.brand_summary IS 'Resumen de la marca generado por IA';
COMMENT ON COLUMN public.content_profiles.tone_guidelines IS 'Directrices de tono en formato JSON';
COMMENT ON COLUMN public.content_profiles.vocabulary IS 'Vocabulario recomendado y prohibido';
COMMENT ON COLUMN public.content_profiles.hashtags_base IS 'Hashtags base para el cliente';
COMMENT ON COLUMN public.content_profiles.visual_style IS 'Estilo visual para generación de imágenes';
COMMENT ON COLUMN public.content_profiles.confidence_score IS 'Puntuación de confianza del análisis (0.00-1.00)';

-- Habilitar RLS
ALTER TABLE public.content_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para content_profiles
CREATE POLICY "Authenticated users can view content_profiles"
ON public.content_profiles
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert content_profiles"
ON public.content_profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update content_profiles"
ON public.content_profiles
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete content_profiles"
ON public.content_profiles
FOR DELETE
USING (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_content_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_content_profiles_updated_at
BEFORE UPDATE ON public.content_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_content_profiles_updated_at();