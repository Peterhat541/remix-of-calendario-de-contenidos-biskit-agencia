import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Schema for reportData - this is the contract
interface ReportData {
  siteUrl: string;
  servicePeriod: string;
  reportDate: string;
  beneficiary: string;
  keywords: Array<{
    keyword: string;
    volume: number | null;
    kd: number | null;
  }>;
  backlinks: {
    backlinksCount: number | null;
    refDomainsCount: number | null;
  };
  headings: {
    h1Count: number | null;
    h2Count: number | null;
    h3Count: number | null;
    h1Text: string | null;
    h2Examples: string[];
    h3Examples: string[];
  };
  internalLinks: {
    total: number | null;
    internalPct: number | null;
  };
  technical: {
    robotsOk?: boolean | null;
    sitemapOk?: boolean | null;
    canonicalsOk?: boolean | null;
    metaOk?: boolean | null;
    brokenLinks?: number | null;
    hreflang?: boolean | null;
  };
  pagespeed: {
    performance?: number | null;
    accessibility?: number | null;
    bestPractices?: number | null;
    seo?: number | null;
  };
  missing: string[];
}

// OpenAI structured output schema for extraction
const extractionSchema = {
  type: "object",
  properties: {
    keywords: {
      type: "array",
      description: "List of keywords with search volume and difficulty",
      items: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "The keyword term" },
          volume: { type: ["number", "null"], description: "Monthly search volume" },
          kd: { type: ["number", "null"], description: "Keyword difficulty (0-100)" }
        },
        required: ["keyword", "volume", "kd"],
        additionalProperties: false
      }
    },
    backlinks: {
      type: "object",
      properties: {
        backlinksCount: { type: ["number", "null"], description: "Total number of backlinks" },
        refDomainsCount: { type: ["number", "null"], description: "Number of referring domains" }
      },
      required: ["backlinksCount", "refDomainsCount"],
      additionalProperties: false
    },
    headings: {
      type: "object",
      properties: {
        h1Count: { type: ["number", "null"], description: "Number of H1 tags" },
        h2Count: { type: ["number", "null"], description: "Number of H2 tags" },
        h3Count: { type: ["number", "null"], description: "Number of H3 tags" },
        h1Text: { type: ["string", "null"], description: "Text of the main H1" },
        h2Examples: { type: "array", items: { type: "string" }, description: "2-5 example H2 texts" },
        h3Examples: { type: "array", items: { type: "string" }, description: "2-5 example H3 texts" }
      },
      required: ["h1Count", "h2Count", "h3Count", "h1Text", "h2Examples", "h3Examples"],
      additionalProperties: false
    },
    internalLinks: {
      type: "object",
      properties: {
        total: { type: ["number", "null"], description: "Total number of links" },
        internalPct: { type: ["number", "null"], description: "Percentage of internal links (0-100)" }
      },
      required: ["total", "internalPct"],
      additionalProperties: false
    },
    technical: {
      type: "object",
      properties: {
        robotsOk: { type: ["boolean", "null"], description: "Is robots.txt configured correctly" },
        sitemapOk: { type: ["boolean", "null"], description: "Is sitemap.xml present and valid" },
        canonicalsOk: { type: ["boolean", "null"], description: "Are canonical tags configured" },
        metaOk: { type: ["boolean", "null"], description: "Are meta title/description present" },
        brokenLinks: { type: ["number", "null"], description: "Number of broken links found" },
        hreflang: { type: ["boolean", "null"], description: "Is hreflang configured" }
      },
      required: ["robotsOk", "sitemapOk", "canonicalsOk", "metaOk", "brokenLinks", "hreflang"],
      additionalProperties: false
    },
    pagespeed: {
      type: "object",
      properties: {
        performance: { type: ["number", "null"], description: "PageSpeed performance score (0-100)" },
        accessibility: { type: ["number", "null"], description: "Accessibility score (0-100)" },
        bestPractices: { type: ["number", "null"], description: "Best practices score (0-100)" },
        seo: { type: ["number", "null"], description: "SEO score (0-100)" }
      },
      required: ["performance", "accessibility", "bestPractices", "seo"],
      additionalProperties: false
    },
    detectedSections: {
      type: "array",
      description: "Which sections were successfully detected in the images",
      items: {
        type: "string",
        enum: ["keywords", "backlinks", "headings", "internalLinks", "technical", "pagespeed"]
      }
    }
  },
  required: ["keywords", "backlinks", "headings", "internalLinks", "technical", "pagespeed", "detectedSections"],
  additionalProperties: false
};

