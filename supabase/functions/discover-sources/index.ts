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

    const { agencyId, state, county, language, sourceTypes } = await req.json();

    if (!agencyId) {
      return new Response(JSON.stringify({ error: "agencyId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch agency context
    const [agencyRes, existingSourcesRes] = await Promise.all([
      serviceClient.from("agencies").select("*").eq("id", agencyId).single(),
      serviceClient.from("referral_sources").select("name, source_type, state, county").eq("agency_id", agencyId),
    ]);

    const agency = agencyRes.data;
    const existingSources = existingSourcesRes.data || [];
    const existingNames = existingSources.map((s: any) => s.name);

    const targetState = state || agency?.primary_state || "Oregon";
    const targetCounty = county || "";
    const targetLanguage = language || "english";
    const targetTypes = sourceTypes || ["church", "community_center", "cultural_org", "social_service", "medical", "government", "education", "online_forum"];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a home care agency growth strategist specializing in community-based caregiver recruitment. Your job is to discover referral sources — real organizations, groups, and community hubs where potential caregivers can be found.

Focus on sources relevant to: ${targetLanguage !== "english" ? `${targetLanguage}-speaking communities` : "general population"} in ${targetState}${targetCounty ? `, ${targetCounty} county` : ""}.

Source types to discover: ${targetTypes.join(", ")}.

Already known sources (DO NOT duplicate): ${existingNames.join(", ") || "none yet"}.

Return realistic, actionable sources with real-sounding names appropriate for the region. Include a mix of:
- Churches and religious organizations (especially those serving immigrant communities)
- Community centers and cultural organizations
- Social service agencies and nonprofits
- Medical facilities and clinics
- Government offices (DHS, aging services)
- Educational institutions with CNA/caregiver programs
- Online forums and social media groups`;

    const userPrompt = `Discover 8-12 new referral sources for caregiver recruitment in ${targetState}${targetCounty ? `, ${targetCounty} county` : ""}. Language community focus: ${targetLanguage}. Agency: ${agency?.name}.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_sources",
            description: "Return discovered referral sources",
            parameters: {
              type: "object",
              properties: {
                sources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      source_type: { type: "string", enum: ["church", "community_center", "cultural_org", "social_service", "medical", "government", "education", "online_forum", "other"] },
                      state: { type: "string" },
                      county: { type: "string" },
                      language_community: { type: "string" },
                      url: { type: "string" },
                      notes: { type: "string" },
                    },
                    required: ["name", "source_type", "notes"],
                    additionalProperties: false,
                  },
                },
                discovery_summary: { type: "string" },
              },
              required: ["sources", "discovery_summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_sources" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { sources: [], discovery_summary: "" };

    // Filter out any duplicates
    const newSources = (result.sources || []).filter((s: any) => !existingNames.includes(s.name));

    // Insert discovered sources into the database
    const inserted = [];
    for (const source of newSources) {
      const { error } = await serviceClient.from("referral_sources").insert({
        agency_id: agencyId,
        name: source.name,
        source_type: source.source_type || "other",
        state: source.state || targetState,
        county: source.county || targetCounty || null,
        language_community: source.language_community || targetLanguage,
        url: source.url || null,
        notes: source.notes || null,
        discovered_by: "ai",
      });
      if (!error) inserted.push(source);
    }

    // Log activity
    await serviceClient.from("activity_log").insert({
      agency_id: agencyId,
      action: "sources_discovered",
      actor: userId,
      details: `AI discovered ${inserted.length} new referral sources in ${targetState}`,
      metadata: { state: targetState, county: targetCounty, language: targetLanguage, count: inserted.length },
    });

    return new Response(JSON.stringify({
      sources: inserted,
      discovery_summary: result.discovery_summary,
      total_discovered: newSources.length,
      total_saved: inserted.length,
      duplicates_skipped: (result.sources || []).length - newSources.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discover-sources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
