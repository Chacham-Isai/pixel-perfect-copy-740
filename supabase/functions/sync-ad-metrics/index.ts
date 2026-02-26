import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { agencyId, campaignId } = await req.json();
    if (!agencyId) throw new Error("agencyId required");

    // Get API keys
    const getKey = async (name: string) => {
      const { data } = await sb.from("api_keys").select("key_value").eq("agency_id", agencyId).eq("key_name", name).eq("connected", true).maybeSingle();
      return data?.key_value || null;
    };

    // Get campaigns with external_id
    let query = sb.from("campaigns").select("*").eq("agency_id", agencyId).not("external_id", "is", null);
    if (campaignId) query = query.eq("id", campaignId);
    const { data: campaigns } = await query;

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ synced: 0, message: "No campaigns with external IDs to sync" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fbToken = await getKey("facebook_access_token");
    const googleKey = await getKey("google_ads_api_key");
    const results: any[] = [];

    for (const campaign of campaigns) {
      try {
        let metrics: any = null;

        if (campaign.channel === "facebook" && fbToken && campaign.external_id) {
          // Facebook Marketing API
          const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${campaign.external_id}/insights?fields=spend,impressions,clicks,actions&access_token=${fbToken}`
          );
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const insight = fbData.data?.[0];
            if (insight) {
              const conversions = (insight.actions || []).find((a: any) => a.action_type === "lead")?.value || 0;
              metrics = {
                spend: parseFloat(insight.spend || "0"),
                impressions: parseInt(insight.impressions || "0"),
                clicks: parseInt(insight.clicks || "0"),
                conversions: parseInt(conversions),
              };
            }
          }
        } else if (campaign.channel === "google_ads" && googleKey && campaign.external_id) {
          // Google Ads API - placeholder for actual implementation
          // Real implementation requires OAuth2 and Google Ads API client
          metrics = null; // Skip - requires full OAuth setup
        }

        if (metrics) {
          const cpc = metrics.conversions > 0 ? metrics.spend / metrics.conversions : null;
          await sb.from("campaigns").update({
            spend: metrics.spend,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            conversions: metrics.conversions,
            cost_per_conversion: cpc,
            last_synced_at: new Date().toISOString(),
          }).eq("id", campaign.id);

          results.push({ campaign_id: campaign.id, name: campaign.campaign_name, synced: true, metrics });
        } else {
          results.push({ campaign_id: campaign.id, name: campaign.campaign_name, synced: false, reason: "No API key or unsupported channel" });
        }
      } catch (e) {
        results.push({ campaign_id: campaign.id, name: campaign.campaign_name, synced: false, error: e.message });
      }
    }

    // Log activity
    await sb.from("agent_activity_log").insert({
      agency_id: agencyId,
      agent_type: "sync",
      action: "sync_ad_metrics",
      details: `Synced ${results.filter(r => r.synced).length}/${results.length} campaigns`,
      success: true,
    });

    return new Response(JSON.stringify({ synced: results.filter(r => r.synced).length, total: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
