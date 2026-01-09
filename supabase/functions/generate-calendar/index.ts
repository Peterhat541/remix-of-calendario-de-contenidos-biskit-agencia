import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres un generador de CALENDARIOS DE CONTENIDOS para redes sociales.

Tu función es crear un calendario mensual o de varios meses con publicaciones distribuidas por fechas, dejando un espacio claro y editable para cada post.

Cada post debe tener:
- fecha (formato YYYY-MM-DD)
- título del post
- copy del post

REGLAS OBLIGATORIAS:
- Devuelve ÚNICAMENTE JSON válido.
- NO uses markdown.
- NO escribas texto fuera del JSON.
- NO inventes datos que no estén indicados.
- NO utilices "No disponible".
- Usa "" para textos vacíos.
- Nunca devuelvas undefined.

Devuelve EXACTAMENTE este schema:
{
  "ok": true,
  "version": "calendar_v3_stable",
  "calendar": {
    "client_name": "",
    "brand": "",
    "channel": "",
    "month_start": "",
    "month_end": "",
    "posts_per_month": 0,
    "timezone": "Europe/Madrid",
    "language": "es-ES"
  },
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "title": "",
      "copy": ""
    }
  ],
  "errors": []
}

LÓGICA DE GENERACIÓN:
- El calendario debe cubrir desde month_start hasta month_end.
- Usa el valor posts_per_month para determinar cuántos posts generar en cada mes.
- Distribuye los posts de forma equilibrada a lo largo de cada mes.
- Asigna automáticamente la fecha de cada post (día y mes).
- El título y el copy deben ser coherentes con el canal indicado.
- El tono debe ser profesional, claro y orientado a negocio.
- No repitas exactamente los mismos títulos ni estructuras de copy.
- Los copies deben ser creativos, variados y adecuados para redes sociales.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData } = await req.json();
    
    if (!formData) {
      return new Response(
        JSON.stringify({ ok: false, error: 'No se proporcionaron datos del formulario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ ok: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Genera un calendario de contenidos con los siguientes datos:

Cliente: ${formData.clientName || 'No especificado'}
Marca: ${formData.brand || 'No especificada'}
Canal: ${formData.channel || 'Instagram'}
Mes inicio: ${formData.monthStart}
Mes fin: ${formData.monthEnd}
Posts por mes: ${formData.postsPerMonth || 8}
Tono: ${formData.tone || 'Profesional y cercano'}
Contexto adicional: ${formData.additionalContext || 'Ninguno'}

Genera el calendario completo en formato JSON siguiendo exactamente el schema indicado.`;

    console.log('Generating calendar for:', formData.clientName, 'Channel:', formData.channel);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Límite de peticiones excedido. Intenta de nuevo en unos minutos.', isTransient: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Créditos agotados. Añade fondos a tu workspace.', isTransient: false }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: 'Error del servicio de IA', isTransient: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ ok: false, error: 'No se recibió respuesta de la IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response
    let calendarData;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      calendarData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      return new Response(
        JSON.stringify({ ok: false, error: 'Error al parsear la respuesta de la IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calendar generated successfully with', calendarData.posts?.length || 0, 'posts');

    return new Response(
      JSON.stringify(calendarData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-calendar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno';
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage, isTransient: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
