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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) {
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

    // Generate ad copy based on the prompt
    const copyBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `You are an ad copywriter for ${config?.business_name || "a home care agency"}. Create compelling ad copy for the generated creative image. Pay rate: $21/hr.` },
        { role: "user", content: `Write ad copy for this creative concept: "${prompt}". Platform: ${platform || "Facebook"}. Return a headline and body copy.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_copy",
          description: "Return ad copy for the creative",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string" },
              body_copy: { type: "string" },
            },
            required: ["headline", "body_copy"],
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
    const copy = copyTool?.function?.arguments ? JSON.parse(copyTool.function.arguments) : { headline: "", body_copy: "" };

    // Note: Image generation via gemini-2.5-flash-image would require a separate image generation call.
    // For now, we return the creative prompt and copy — image generation can be added when storage bucket is configured.

    return new Response(JSON.stringify({
      headline: copy.headline,
      body_copy: copy.body_copy,
      prompt,
      platform: platform || "Facebook",
      image_url: null, // Will be populated when image generation + storage is configured
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
