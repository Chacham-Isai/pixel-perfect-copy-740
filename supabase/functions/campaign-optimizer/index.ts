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
    const userId = claims.claims.sub as string;

    const { mode, agencyId, campaignId, platforms, campaignDetails, playbookId } = await req.json();

    if (!mode || !agencyId) {
      return new Response(JSON.stringify({ error: "mode and agencyId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch agency context
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [agencyRes, configRes, competitorsRes] = await Promise.all([
      serviceClient.from("agencies").select("*").eq("id", agencyId).single(),
      serviceClient.from("business_config").select("*").eq("agency_id", agencyId).maybeSingle(),
      serviceClient.from("competitors").select("*").eq("agency_id", agencyId),
    ]);

    const agency = agencyRes.data;
    const config = configRes.data;
    const competitors = competitorsRes.data || [];

    const competitorContext = competitors.map((c: any) => `${c.name}: $${c.pay_rate_min}-$${c.pay_rate_max}/hr, ${c.avg_rating}★`).join("; ");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (mode === "template") {
      systemPrompt = `You are a home care marketing expert. Generate platform-specific ad copy for ${agency?.name || "the agency"}. Pay rate: $21/hr. Tagline: "${config?.tagline || "We Handle All the Paperwork"}". Competitors: ${competitorContext}. Always lead with pay rate.`;
      userPrompt = `Generate ad copy for ${campaignDetails?.channel || "Indeed"} in ${campaignDetails?.state || "Oregon"}, language: ${campaignDetails?.language || "english"}.`;
      tools = [{
        type: "function",
        function: {
          name: "return_template",
          description: "Return ad copy template",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string" },
              description: { type: "string" },
              cta: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
            },
            required: ["headline", "description", "cta"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "return_template" } };
    } else if (mode === "optimization") {
      const campaignRes = await serviceClient.from("campaigns").select("*").eq("id", campaignId).single();
      const campaign = campaignRes.data;
      systemPrompt = `You are a campaign optimization expert for home care agencies. Analyze campaign metrics and provide actionable recommendations.`;
      userPrompt = `Analyze this campaign: ${JSON.stringify(campaign)}. Agency pays $21/hr. Competitors: ${competitorContext}. Provide optimization recommendations.`;
      tools = [{
        type: "function",
        function: {
          name: "return_optimizations",
          description: "Return campaign optimization recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    expected_impact: { type: "string" },
                  },
                  required: ["title", "description", "priority"],
                  additionalProperties: false,
                },
              },
              overall_assessment: { type: "string" },
            },
            required: ["recommendations", "overall_assessment"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "return_optimizations" } };
    } else if (mode === "full_package") {
      systemPrompt = `You are a multi-platform marketing strategist for home care agencies. Generate complete campaign packages for each platform. Agency: ${agency?.name}. Pay rate: $21/hr. Tagline: "${config?.tagline || "We Handle All the Paperwork"}". States: ${agency?.states?.join(", ")}. Competitors: ${competitorContext}. Always lead with pay rate. Generate compelling, platform-specific content.`;
      userPrompt = `Generate a full campaign package for these platforms: ${JSON.stringify(platforms)}. Campaign details: ${JSON.stringify(campaignDetails)}.`;
      tools = [{
        type: "function",
        function: {
          name: "return_full_package",
          description: "Return complete multi-platform campaign package",
          parameters: {
            type: "object",
            properties: {
              platforms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    headlines: { type: "array", items: { type: "string" } },
                    descriptions: { type: "array", items: { type: "string" } },
                    cta: { type: "string" },
                    utm_params: { type: "object", properties: { source: { type: "string" }, medium: { type: "string" }, campaign: { type: "string" } }, required: ["source", "medium", "campaign"], additionalProperties: false },
                    keywords: { type: "array", items: { type: "string" } },
                    creative_prompt: { type: "string" },
                    audience_targeting: { type: "string" },
                  },
                  required: ["platform", "headlines", "descriptions", "cta", "utm_params"],
                  additionalProperties: false,
                },
              },
            },
            required: ["platforms"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "return_full_package" } };
    } else if (mode === "initial_strategy") {
      const onboardingRes = await serviceClient.from("onboarding").select("*").eq("agency_id", agencyId).maybeSingle();
      const onboarding = onboardingRes.data;
      systemPrompt = `You are a home care growth strategist. Create a comprehensive marketing strategy based on agency onboarding data.`;
      userPrompt = `Create a marketing strategy for: ${JSON.stringify({ agency, config, onboarding, competitors })}`;
      tools = [{
        type: "function",
        function: {
          name: "return_strategy",
          description: "Return marketing strategy",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string" },
              channels: { type: "array", items: { type: "object", properties: { name: { type: "string" }, budget: { type: "string" }, expected_results: { type: "string" }, priority: { type: "string" } }, required: ["name", "budget", "expected_results", "priority"], additionalProperties: false } },
              first_30_days: { type: "array", items: { type: "string" } },
              key_messages: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "channels", "first_30_days", "key_messages"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "return_strategy" } };
    } else if (mode === "playbook_execution") {
      const playbookRes = await serviceClient.from("growth_playbooks").select("*").eq("id", playbookId).single();
      const playbook = playbookRes.data;
      systemPrompt = `You are executing a growth playbook for a home care agency. Create real, actionable campaign content and recommendations based on the playbook steps. Agency: ${agency?.name}, Pay: $21/hr, States: ${agency?.states?.join(", ")}.`;
      userPrompt = `Execute this playbook: ${JSON.stringify(playbook)}. Generate campaign content and recommendations.`;
      tools = [{
        type: "function",
        function: {
          name: "return_execution",
          description: "Return playbook execution results",
          parameters: {
            type: "object",
            properties: {
              campaigns_to_create: { type: "array", items: { type: "object", properties: { campaign_name: { type: "string" }, channel: { type: "string" }, campaign_type: { type: "string" }, state: { type: "string" }, content: { type: "object", properties: { headline: { type: "string" }, description: { type: "string" }, cta: { type: "string" } }, required: ["headline", "description", "cta"], additionalProperties: false } }, required: ["campaign_name", "channel", "campaign_type"], additionalProperties: false } },
              recommendations: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string" }, category: { type: "string" } }, required: ["title", "description"], additionalProperties: false } },
              execution_summary: { type: "string" },
            },
            required: ["campaigns_to_create", "recommendations", "execution_summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "return_execution" } };
    } else {
      return new Response(JSON.stringify({ error: `Unknown mode: ${mode}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: toolChoice,
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result: any = {};

    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    // For playbook_execution, create real records
    if (mode === "playbook_execution" && result.campaigns_to_create) {
      for (const camp of result.campaigns_to_create) {
        await serviceClient.from("campaigns").insert({
          agency_id: agencyId,
          campaign_name: camp.campaign_name,
          channel: camp.channel,
          campaign_type: camp.campaign_type || "recruitment",
          state: camp.state || agency?.primary_state,
          status: "draft",
          user_id: userId,
        });
      }
      for (const rec of result.recommendations || []) {
        await serviceClient.from("halevai_recommendations").insert({
          agency_id: agencyId,
          title: rec.title,
          description: rec.description,
          priority: rec.priority || "medium",
          category: rec.category || "marketing",
          status: "pending",
          user_id: userId,
        });
      }
    }

    return new Response(JSON.stringify({ mode, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("campaign-optimizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
