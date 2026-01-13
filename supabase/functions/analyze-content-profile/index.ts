import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  contactId: string;
  urls: {
    website?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    linkedin?: string | null;
    google_business?: string | null;
  };
  existingData?: {
    tone_style?: string | null;
    emoji_style?: string | null;
    brand_notes?: string | null;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactId, urls, existingData } = (await req.json()) as AnalyzeRequest;

    if (!contactId) {
      return new Response(
        JSON.stringify({ error: "contactId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build context from available URLs and existing data
    const urlList = Object.entries(urls)
      .filter(([_, value]) => value)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const existingContext = existingData
      ? `
Existing brand information:
- Tone style preference: ${existingData.tone_style || "not specified"}
- Emoji usage: ${existingData.emoji_style || "moderado"}
- Brand notes: ${existingData.brand_notes || "none"}
`
      : "";

    const systemPrompt = `You are a brand analyst specializing in social media content strategy. 
Your task is to analyze brand information and create a comprehensive content profile.

IMPORTANT RULES:
1. DO NOT invent services, products, or claims that are not explicitly mentioned.
2. If information is missing, acknowledge it rather than making assumptions.
3. Focus on tone, style, and communication patterns you can reasonably infer.
4. Be conservative with confidence scores - only high scores if you have substantial data.
5. Return ONLY valid JSON, no markdown or additional text.`;

    const userPrompt = `Analyze the following brand information and create a content profile:

${urlList ? `Available URLs:\n${urlList}` : "No URLs provided"}

${existingContext}

Generate a JSON response with this exact structure:
{
  "brand_summary": "Brief summary of the brand (2-3 sentences, or null if insufficient data)",
  "tone_guidelines": {
    "primary_tone": "main tone (formal/profesional/cercano/informal/técnico/inspirador/divertido)",
    "secondary_tone": "secondary tone or null",
    "formality_level": "formal/neutral/informal",
    "personality_traits": ["trait1", "trait2", "trait3"]
  },
  "vocabulary": {
    "recommended": ["word1", "word2", "word3"],
    "forbidden": ["word1", "word2"]
  },
  "hashtags_base": ["hashtag1", "hashtag2", "hashtag3"],
  "visual_style": {
    "color_palette": ["color1", "color2"],
    "image_style": "description of visual style",
    "brand_elements": ["element1", "element2"]
  },
  "confidence_score": 0.0 to 1.0
}

Set confidence_score based on data availability:
- 0.3-0.5 if only basic info or brand notes
- 0.5-0.7 if some URLs are available
- 0.7-0.9 if multiple URLs with clear brand presence
- Only use 0.9+ if comprehensive data is available`;

    // Call Lovable AI (GPT-5 for analysis)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let profileData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      profileData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Build source_data object
    const sourceData = {
      website_url: urls.website || null,
      instagram_url: urls.instagram || null,
      facebook_url: urls.facebook || null,
      linkedin_url: urls.linkedin || null,
      google_business_url: urls.google_business || null,
    };

    // Upsert the content profile
    const { data: existingProfile } = await supabase
      .from("content_profiles")
      .select("id")
      .eq("contact_id", contactId)
      .maybeSingle();

    const profileRecord = {
      contact_id: contactId,
      source_data: sourceData,
      brand_summary: profileData.brand_summary || null,
      tone_guidelines: profileData.tone_guidelines || {},
      vocabulary: profileData.vocabulary || { recommended: [], forbidden: [] },
      hashtags_base: profileData.hashtags_base || [],
      visual_style: profileData.visual_style || {},
      confidence_score: profileData.confidence_score || 0.3,
      last_analyzed_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      result = await supabase
        .from("content_profiles")
        .update(profileRecord)
        .eq("id", existingProfile.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("content_profiles")
        .insert(profileRecord)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Database error:", result.error);
      throw new Error(`Database error: ${result.error.message}`);
    }

    // Log the action in content_calendar_edits for any calendars using this contact
    const { data: calendars } = await supabase
      .from("content_calendars")
      .select("id")
      .eq("calendar_contact_id", contactId);

    if (calendars && calendars.length > 0) {
      const editRecords = calendars.map((cal) => ({
        calendar_id: cal.id,
        action: "ai_profile_generated",
        details: {
          model: "openai/gpt-5",
          confidence_score: profileData.confidence_score,
          timestamp: new Date().toISOString(),
        },
      }));

      await supabase.from("content_calendar_edits").insert(editRecords);
    }

    return new Response(
      JSON.stringify({ success: true, profile: result.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-content-profile:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