const systemPrompt = `Eres un extractor de datos SEO experto. Analiza las capturas de pantalla de herramientas SEO (SEMrush, Ahrefs, PageSpeed Insights, Site Audit, etc.) y extrae TODOS los datos numéricos y textuales visibles.

REGLAS CRÍTICAS:
1. Extrae TODOS los números que veas: volúmenes de búsqueda, backlinks, dominios de referencia, conteos de H1/H2/H3, enlaces internos/externos, scores de PageSpeed.
2. Para keywords: extrae el término EXACTO y su volumen de búsqueda mensual. Si ves KD (keyword difficulty), inclúyelo.
3. Para backlinks: busca "Backlinks", "Enlaces entrantes", "Referring domains", "Dominios de referencia".
4. Para headings: busca conteos de H1, H2, H3 en auditorías o análisis de página.
5. Para enlaces internos: busca "Internal links", "Enlaces internos", porcentaje de distribución.
6. Para PageSpeed: extrae los 4 scores circulares (Performance, Accessibility, Best Practices, SEO).
7. Para técnico: busca robots.txt, sitemap.xml, canonicals, meta tags, broken links.

IMPORTANTE:
- Si un dato NO está visible en ninguna imagen, devuelve null para ese campo.
- En "detectedSections" indica SOLO las secciones donde encontraste datos reales (no null).
- Extrae mínimo 4-10 keywords si hay tabla de keywords visible.
- Los h2Examples y h3Examples deben tener 2-5 ejemplos reales del texto.`;

// Build image content for OpenAI API
function buildImageContent(images: string[]): Array<{ type: string; image_url?: { url: string }; text?: string }> {
  const content: Array<{ type: string; image_url?: { url: string }; text?: string }> = [];
  
  // Add instruction text first
  content.push({
    type: "text",
    text: "Analiza las siguientes capturas de herramientas SEO y extrae todos los datos estructurados según el schema:"
  });
  
  // Add each image (max 8)
  const maxImages = Math.min(images.length, 8);
  for (let i = 0; i < maxImages; i++) {
    const img = images[i];
    let imageUrl = img;
    
    // If it's already a data URL or public URL, use directly
    // OpenAI accepts both data:image/... and https:// URLs
    if (!img.startsWith("data:") && !img.startsWith("http")) {
      // Assume it's raw base64, add data URL prefix
      imageUrl = `data:image/png;base64,${img}`;
    }
    
    content.push({
      type: "image_url",
      image_url: { url: imageUrl }
    });
  }
  
  return content;
}

