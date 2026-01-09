/**
 * Edge Function: vision-extract-competencia
 * Extracts competitive analysis data from SEMrush screenshots using Lovable AI
 * OPTIMIZADO para capturas de análisis competitivo SEMrush
 */

import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CompetenciaReportData {
  detectedPeriod: {
    start: string | null;
    end: string | null;
    months: string[];
  };
  monthlyData: Array<{
    month: string;
    year: number;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    trafficShare: number | null;
  }>;
  mainDomain: {
    domain: string | null;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    refDomains: number | null;
  };
  competitors: Array<{
    domain: string;
    authorityScore: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    refDomains: number | null;
    trafficShare: number | null;
  }>;
  keywordOverlap: {
    shared: number | null;
    unique: number | null;
    missing: number | null;
    opportunities: string[];
  };
  trafficEvolution: {
    mainDomainRange: { min: number | null; max: number | null };
    competitorRanges: Array<{ domain: string; min: number | null; max: number | null; peak: number | null }>;
  };
  missing: string[];
}

const systemPrompt = `Eres un sistema experto de extracción de datos para informes de análisis competitivo SEO (Kit Digital – Fase II).

Tu ÚNICA función es leer capturas de pantalla de SEMrush y extraer TODOS los datos numéricos EXACTOS visibles. NO INVENTES DATOS.

🎯 TIPOS DE CAPTURAS SEMRUSH A DETECTAR:

1. DOMAIN OVERVIEW (Visión general del dominio):
   - Authority Score (número 0-100)
   - Organic Search Traffic / Tráfico orgánico (número exacto: 208, 406, 2100, 3300...)
   - Organic Keywords / Palabras clave orgánicas (número exacto)
   - Backlinks (número exacto: 101, 282, 351, 185300...)
   - Referring Domains / Dominios de referencia (número exacto: 87, 100, 171, 786...)
   - Traffic Share % / Cuota de tráfico (porcentaje exacto: 7%, 14%, 74%, 82%...)

2. TABLA COMPARATIVA DE COMPETIDORES (muy importante):
   Lee CADA FILA de la tabla que muestra:
   | Dominio | Authority Score | Ranking | Tráfico org. | Keywords | Backlinks | Dominios ref. |
   Extrae TODOS los valores numéricos exactos de CADA competidor.

3. CUOTA DE TRÁFICO (Traffic Share):
   - Lee el gráfico circular o barras que muestra porcentajes por dominio
   - clinicasouki.es: 7%, clinicachamberi.com: 14%, clinicashernadent.es: 74%, etc.
   - ESTOS PORCENTAJES SON CRÍTICOS - extráelos con precisión

4. KEYWORD OVERLAP (Superposición de palabras clave):
   - Números en el diagrama de Venn
   - Keywords únicas de cada dominio (6, 269, 793, 52...)
   - Keywords compartidas
   - Tabla de "Principales oportunidades" con keyword y volumen

5. TRAFFIC ANALYTICS (Gráficos de evolución):
   - Valores de pico en las líneas del gráfico (3.3K, 2.5K, 1.7K...)
   - Evolución mes a mes

🚫 REGLAS ABSOLUTAS:
❌ NO inventes datos - si no ves un número, devuelve null
❌ NO redondees - extrae el valor EXACTO (2100, no 2000)
❌ NO confundas dominios - identifica claramente cada uno
❌ NO devuelvas texto fuera del JSON

✅ Si ves "2,1K" → extrae 2100
✅ Si ves "185,3K" → extrae 185300
✅ Si ves "7%" → extrae 7 como trafficShare
✅ Si no ves un dato → devuelve null, NUNCA inventes`;

