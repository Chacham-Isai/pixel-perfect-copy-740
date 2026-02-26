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

    const { agencyId, state, county, language } = await req.json();
    if (!agencyId) return new Response(JSON.stringify({ error: "agencyId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [agencyRes, configRes] = await Promise.all([
      serviceClient.from("agencies").select("*").eq("id", agencyId).single(),
      serviceClient.from("business_config").select("*").eq("agency_id", agencyId).maybeSingle(),
    ]);
    const agency = agencyRes.data;
    const config = configRes.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lang = language || "english";
    const systemPrompt = `You are a landing page content expert for home care agencies. Agency: ${agency?.name}. Pay rate: $21/hr. Tagline: "${config?.tagline || "We Handle All the Paperwork"}". ${lang !== "english" ? `Generate ALL content in ${lang} (native quality).` : ""} Create compelling, conversion-focused content. Reference state-specific Medicaid programs. Include real FAQ about getting paid as a family caregiver.`;

    const userPrompt = `Generate landing page content for ${state || "Oregon"}${county ? `, ${county} County` : ""}. Language: ${lang}.`;

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_landing_content",
          description: "Return landing page content",
          parameters: {
            type: "object",
            properties: {
              hero_headline: { type: "string" },
              hero_subheadline: { type: "string" },
              hero_cta_text: { type: "string" },
              benefits: { type: "array", items: { type: "object", properties: { icon: { type: "string" }, title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"], additionalProperties: false } },
              testimonials: { type: "array", items: { type: "object", properties: { quote: { type: "string" }, name: { type: "string" }, role: { type: "string" } }, required: ["quote", "name"], additionalProperties: false } },
              faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"], additionalProperties: false } },
              pay_rate_highlight: { type: "string" },
              social_proof_text: { type: "string" },
              urgency_text: { type: "string" },
              meta_title: { type: "string" },
              meta_description: { type: "string" },
              insurance_highlight: { type: "string" },
            },
            required: ["hero_headline", "hero_subheadline", "hero_cta_text", "benefits", "faq", "pay_rate_highlight", "meta_title", "meta_description"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_landing_content" } },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