// Calculate which sections are missing based on extracted data
function calculateMissing(data: Partial<ReportData>): string[] {
  const missing: string[] = [];
  
  // Keywords: need at least 4 with volume
  const validKeywords = (data.keywords || []).filter(k => k.keyword && k.volume !== null);
  if (validKeywords.length < 4) {
    missing.push("keywords");
  }
  
  // Backlinks: need both counts
  if (data.backlinks?.backlinksCount === null && data.backlinks?.refDomainsCount === null) {
    missing.push("backlinks");
  }
  
  // Headings: need H1/H2/H3 counts
  if (data.headings?.h1Count === null && data.headings?.h2Count === null && data.headings?.h3Count === null) {
    missing.push("headings");
  }
  
  // Internal links
  if (data.internalLinks?.total === null && data.internalLinks?.internalPct === null) {
    missing.push("internalLinks");
  }
  
  // PageSpeed: need at least one score
  const ps = data.pagespeed || {};
  if (ps.performance === null && ps.accessibility === null && ps.bestPractices === null && ps.seo === null) {
    missing.push("pagespeed");
  }
  
  // Technical: optional but flag if completely empty
  const tech = data.technical || {};
  const hasTech = tech.robotsOk !== null || tech.sitemapOk !== null || tech.canonicalsOk !== null || 
                  tech.metaOk !== null || tech.brokenLinks !== null;
  if (!hasTech) {
    missing.push("technical");
  }
  
  return missing;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { caseId, images } = body as { caseId: string; images: string[] };

    console.log(`[vision-extract] Received request for caseId: ${caseId}`);
    console.log(`[vision-extract] Number of images: ${images?.length || 0}`);

    // Validate input
    if (!caseId || typeof caseId !== "string") {
      console.error("[vision-extract] Missing or invalid caseId");
      return new Response(
        JSON.stringify({ error: "Missing or invalid caseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error("[vision-extract] Missing or invalid images array");
      return new Response(
        JSON.stringify({ error: "Missing or invalid images array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("[vision-extract] OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build image content for API
    const imageContent = buildImageContent(images);
    console.log(`[vision-extract] Prepared ${imageContent.length - 1} images for OpenAI`);

    // Call OpenAI with vision and structured output
    console.log("[vision-extract] Calling OpenAI Vision API...");
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: imageContent }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "seo_extraction",
            strict: true,
            schema: extractionSchema
          }
        },
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[vision-extract] OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      
      if (openaiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const messageContent = openaiData.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      console.error("[vision-extract] No content in OpenAI response");
      return new Response(
        JSON.stringify({ error: "No response from OpenAI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the structured JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(messageContent);
      console.log("[vision-extract] Successfully parsed OpenAI response");
      console.log(`[vision-extract] Detected sections: ${extractedData.detectedSections?.join(", ") || "none"}`);
    } catch (parseError) {
      console.error("[vision-extract] Failed to parse OpenAI response:", parseError);
      console.error("[vision-extract] Raw response:", messageContent);
      return new Response(
        JSON.stringify({ error: "Invalid JSON from OpenAI", details: String(parseError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build final reportData
    const reportData: ReportData = {
      siteUrl: "",
      servicePeriod: "",
      reportDate: "",
      beneficiary: "",
      keywords: extractedData.keywords || [],
      backlinks: {
        backlinksCount: extractedData.backlinks?.backlinksCount ?? null,
        refDomainsCount: extractedData.backlinks?.refDomainsCount ?? null,
      },
      headings: {
        h1Count: extractedData.headings?.h1Count ?? null,
        h2Count: extractedData.headings?.h2Count ?? null,
        h3Count: extractedData.headings?.h3Count ?? null,
        h1Text: extractedData.headings?.h1Text ?? null,
        h2Examples: extractedData.headings?.h2Examples || [],
        h3Examples: extractedData.headings?.h3Examples || [],
      },
      internalLinks: {
        total: extractedData.internalLinks?.total ?? null,
        internalPct: extractedData.internalLinks?.internalPct ?? null,
      },
      technical: extractedData.technical || {},
      pagespeed: extractedData.pagespeed || {},
      missing: [],
    };

    // Calculate what's missing
    reportData.missing = calculateMissing(reportData);
    
    // Log extraction summary
    const kwCount = reportData.keywords.filter(k => k.volume !== null).length;
    console.log(`[vision-extract] Extraction summary:`);
    console.log(`  - Keywords with volume: ${kwCount}`);
    console.log(`  - Backlinks: ${reportData.backlinks.backlinksCount}, RefDomains: ${reportData.backlinks.refDomainsCount}`);
    console.log(`  - H1/H2/H3: ${reportData.headings.h1Count}/${reportData.headings.h2Count}/${reportData.headings.h3Count}`);
    console.log(`  - Internal links: ${reportData.internalLinks.total} (${reportData.internalLinks.internalPct}%)`);
    console.log(`  - PageSpeed: P=${reportData.pagespeed.performance}, A=${reportData.pagespeed.accessibility}, BP=${reportData.pagespeed.bestPractices}, SEO=${reportData.pagespeed.seo}`);
    console.log(`  - Missing sections: ${reportData.missing.length > 0 ? reportData.missing.join(", ") : "none"}`);

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[vision-extract] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert the vision report
    const { data: upsertData, error: upsertError } = await supabase
      .from("vision_reports")
      .upsert(
        {
          case_id: caseId,
          report_data: reportData,
          missing: reportData.missing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "case_id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("[vision-extract] Database upsert error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save report data", details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[vision-extract] Successfully saved to database, id: ${upsertData?.id}`);

    // Return the reportData
    return new Response(
      JSON.stringify({
        success: true,
        reportData,
        savedId: upsertData?.id,
        detectedSections: extractedData.detectedSections || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[vision-extract] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