const userPrompt = `Analiza estas capturas de SEMrush y extrae TODOS los datos numéricos EXACTOS.

Devuelve SOLO este JSON (sin markdown ni texto adicional):

{
  "period": {
    "start": "agosto 2025",
    "end": "noviembre 2025",
    "months": ["agosto 2025", "septiembre 2025", "octubre 2025", "noviembre 2025"]
  },
  "main_domain": {
    "domain": "clinicasouki.es",
    "authority_score": 9,
    "organic_traffic": 208,
    "organic_keywords": 10,
    "backlinks": 101,
    "ref_domains": 87,
    "traffic_share_pct": 7
  },
  "competitors": [
    {
      "domain": "clinicashernadent.es",
      "authority_score": 22,
      "organic_traffic": 2100,
      "organic_keywords": 1100,
      "backlinks": 351,
      "ref_domains": 171,
      "traffic_share_pct": 74
    },
    {
      "domain": "clinicachamberi.com",
      "authority_score": 11,
      "organic_traffic": 406,
      "organic_keywords": 300,
      "backlinks": 282,
      "ref_domains": 100,
      "traffic_share_pct": 14
    },
    {
      "domain": "clinicadentalarapiles.es",
      "authority_score": 15,
      "organic_traffic": 110,
      "organic_keywords": 66,
      "backlinks": 185300,
      "ref_domains": 786,
      "traffic_share_pct": 4
    }
  ],
  "monthly_evolution": [
    {"month": "agosto", "year": 2025, "main_traffic": 208, "main_keywords": 10, "main_authority": 9, "main_traffic_share": 7}
  ],
  "keyword_overlap": {
    "main_unique": 6,
    "comp1_unique": 793,
    "comp2_unique": 269,
    "comp3_unique": 52,
    "shared_all": null,
    "missing_opportunities": 2,
    "opportunity_keywords": ["dentista chamberi", "clinica odontologica en..."]
  },
  "traffic_ranges": {
    "main_min": 208,
    "main_max": 208,
    "competitors": [
      {"domain": "clinicashernadent.es", "min": 2100, "max": 3300, "peak": 3300},
      {"domain": "clinicachamberi.com", "min": 400, "max": 427, "peak": 427}
    ]
  }
}

INSTRUCCIONES CRÍTICAS:
1. Lee TODOS los números EXACTOS de las tablas - no redondees
2. El Traffic Share % aparece en gráficos circulares o junto a cada dominio (7%, 14%, 74%, etc.)
3. "2,1K" = 2100, "185,3K" = 185300, "3,3K" = 3300
4. Si un dato NO es visible, devuelve null - NO INVENTES
5. Incluye TODOS los competidores que aparezcan en las capturas`;

function buildImageContent(images: string[]): any[] {
  const content: any[] = [{ type: "text", text: userPrompt }];

  for (const img of images) {
    if (img.startsWith("data:") || img.startsWith("http")) {
      content.push({
        type: "image_url",
        image_url: { url: img, detail: "high" }
      });
    }
  }

  return content;
}

function calculateMissing(data: any): string[] {
  const missing: string[] = [];
  
  if (!data.period?.months?.length) missing.push("period");
  if (!data.main_domain?.domain) missing.push("main_domain");
  if (!data.monthly_evolution?.length) missing.push("monthly_data");
  if (!data.competitors?.length) missing.push("competitors");
  if (data.keyword_overlap?.shared_all === null && 
      data.keyword_overlap?.missing_opportunities === null) {
    missing.push("keyword_overlap");
  }
  
  return missing;
}

