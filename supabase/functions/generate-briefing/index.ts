import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { agencyId, userId } = await req.json();
    if (!agencyId) throw new Error("agencyId required");

    // If "all", process every agency
    let agencyIds: string[] = [];
    if (agencyId === "all") {
      const { data: agencies } = await sb.from("agencies").select("id");
      agencyIds = (agencies || []).map((a: any) => a.id);
    } else {
      agencyIds = [agencyId];
    }

    const results: any[] = [];
    for (const aid of agencyIds) {
    const today = new Date().toISOString().slice(0, 10);

    // Check if briefing already exists for today
    const { data: existing } = await sb.from("daily_briefings")
      .select("id").eq("agency_id", aid).eq("date", today).maybeSingle();
    if (existing) {
      results.push({ agency: aid, message: "already exists", id: existing.id });
      continue;
    }

    // Gather data
    const [cgRes, campRes, revRes, srcRes] = await Promise.all([
      sb.from("caregivers").select("*").eq("agency_id", aid),
      sb.from("campaigns").select("*").eq("agency_id", aid).eq("status", "active"),
      sb.from("reviews").select("*").eq("agency_id", aid),
      sb.from("sourced_candidates").select("*").eq("agency_id", aid),
    ]);

    const caregivers = cgRes.data || [];
    const campaigns = campRes.data || [];
    const reviews = revRes.data || [];
    const sourced = srcRes.data || [];

    const oneDayAgo = Date.now() - 86400000;
    const newToday = caregivers.filter((c: any) => new Date(c.created_at).getTime() > oneDayAgo);
    const hotLeads = newToday.filter((c: any) => c.lead_tier === "HOT");
    const totalConversions = campaigns.reduce((s: number, c: any) => s + (c.conversions || 0), 0);
    const totalSpend = campaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0);
    const avgCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "0";
    const staleEnrollments = caregivers.filter((c: any) => {
      if (!["intake_started", "enrollment_pending"].includes(c.status)) return false;
      const ref = c.enrollment_started_at || c.created_at;
      return ref && (Date.now() - new Date(ref).getTime()) > 14 * 86400000;
    });
    const negReviews = reviews.filter((r: any) => !r.responded && (r.rating || 5) <= 3);
    const activeCount = caregivers.filter((c: any) => c.status === "active").length;

    const content = {
      date: today,
      summary: `${newToday.length} new caregivers entered the pipeline, ${hotLeads.length} scored HOT. Campaigns converting at $${avgCPA} CPA. ${staleEnrollments.length} stale enrollments. ${negReviews.length} unresponded negative reviews.`,
      pipeline: {
        new_today: newToday.length,
        hot_leads: hotLeads.length,
        active_caregivers: activeCount,
        total_pipeline: caregivers.length,
      },
      campaigns: {
        active_count: campaigns.length,
        total_conversions: totalConversions,
        avg_cpa: avgCPA,
        sourced_candidates: sourced.length,
      },
      action_items: {
        stale_enrollments: staleEnrollments.length,
        negative_reviews_unresponded: negReviews.length,
        stale_names: staleEnrollments.slice(0, 5).map((c: any) => c.full_name),
      },
      wins: {
        hot_lead_names: hotLeads.slice(0, 3).map((c: any) => c.full_name),
        under_cpa_target: Number(avgCPA) > 0 && Number(avgCPA) < 25,
        active_generating_revenue: activeCount,
      },
    };

    const { data: briefing, error } = await sb.from("daily_briefings").insert({
      agency_id: aid,
      user_id: userId || null,
      date: today,
      content,
    }).select("id").single();

    if (error) { results.push({ agency: aid, error: error.message }); continue; }
    results.push({ agency: aid, id: briefing.id });
    } // end agency loop

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
