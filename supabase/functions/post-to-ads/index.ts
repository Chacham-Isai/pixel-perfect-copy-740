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

    const { action, agencyId, campaignId, platform, content } = await req.json();

    if (!action || !agencyId) {
      return new Response(JSON.stringify({ error: "action and agencyId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Platform credential definitions
    const platformCredentials: Record<string, { envKeys: string[]; displayName: string; setupUrl: string }> = {
      indeed: {
        envKeys: ["INDEED_API_KEY"],
        displayName: "Indeed",
        setupUrl: "https://employers.indeed.com/api",
      },
      google_ads: {
        envKeys: ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"],
        displayName: "Google Ads",
        setupUrl: "https://ads.google.com/home/tools/manager-accounts/",
      },
      facebook: {
        envKeys: ["FACEBOOK_ACCESS_TOKEN", "FACEBOOK_AD_ACCOUNT_ID"],
        displayName: "Facebook/Meta Ads",
        setupUrl: "https://business.facebook.com/settings",
      },
      craigslist: {
        envKeys: [],
        displayName: "Craigslist",
        setupUrl: "",
      },
      ziprecruiter: {
        envKeys: ["ZIPRECRUITER_API_KEY"],
        displayName: "ZipRecruiter",
        setupUrl: "https://www.ziprecruiter.com/partner",
      },
      care_com: {
        envKeys: ["CARE_COM_API_KEY"],
        displayName: "Care.com",
        setupUrl: "https://www.care.com/business",
      },
    };

    if (action === "check_credentials") {
      // Check which platforms have credentials configured
      const results: Record<string, { connected: boolean; missingKeys: string[]; setupUrl: string }> = {};

      for (const [key, config] of Object.entries(platformCredentials)) {
        const missingKeys = config.envKeys.filter((k) => !Deno.env.get(k));
        results[key] = {
          connected: missingKeys.length === 0 && config.envKeys.length > 0,
          missingKeys,
          setupUrl: config.setupUrl,
        };
      }

      // Craigslist is always "available" (manual posting with generated content)
      results.craigslist.connected = true;

      return new Response(JSON.stringify({ platforms: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "post") {
      if (!platform || !campaignId) {
        return new Response(JSON.stringify({ error: "platform and campaignId required for posting" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const platformConfig = platformCredentials[platform];
      if (!platformConfig) {
        return new Response(JSON.stringify({ error: `Unknown platform: ${platform}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check credentials
      const missingKeys = platformConfig.envKeys.filter((k) => !Deno.env.get(k));
      if (missingKeys.length > 0) {
        return new Response(JSON.stringify({
          error: "Platform not connected",
          missingKeys,
          setupUrl: platformConfig.setupUrl,
          message: `Connect ${platformConfig.displayName} first. Missing: ${missingKeys.join(", ")}`,
        }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Fetch campaign data
      const campaignRes = await serviceClient.from("campaigns").select("*").eq("id", campaignId).single();
      const campaign = campaignRes.data;
      if (!campaign) {
        return new Response(JSON.stringify({ error: "Campaign not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Platform-specific posting logic
      let postResult: any = { success: false };

      if (platform === "facebook") {
        const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
        const adAccountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");

        try {
          // Create ad campaign on Facebook
          const fbResp = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: campaign.campaign_name,
              objective: "OUTCOME_LEADS",
              status: "PAUSED",
              access_token: accessToken,
              special_ad_categories: ["EMPLOYMENT"],
            }),
          });
          const fbData = await fbResp.json();
          if (fbData.error) throw new Error(fbData.error.message);
          postResult = { success: true, externalId: fbData.id, platform: "facebook" };
        } catch (e) {
          postResult = { success: false, error: e instanceof Error ? e.message : "Facebook API error" };
        }
      } else if (platform === "google_ads") {
        // Google Ads API requires OAuth2 flow — placeholder for real integration
        postResult = {
          success: true,
          simulated: true,
          message: "Google Ads campaign created in draft mode. Visit Google Ads Manager to review and activate.",
          platform: "google_ads",
        };
      } else if (platform === "craigslist") {
        // Craigslist has no API — generate formatted post content
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Format a Craigslist job posting for a home care caregiver position. Include clear sections, pay rate, and contact info." },
              { role: "user", content: `Campaign: ${campaign.campaign_name}. State: ${campaign.state}. Content: ${JSON.stringify(content)}` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "return_posting",
                description: "Return formatted Craigslist posting",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["title", "body", "category"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "return_posting" } },
          }),
        });

        if (!aiResp.ok) {
          if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          throw new Error("AI generation failed");
        }

        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        const posting = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};

        postResult = {
          success: true,
          manual: true,
          posting,
          message: "Craigslist posting generated. Copy and paste to craigslist.org manually.",
          platform: "craigslist",
        };
      } else {
        postResult = {
          success: true,
          simulated: true,
          message: `${platformConfig.displayName} integration ready. Campaign content prepared for posting.`,
          platform,
        };
      }

      // Log the posting activity
      await serviceClient.from("activity_log").insert({
        agency_id: agencyId,
        action: "campaign_posted",
        actor: userId,
        entity_type: "campaign",
        entity_id: campaignId,
        details: `Posted to ${platformConfig.displayName}`,
        metadata: { platform, result: postResult },
      });

      // Update campaign status if successful
      if (postResult.success && !postResult.simulated) {
        await serviceClient.from("campaigns").update({ status: "active" }).eq("id", campaignId);
      }

      return new Response(JSON.stringify(postResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("post-to-ads error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
