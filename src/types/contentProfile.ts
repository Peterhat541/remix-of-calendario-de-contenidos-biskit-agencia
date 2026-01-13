// Types for AI Content Profile

export interface ContentProfile {
  id: string;
  contact_id: string;
  source_data: SourceData;
  brand_summary: string | null;
  tone_guidelines: ToneGuidelines;
  vocabulary: Vocabulary;
  hashtags_base: string[];
  visual_style: VisualStyle;
  confidence_score: number;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceData {
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  google_business_url?: string;
  example_posts?: string[];
}

export interface ToneGuidelines {
  primary_tone?: string;
  secondary_tone?: string;
  formality_level?: 'formal' | 'neutral' | 'informal';
  personality_traits?: string[];
}

export interface Vocabulary {
  recommended: string[];
  forbidden: string[];
}

export interface VisualStyle {
  color_palette?: string[];
  image_style?: string;
  composition_notes?: string;
  brand_elements?: string[];
}

// Extended contact with AI fields
export interface CalendarContactWithAI {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  // AI-related fields
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  google_business_url: string | null;
  tone_style: string | null;
  emoji_style: string | null;
  cta_style: string | null;
  forbidden_words: string[] | null;
  brand_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Post format options by channel
export const POST_FORMATS: Record<string, { value: string; label: string }[]> = {
  Instagram: [
    { value: 'post', label: 'Post' },
    { value: 'carrusel', label: 'Carrusel' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },
  ],
  Facebook: [
    { value: 'post', label: 'Post' },
    { value: 'carrusel', label: 'Carrusel' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },
  ],
  LinkedIn: [
    { value: 'post', label: 'Post' },
    { value: 'carrusel', label: 'Carrusel (PDF)' },
    { value: 'articulo', label: 'Artículo' },
  ],
  'Twitter/X': [
    { value: 'tweet', label: 'Tweet' },
    { value: 'hilo', label: 'Hilo' },
  ],
  TikTok: [
    { value: 'video', label: 'Video' },
  ],
  'Google Business Profile': [
    { value: 'gbp_post', label: 'Publicación' },
    { value: 'gbp_oferta', label: 'Oferta' },
    { value: 'gbp_evento', label: 'Evento' },
  ],
};

// Post objectives
export const POST_OBJECTIVES = [
  { value: 'marca', label: 'Branding / Marca' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'educativo', label: 'Educativo' },
  { value: 'prueba_social', label: 'Prueba social' },
  { value: 'captacion', label: 'Captación de leads' },
  { value: 'engagement', label: 'Engagement' },
];

// Emoji style options
export const EMOJI_STYLES = [
  { value: 'no', label: 'Sin emojis' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'si', label: 'Uso frecuente' },
];

// Tone style options
export const TONE_STYLES = [
  { value: 'formal', label: 'Formal' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'cercano', label: 'Cercano' },
  { value: 'informal', label: 'Informal' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'divertido', label: 'Divertido' },
];
