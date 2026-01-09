import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere una imagen en base64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Eres un sistema de extracción de datos para informes justificativos SEO (Kit Digital – Fase II).

Tu ÚNICA función es leer capturas de pantalla de herramientas SEO y extraer TODOS los datos numéricos y textuales visibles.

🚫 REGLAS ABSOLUTAS:
❌ NO inventes datos que no aparezcan.
❌ NO devuelvas texto fuera del JSON.
❌ NO incluyas \`\`\`json ni markdown.

✅ Si un dato es legible → extráelo.
✅ Si un dato NO es legible o no existe → devuelve null.
✅ Prioriza extraer: números, porcentajes, listas, tablas.

📸 TIPOS DE CAPTURA A DETECTAR:
- "keywords": Tabla/listado de palabras clave con volúmenes de búsqueda
- "positioning": Distribución de posiciones (Top 3, Top 10, Top 20, etc.) o mensajes de "sin datos"
- "backlinks": Número de backlinks y dominios de referencia
- "headings": Análisis de H1, H2, H3 (conteos y ejemplos)
- "internal_links": Número de enlaces internos/externos
- "technical": robots.txt, sitemap, canonical, meta tags, enlaces rotos
- "pagespeed": Puntuaciones de rendimiento, accesibilidad, SEO
- "domain_overview": Visión general del dominio (tráfico, keywords totales, authority)
- "other": Solo si NO encaja en ninguna categoría anterior`;

    const userPrompt = `Analiza esta captura de pantalla SEO y devuelve SOLO un JSON compacto.

RESPUESTA OBLIGATORIA (JSON sin markdown, sin espacios extra):
{"tipo":"keywords|positioning|backlinks|headings|internal_links|technical|pagespeed|domain_overview|other","tool":"SEMrush|Sistrix|PageSpeed|null","dom":"dominio.com|null","date":"fecha|null","traf":null,"kw":null,"auth":null,"ref":null,"bl":null,"t3":null,"t10":null,"t20":null,"t100":null,"ps_perf":null,"ps_acc":null,"ps_bp":null,"ps_seo":null,"lcp":null,"cls":null,"inp":null,"rob":null,"sit":null,"can":null,"h1":null,"h2":null,"h3":null,"alt_ok":null,"alt_n":null,"int_l":null,"ext_l":null,"brk_l":null,"kw_list":[],"no_data":null}

CLAVES:
- tipo: tipo de captura
- tool: herramienta detectada
- dom: dominio
- date: fecha o rango
- traf: tráfico orgánico
- kw: palabras clave totales
- auth: authority score
- ref: dominios referencia
- bl: backlinks
- t3/t10/t20/t100: posiciones Top
- ps_*: pagespeed scores
- lcp/cls/inp: core web vitals
- rob/sit/can: robots/sitemap/canonical ok
- h1/h2/h3: conteo encabezados
- alt_ok/alt_n: alt images
- int_l/ext_l/brk_l: enlaces
- kw_list: [{"k":"keyword","v":vol,"p":pos}]
- no_data: mensaje si no hay datos

SOLO números visibles o null. SOLO JSON, sin texto extra.`;

    console.log('Calling Lovable AI for image analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Determine if error is transient
      const isTransient = response.status === 429 || response.status >= 500;
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Límite de peticiones alcanzado. Reintentando automáticamente...',
            isTransient: true 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Créditos agotados. Añade créditos en Settings > Workspace > Usage.',
            isTransient: false 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al analizar la imagen. Reintentando...',
          isTransient: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'La IA no devolvió resultados',
          isTransient: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean and parse the JSON response
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    console.log('AI Response (cleaned):', cleanContent.substring(0, 500) + '...');

    let extractedData;
    try {
      // Try to repair truncated JSON
      let jsonToparse = cleanContent;
      
      // If JSON is truncated, try to close it
      if (!jsonToparse.endsWith('}')) {
        // Count open braces and brackets
        const openBraces = (jsonToparse.match(/{/g) || []).length;
        const closeBraces = (jsonToparse.match(/}/g) || []).length;
        const openBrackets = (jsonToparse.match(/\[/g) || []).length;
        const closeBrackets = (jsonToparse.match(/]/g) || []).length;
        
        // Try to close arrays first, then objects
        let suffix = '';
        for (let i = 0; i < openBrackets - closeBrackets; i++) suffix += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) suffix += '}';
        
        // If we're in the middle of a value, try to close it
        if (jsonToparse.match(/:\s*"[^"]*$/)) {
          jsonToparse += '"';
        } else if (jsonToparse.match(/:\s*\d+$/)) {
          // Number is fine
        } else if (jsonToparse.match(/,\s*$/)) {
          // Remove trailing comma
          jsonToparse = jsonToparse.replace(/,\s*$/, '');
        } else if (jsonToparse.match(/:\s*$/)) {
          jsonToparse += 'null';
        }
        
        jsonToparse += suffix;
        console.log('Repaired JSON:', jsonToparse.substring(0, 200) + '...');
      }
      
      const parsed = JSON.parse(jsonToparse);
      
      // Map compact format to full format
      const tipoCaptura = (parsed.tipo || "").toLowerCase();
      let capture_type = "other";
      
      if (tipoCaptura.includes("keyword")) capture_type = "semrush_keyword_magic";
      else if (tipoCaptura.includes("position")) capture_type = "semrush_organic_positions";
      else if (tipoCaptura.includes("backlink")) capture_type = "semrush_backlinks";
      else if (tipoCaptura.includes("heading")) capture_type = "headings_analysis";
      else if (tipoCaptura.includes("internal") || tipoCaptura.includes("link")) capture_type = "internal_links_analysis";
      else if (tipoCaptura.includes("technical")) capture_type = "technical_audit";
      else if (tipoCaptura.includes("pagespeed")) capture_type = "pagespeed";
      else if (tipoCaptura.includes("domain") || tipoCaptura.includes("overview")) capture_type = "semrush_domain_overview";
      else {
        // Fallback: detect by available data
        if (parsed.traf !== null || parsed.auth !== null) capture_type = "semrush_domain_overview";
        else if (parsed.t3 !== null || parsed.t10 !== null) capture_type = "semrush_organic_positions";
        else if (parsed.bl !== null || parsed.ref !== null) capture_type = "semrush_backlinks";
        else if (parsed.h1 !== null || parsed.h2 !== null) capture_type = "headings_analysis";
        else if (parsed.ps_perf !== null) capture_type = "pagespeed";
        else if (parsed.kw_list && parsed.kw_list.length > 0) capture_type = "semrush_keyword_magic";
      }

      // Normalize to expected format
      extractedData = {
        capture_type,
        source_tool: parsed.tool || null,
        domain: parsed.dom || null,
        date_or_range: parsed.date || null,
        metrics: {
          organic_traffic: parsed.traf ?? null,
          keywords_count: parsed.kw ?? null,
          authority_score: parsed.auth ?? null,
          ref_domains: parsed.ref ?? null,
          backlinks: parsed.bl ?? null,
          top_3: parsed.t3 ?? null,
          top_10: parsed.t10 ?? null,
          top_11_20: parsed.t20 ?? null,
          top_21_100: parsed.t100 ?? null,
          pagespeed_performance: parsed.ps_perf ?? null,
          pagespeed_accessibility: parsed.ps_acc ?? null,
          pagespeed_best_practices: parsed.ps_bp ?? null,
          pagespeed_seo: parsed.ps_seo ?? null,
          lcp_ms: parsed.lcp ?? null,
          cls: parsed.cls ?? null,
          inp_ms: parsed.inp ?? null,
          keyword_list: Array.isArray(parsed.kw_list)
            ? parsed.kw_list.map((k: any) => ({
                keyword: k.k || "",
                volume: k.v ?? null,
                kd: k.kd ?? null,
                position: k.p ?? null,
              }))
            : [],
        },
        evidence: [],
        robots_ok: parsed.rob ?? null,
        sitemap_ok: parsed.sit ?? null,
        canonicals_ok: parsed.can ?? null,
        h1_count: parsed.h1 ?? null,
        h2_count: parsed.h2 ?? null,
        h3_count: parsed.h3 ?? null,
        h1_examples: null,
        alt_images_ok: parsed.alt_ok ?? null,
        alt_images_count: parsed.alt_n ?? null,
        internal_links: parsed.int_l ?? null,
        external_links: parsed.ext_l ?? null,
        broken_links: parsed.brk_l ?? null,
        no_data_message: parsed.no_data ?? null,
        generated_text: "",
      };
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', cleanContent);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al interpretar la respuesta de la IA',
          raw_response: cleanContent,
          isTransient: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted data, capture_type:', extractedData.capture_type);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        isTransient: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
