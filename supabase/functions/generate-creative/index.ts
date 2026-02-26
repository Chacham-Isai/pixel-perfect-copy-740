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

    // Fetch real agency data for context
    const [configRes, agencyRes, rateRes, topCampaignsRes, topCreativesRes] = await Promise.all([
      serviceClient.from("business_config").select("*").eq("agency_id", agencyId).maybeSingle(),
      serviceClient.from("agencies").select("name, primary_state, states").eq("id", agencyId).maybeSingle(),
      serviceClient.from("pay_rate_intel").select("recommended_rate, state, county, market_avg_rate").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      serviceClient.from("campaigns").select("campaign_name, channel, conversions, clicks, spend, campaign_type").eq("agency_id", agencyId).not("conversions", "is", null).order("conversions", { ascending: false }).limit(5),
      serviceClient.from("ad_creatives").select("headline, body_copy").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(5),
    ]);

    const config = configRes.data;
    const agency = agencyRes.data;
    const rate = rateRes.data;
    const topCampaigns = topCampaignsRes.data || [];
    const recentCreatives = topCreativesRes.data || [];

    // Build dynamic context
    const agencyName = config?.business_name || agency?.name || "Home Care Agency";
    const tagline = config?.tagline || "";
    const payRate = rate?.recommended_rate ? `$${rate.recommended_rate}/hr` : "$21/hr";
    const marketAvg = rate?.market_avg_rate ? `$${rate.market_avg_rate}/hr` : null;
    const location = [rate?.county, rate?.state || agency?.primary_state].filter(Boolean).join(", ");
    const brandColors = [config?.primary_color, config?.secondary_color, config?.accent_color].filter(Boolean).join(", ") || "navy blue and sky blue";

    const topPerformingThemes = topCampaigns.length > 0
      ? `Top-performing campaigns: ${topCampaigns.map(c => `"${c.campaign_name}" (${c.conversions} conversions via ${c.channel})`).join("; ")}.`
      : "";

    const avoidRepetition = recentCreatives.length > 0
      ? `Recent headlines used (avoid repeating): ${recentCreatives.map(c => `"${c.headline}"`).join(", ")}.`
      : "";

    const competitiveAngle = marketAvg
      ? `The market average pay is ${marketAvg}, so highlight ${payRate} as above-market.`
      : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Generate ad copy with real context
    const systemPrompt = [
      `You are an expert ad copywriter for "${agencyName}"${tagline ? ` — "${tagline}"` : ""}.`,
      `Industry: home care / caregiver recruitment.`,
      `Pay rate to highlight: ${payRate}.`,
      location && `Primary market: ${location}.`,
      `Brand colors: ${brandColors}.`,
      topPerformingThemes,
      avoidRepetition,
      competitiveAngle,
      `Create compelling, warm, trust-building ad copy. Use the agency name "${agencyName}" prominently.`,
      `Tailor language and messaging to what has historically performed best for this agency.`,
    ].filter(Boolean).join(" ");

    const copyBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
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
            { role: "user", content: `Generate a professional ad image for ${agencyName}, a home care agency. ${copy.image_prompt || prompt}. Use ${brandColors} color palette. Clean, professional, warm. Do NOT include any text or logos in the image.` },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResp.ok) {
        const imageData = await imageResp.json();
        const base64Url = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (base64Url) {
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