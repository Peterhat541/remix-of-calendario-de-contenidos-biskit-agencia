import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateImageRequest {
  contactId: string;
  channel: string;
  postFormat: string;
  themeContext: string;
  objective: string;
  title?: string;
  copy?: string;
}

// Aspect ratios by channel
const CHANNEL_ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  'Instagram': { width: 1080, height: 1080 },
  'Facebook': { width: 1200, height: 630 },
  'LinkedIn': { width: 1200, height: 627 },
  'Twitter/X': { width: 1200, height: 675 },
  'TikTok': { width: 1080, height: 1920 },
  'Google Business Profile': { width: 1200, height: 900 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GenerateImageRequest = await req.json();
    const { contactId, channel, postFormat, themeContext, objective, title, copy } = body;

    if (!contactId || !channel) {
      return new Response(
        JSON.stringify({ error: 'contactId y channel son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch contact data
    const { data: contact, error: contactError } = await supabase
      .from('calendar_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contacto no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch content profile if exists
    const { data: profile } = await supabase
      .from('content_profiles')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    // Get visual style info
    const visualStyle = profile?.visual_style as any;
    const colorPalette = visualStyle?.color_palette?.join(', ') || '';
    const imageStyle = visualStyle?.preferred_style || 'moderno y profesional';
    const brandInfo = profile?.brand_summary || contact.brand_notes || '';

    // Get dimensions based on channel
    const dimensions = CHANNEL_ASPECT_RATIOS[channel] || { width: 1080, height: 1080 };

    // Build image prompt
    const imagePrompt = `Imagen profesional para ${channel}, formato ${postFormat || 'post'}.
${themeContext ? `Tema: ${themeContext}.` : ''}
${objective ? `Objetivo: ${objective}.` : ''}
${title ? `Concepto: ${title}.` : ''}
${copy ? `Mensaje del post: ${copy.substring(0, 200)}` : ''}

Estilo visual: ${imageStyle}
${colorPalette ? `Paleta de colores preferida: ${colorPalette}` : ''}
${brandInfo ? `Marca/Sector: ${brandInfo.substring(0, 200)}` : ''}

La imagen debe ser visualmente atractiva, sin texto superpuesto, optimizada para redes sociales.
Aspecto ${dimensions.width}x${dimensions.height}. Ultra high resolution.`;

    // Call AI Image Generation API
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: imagePrompt }
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Error al generar la imagen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No se pudo generar la imagen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageData,
        prompt: imagePrompt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
