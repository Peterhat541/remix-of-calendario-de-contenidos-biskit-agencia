import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function dataUrlToUint8Array(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, mime };
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] || "png";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all posts with base64 images, process in batches
    const { data: posts, error: fetchError } = await supabase
      .from("calendar_posts")
      .select("id, calendar_id, image_url, image_source")
      .like("image_url", "data:image/%")
      .limit(50); // Process 50 at a time

    if (fetchError) throw fetchError;

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ migrated: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let migrated = 0;
    const errors: string[] = [];

    for (const post of posts) {
      try {
        const { bytes, mime } = dataUrlToUint8Array(post.image_url);
        const ext = extFromMime(mime);
        const folder = post.calendar_id || "general";
        const fileName = `${folder}/${post.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("content-calendars")
          .upload(fileName, bytes, {
            contentType: mime,
            upsert: true,
          });

        if (uploadError) {
          errors.push(`Upload ${post.id}: ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("content-calendars")
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from("calendar_posts")
          .update({ image_url: urlData.publicUrl })
          .eq("id", post.id);

        if (updateError) {
          errors.push(`Update ${post.id}: ${updateError.message}`);
          continue;
        }

        migrated++;
      } catch (err) {
        errors.push(`Post ${post.id}: ${err.message}`);
      }
    }

    // Check remaining
    const { count } = await supabase
      .from("calendar_posts")
      .select("id", { count: "exact", head: true })
      .like("image_url", "data:image/%");

    return new Response(
      JSON.stringify({ migrated, remaining: count || 0, errors: errors.slice(0, 10) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
