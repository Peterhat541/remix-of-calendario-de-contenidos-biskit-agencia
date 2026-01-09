import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Función de reintento con backoff exponencial
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Si es error 5xx, reintentamos
      if (response.status >= 500 && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Retry attempt ${attempt + 1} after ${waitTime}ms due to status ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retry attempt ${attempt + 1} after ${waitTime}ms due to error:`, error);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseId, images } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    console.log(`Processing ${images.length} images for case ${caseId}`);

    const systemPrompt = `Eres un experto en análisis SEO con amplia experiencia en la interpretación de capturas de herramientas como SEMrush, Ahrefs, Moz, etc. Tu tarea es extraer datos estructurados de las capturas proporcionadas para generar un Informe Trimestral de Seguimiento del SEO.

INSTRUCCIONES CRÍTICAS:
1. Analiza CADA imagen con máximo detalle. Las capturas contienen dashboards, tablas y gráficos con muchos KPIs.
2. Extrae TODOS los valores numéricos exactos que veas (Authority Score, tráfico, keywords, backlinks, etc.)
3. Identifica el dominio principal analizado y todos los competidores que aparezcan en las comparativas.
4. Lee las tablas de keywords con sus volúmenes, tendencias y competición.
5. Extrae los datos de indexación: title tag, meta description, encabezados H1/H2/H3.
6. Analiza la estructura de enlaces: % internos, externos follow, nofollow.
7. Revisa los datos técnicos: robots.txt, sitemap, canonical, hreflang, enlaces rotos.

Devuelve SOLO un JSON válido con esta estructura exacta:
{
  "detectedPeriod": { "start": "mes año", "end": "mes año", "months": ["agosto 2025", "septiembre 2025", "octubre 2025", "noviembre 2025"] },
  "keywords": {
    "list": [{ "keyword": "automatización industrial", "avgVolume": 2400, "trend": "Baja", "competition": "1" }],
    "summary": "Resumen detallado de las palabras clave principales, su relevancia para el mercado objetivo y su efectividad para generar tráfico."
  },
  "mainDomain": {
    "domain": "ejemplo.com",
    "authorityScore": 7,
    "organicTraffic": 9,
    "organicKeywords": 2,
    "backlinks": 67,
    "refDomains": 63,
    "paidTraffic": 0,
    "trafficShare": "<1%"
  },
  "competitors": [
    { "domain": "competidor1.com", "authorityScore": 13, "organicTraffic": 652, "organicKeywords": 544, "backlinks": 346, "refDomains": 218 },
    { "domain": "competidor2.com", "authorityScore": 13, "organicTraffic": 1200, "organicKeywords": 587, "backlinks": 294, "refDomains": 130 }
  ],
  "keywordOverlap": { "mainCount": 1, "competitors": [{ "domain": "comp.com", "count": 378 }] },
  "indexation": {
    "titleTag": "Título exacto de la página",
    "titleLength": 45,
    "metaDescription": "Descripción meta completa tal como aparece",
    "metaDescriptionLength": 124,
    "h1": "Encabezado H1 principal",
    "h2List": ["Predicción en la maquinaria industrial", "Instalaciones rápidas", "Testimonios"],
    "h3List": ["Mantenimiento predictivo", "Ingeniería de sensores"]
  },
  "seoOnPage": {
    "totalLinks": 13,
    "internalLinksPercent": 92,
    "externalFollowPercent": 8,
    "externalNofollowPercent": 0
  },
  "technicalSeo": {
    "urlResolution": true,
    "robotsTxt": true,
    "sitemapXml": "https://ejemplo.com/sitemap_index.xml",
    "canonical": "https://ejemplo.com/",
    "robotsMeta": "index, follow",
    "hreflangTags": [{ "url": "https://ejemplo.com/", "lang": "es-ES" }, { "url": "https://ejemplo.com/en/", "lang": "en-US" }],
    "brokenLinks": 0
  },
  "missing": []
}

IMPORTANTE: 
- Extrae los valores EXACTOS que aparecen en las imágenes, no inventes datos.
- Si no encuentras un dato específico, usa null.
- En "missing" lista SOLO los campos que no pudiste encontrar en las imágenes.
- Presta especial atención a los números en tablas comparativas de competidores.`;

    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: img },
    }));

    const response = await fetchWithRetry(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: "Analiza estas capturas de herramientas SEO (SEMrush, Ahrefs, etc.) con máximo detalle. Extrae TODOS los datos numéricos exactos que aparecen: Authority Score, tráfico orgánico, keywords, backlinks, dominios de referencia, datos de competidores, estructura de enlaces, datos de indexación y configuración técnica SEO. Devuelve el JSON estructurado con los valores exactos de las imágenes." },
                ...imageContents,
              ],
            },
          ],
        }),
      },
      3 // 3 reintentos
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Por favor, espera un momento e inténtalo de nuevo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere añadir créditos al workspace de Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response received, parsing JSON...");

    // Parse JSON from response
    let reportData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Content:", content);
      reportData = {
        detectedPeriod: null,
        keywords: null,
        mainDomain: null,
        competitors: [],
        keywordOverlap: null,
        indexation: null,
        seoOnPage: null,
        technicalSeo: null,
        missing: ["Error al parsear respuesta de IA"],
      };
    }

    console.log("Successfully extracted report data");

    return new Response(JSON.stringify({ success: true, reportData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in vision-extract-ecommerce:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});