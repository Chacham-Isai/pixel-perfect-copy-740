import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { agencyId, prompt, platform, campaignId } = await req.json();
    if (!agencyId || !prompt) {
      return new Response(JSON.stringify({ error: "agencyId and prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const configRes = await serviceClient.from("business_config").select("*").eq("agency_id", agencyId).maybeSingle();
    const config = configRes.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Generate ad copy
    const copyBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `You are an ad copywriter for ${config?.business_name || "a home care agency"}. Create compelling ad copy. Pay rate: $21/hr.` },
        { role: "user", content: `Write ad copy for: "${prompt}". Platform: ${platform || "Facebook"}. Return headline and body copy.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_copy",
          description: "Return ad copy",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string" },
              body_copy: { type: "string" },
              image_prompt: { type: "string", description: "A detailed prompt to generate an ad image" },
            },
            required: ["headline", "body_copy", "image_prompt"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_copy" } },
    };

    const copyResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(copyBody),
    });

    if (!copyResp.ok) {
      if (copyResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (copyResp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI copy generation failed");
    }

    const copyData = await copyResp.json();
    const copyTool = copyData.choices?.[0]?.message?.tool_calls?.[0];
    const copy = copyTool?.function?.arguments ? JSON.parse(copyTool.function.arguments) : { headline: "", body_copy: "", image_prompt: prompt };

    // Step 2: Generate image using gemini-2.5-flash-image
    let image_url: string | null = null;
    try {
      const imageResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: `Generate a professional ad image for a home care agency recruitment ad. ${copy.image_prompt || prompt}. Clean, professional, warm colors. Do NOT include any text in the image.` },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResp.ok) {
        const imageData = await imageResp.json();
        const base64Url = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (base64Url) {
          // Extract base64 data and upload to storage
          const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const fileName = `${agencyId}/${crypto.randomUUID()}.png`;

          const { error: uploadErr } = await serviceClient.storage
            .from("ad-creatives")
            .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

          if (!uploadErr) {
            const { data: urlData } = serviceClient.storage.from("ad-creatives").getPublicUrl(fileName);
            image_url = urlData.publicUrl;
          } else {
            console.error("Upload error:", uploadErr);
          }
        }
      }
    } catch (imgErr) {
      console.error("Image generation error:", imgErr);
      // Continue without image - copy is still valuable
    }

    return new Response(JSON.stringify({
      headline: copy.headline,
      body_copy: copy.body_copy,
      prompt,
      platform: platform || "Facebook",
      image_url,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-creative error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