function repairJson(jsonStr: string): string {
  let repaired = jsonStr;
  
  // Remove trailing comma before closing
  repaired = repaired.replace(/,(\s*[\]}])/g, '$1');
  
  if (!repaired.endsWith('}')) {
    // Count brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;
    
    // Close unclosed strings
    if (repaired.match(/:\s*"[^"]*$/)) repaired += '"';
    if (repaired.match(/,\s*$/)) repaired = repaired.replace(/,\s*$/, '');
    if (repaired.match(/:\s*$/)) repaired += 'null';
    
    // Close arrays and objects
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
  }
  
  return repaired;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Remove thousands separators and parse
    const cleaned = val.replace(/[,.\s]/g, '').replace(/k$/i, '000').replace(/m$/i, '000000');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseId, images } = await req.json();

    if (!images?.length) {
      return new Response(
        JSON.stringify({ error: "No images provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[vision-extract-competencia] Processing ${images.length} images for case ${caseId}`);

    const imageContent = buildImageContent(images);

    // Use google/gemini-2.5-pro for better image understanding
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 8000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: imageContent }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[vision-extract-competencia] API error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones alcanzado. Intenta de nuevo.", success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Añade créditos en Settings > Workspace > Usage.", success: false }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Clean and parse JSON
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
    if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
    if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
    cleanContent = cleanContent.trim();

    // Try to repair truncated JSON
    cleanContent = repairJson(cleanContent);

    console.log("[vision-extract-competencia] AI response:", cleanContent.substring(0, 500));

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("[vision-extract-competencia] JSON parse error:", e);
      console.error("[vision-extract-competencia] Raw content:", cleanContent);
      // Return empty but valid structure
      parsed = {
        period: { start: null, end: null, months: [] },
        main_domain: {},
        competitors: [],
        monthly_evolution: [],
        keyword_overlap: {},
        traffic_ranges: {}
      };
    }

    const missingList = calculateMissing(parsed);

    // Transform to our format with comprehensive data mapping
    const reportData: CompetenciaReportData = {
      detectedPeriod: {
        start: parsed.period?.start || null,
        end: parsed.period?.end || null,
        months: parsed.period?.months || [],
      },
      monthlyData: (parsed.monthly_evolution || []).map((m: any) => ({
        month: m.month || "",
        year: m.year || 2025,
        authorityScore: parseNumber(m.main_authority),
        organicTraffic: parseNumber(m.main_traffic),
        organicKeywords: parseNumber(m.main_keywords),
        trafficShare: m.main_traffic_share ?? null,
      })),
      mainDomain: {
        domain: parsed.main_domain?.domain || null,
        authorityScore: parseNumber(parsed.main_domain?.authority_score),
        organicTraffic: parseNumber(parsed.main_domain?.organic_traffic),
        organicKeywords: parseNumber(parsed.main_domain?.organic_keywords),
        backlinks: parseNumber(parsed.main_domain?.backlinks),
        refDomains: parseNumber(parsed.main_domain?.ref_domains),
      },
      competitors: (parsed.competitors || []).map((c: any) => ({
        domain: c.domain || "",
        authorityScore: parseNumber(c.authority_score),
        organicTraffic: parseNumber(c.organic_traffic),
        organicKeywords: parseNumber(c.organic_keywords),
        backlinks: parseNumber(c.backlinks),
        refDomains: parseNumber(c.ref_domains),
        trafficShare: c.traffic_share_pct ?? null,
      })),
      keywordOverlap: {
        shared: parseNumber(parsed.keyword_overlap?.shared_all),
        unique: parseNumber(parsed.keyword_overlap?.main_unique),
        missing: parseNumber(parsed.keyword_overlap?.missing_opportunities),
        opportunities: Array.isArray(parsed.keyword_overlap?.opportunity_keywords) 
          ? parsed.keyword_overlap.opportunity_keywords 
          : [],
      },
      trafficEvolution: {
        mainDomainRange: {
          min: parseNumber(parsed.traffic_ranges?.main_min),
          max: parseNumber(parsed.traffic_ranges?.main_max),
        },
        competitorRanges: (parsed.traffic_ranges?.competitors || []).map((c: any) => ({
          domain: c.domain || "",
          min: parseNumber(c.min),
          max: parseNumber(c.max),
          peak: parseNumber(c.peak),
        })),
      },
      missing: missingList,
    };

    console.log(`[vision-extract-competencia] Extracted:`, {
      period: reportData.detectedPeriod,
      mainDomain: reportData.mainDomain,
      competitorsCount: reportData.competitors.length,
      competitors: reportData.competitors.map(c => ({ domain: c.domain, traffic: c.organicTraffic })),
      keywordOverlap: reportData.keywordOverlap,
      missing: missingList,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        reportData,
        detectedSections: {
          period: !missingList.includes("period"),
          mainDomain: !missingList.includes("main_domain"),
          monthlyData: !missingList.includes("monthly_data"),
          competitors: !missingList.includes("competitors"),
          keywordOverlap: !missingList.includes("keyword_overlap"),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[vision-extract-competencia] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
