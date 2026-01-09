/**
 * Edge Function: vision-extract-seguimiento
 * Extracts data from Informe de Seguimiento screenshots using AI
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un experto en análisis SEO. Analiza las capturas de pantalla de SEMrush y extrae los datos solicitados para un "Informe de Seguimiento".

IMPORTANTE: Extrae SOLO los datos que puedas ver claramente en las imágenes. Si un dato no es visible, devuelve null para ese campo.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "period": {
    "start": "mes año",
    "end": "mes año",
    "months": ["mes1 año", "mes2 año", ...]
  },
  "main_domain": {
    "domain": "dominio.es",
    "authority_score": número o null,
    "organic_traffic": número o null,
    "organic_keywords": número o null,
    "backlinks": número o null,
    "ref_domains": número o null,
    "paid_traffic": true/false
  },
  "indexation": {
    "h1": "texto del H1" o null,
    "h2_list": ["h2 1", "h2 2", ...],
    "robots_txt": true/false,
    "sitemap_xml": true/false,
    "total_links": número o null,
    "internal_links": número o null,
    "external_links": número o null
  },
  "serp": {
    "top3": número o null,
    "top10": número o null,
    "top20": número o null,
    "top50": número o null,
    "top100": número o null
  },
  "keywords": {
    "total": número o null,
    "brand_keyword": "keyword principal de marca" o null,
    "navigational": número o porcentaje o null,
    "informational": número o porcentaje o null,
    "commercial": número o porcentaje o null,
    "transactional": número o porcentaje o null
  },
  "missing": ["lista de campos que no pudiste extraer"]
}

REGLAS:
- Si ves un gráfico de evolución temporal, extrae el período de meses visible
- Para tráfico orgánico, extrae el valor medio si hay rango
- Para Authority Score, busca el número junto al logo del dominio
- Para keywords, busca "Organic Keywords" o "Palabras clave orgánicas"
- Para backlinks, busca "Backlinks" y "Referring Domains"
- Para tráfico de pago, indica true si hay valor > 0 en "Paid Traffic"
- Para encabezados, busca la estructura H1, H2, H3
- Para SERP, busca la distribución de posiciones (Top 3, Top 10, etc.)
- Para intención de keywords, busca navegacional/informativa/comercial/transaccional`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, caseId } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No se proporcionaron imágenes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[vision-extract-seguimiento] Processing ${images.length} images for case ${caseId}`);

    // Build message content with images
    const content: any[] = [
      {
        type: "text",
        text: "Analiza estas capturas de un Informe de Seguimiento SEO y extrae todos los datos visibles según el formato JSON especificado.",
      },
    ];

    for (const img of images) {
      content.push({
        type: "image_url",
        image_url: { url: img.src },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[vision-extract-seguimiento] AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Límite de peticiones excedido. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos agotados. Añade fondos a tu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    console.log("[vision-extract-seguimiento] AI response:", rawContent.substring(0, 500));

    // Parse JSON from response
    let parsed: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[vision-extract-seguimiento] JSON parse error:", parseErr);
      return new Response(
        JSON.stringify({ success: false, error: "No se pudo interpretar la respuesta de la IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform to our format
    const result = {
      success: true,
      period: parsed.period || null,
      mainDomain: parsed.main_domain
        ? {
            domain: parsed.main_domain.domain,
            authorityScore: parsed.main_domain.authority_score,
            organicTraffic: parsed.main_domain.organic_traffic,
            organicKeywords: parsed.main_domain.organic_keywords,
            backlinks: parsed.main_domain.backlinks,
            refDomains: parsed.main_domain.ref_domains,
            paidTraffic: parsed.main_domain.paid_traffic ?? false,
          }
        : null,
      indexation: parsed.indexation
        ? {
            h1: parsed.indexation.h1,
            h2List: parsed.indexation.h2_list || [],
            robotsTxt: parsed.indexation.robots_txt ?? false,
            sitemapXml: parsed.indexation.sitemap_xml ?? false,
            totalLinks: parsed.indexation.total_links,
            internalLinks: parsed.indexation.internal_links,
            externalLinks: parsed.indexation.external_links,
          }
        : null,
      serp: parsed.serp || null,
      keywords: parsed.keywords
        ? {
            total: parsed.keywords.total,
            brandKeyword: parsed.keywords.brand_keyword,
            navigational: parsed.keywords.navigational,
            informational: parsed.keywords.informational,
            commercial: parsed.keywords.commercial,
            transactional: parsed.keywords.transactional,
          }
        : null,
      missing: parsed.missing || [],
    };

    console.log("[vision-extract-seguimiento] Extracted:", JSON.stringify(result, null, 2).substring(0, 800));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[vision-extract-seguimiento] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
