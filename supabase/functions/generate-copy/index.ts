import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCopyRequest {
  contactId: string;
  channel: string;
  postFormat: string;
  themeContext: string;
  objective: string;
  title?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GenerateCopyRequest = await req.json();
    const { contactId, channel, postFormat, themeContext, objective, title } = body;

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

    // Build the prompt
    const brandInfo = profile?.brand_summary || contact.brand_notes || '';
    const toneInfo = contact.tone_style || (profile?.tone_guidelines as any)?.primary || 'profesional y cercano';
    const emojiStyle = contact.emoji_style || 'moderado';
    const ctaStyle = contact.cta_style || '';
    const forbiddenWords = contact.forbidden_words?.join(', ') || '';
    const vocabulary = (profile?.vocabulary as any)?.preferred_words?.join(', ') || '';
    const hashtags = (profile?.hashtags_base as any)?.core?.join(' ') || '';

    const systemPrompt = `Eres un experto copywriter de redes sociales para ${channel}.
Generas copys en español para marcas, siguiendo sus guías de tono y estilo.
SIEMPRE responde SOLO con el copy, sin explicaciones ni formato adicional.`;

    const userPrompt = `Genera un copy para ${channel} con las siguientes características:

MARCA: ${contact.company_name}
${brandInfo ? `DESCRIPCIÓN DE MARCA: ${brandInfo}` : ''}

FORMATO DEL POST: ${postFormat || 'post estándar'}
${themeContext ? `TEMA/CONTEXTO: ${themeContext}` : ''}
${objective ? `OBJETIVO: ${objective}` : ''}
${title ? `TÍTULO/IDEA: ${title}` : ''}

GUÍAS DE ESTILO:
- Tono: ${toneInfo}
- Uso de emojis: ${emojiStyle}
${ctaStyle ? `- Estilo de CTA: ${ctaStyle}` : ''}
${forbiddenWords ? `- Palabras prohibidas: ${forbiddenWords}` : ''}
${vocabulary ? `- Vocabulario preferido: ${vocabulary}` : ''}
${hashtags ? `- Hashtags base: ${hashtags}` : ''}

Genera un copy atractivo, optimizado para ${channel}, que cumpla con el objetivo indicado.
Incluye emojis según el estilo definido y un CTA al final si es apropiado.
Si hay hashtags base, inclúyelos al final.`;

    // Call AI API
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Error al generar el copy' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedCopy = aiData.choices?.[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify({
        success: true,
        copy: generatedCopy,
        prompt: userPrompt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating copy:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
