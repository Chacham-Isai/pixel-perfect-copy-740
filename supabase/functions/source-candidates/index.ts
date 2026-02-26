import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateMockCandidates(campaign: any, agencyId: string) {
  const names = ["Maria Garcia", "Thanh Nguyen", "Lisa Chen", "Sarah Johnson", "Ana Rodriguez"];
  const cities = ["Portland", "Salem", "Eugene", "Beaverton", "Gresham"];
  return names.map((name, i) => ({
    agency_id: agencyId,
    sourcing_campaign_id: campaign.id,
    full_name: name,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    phone: `+1503555${String(1000 + i)}`,
    source_platform: "clay_mock",
    state: campaign.state || "OR",
    city: cities[i],
    county: campaign.county || null,
    current_employer: i % 2 === 0 ? "Addus HomeCare" : null,
    current_pay_rate: 12 + i,
    years_experience: 1 + i,
    languages_spoken: campaign.target_language === "english" ? ["english"] : [campaign.target_language, "english"],
    currently_caregiving: i < 3,
    match_score: 60 + i * 8,
    enrichment_status: "enriched",
    outreach_status: "not_started",
    phone_screen_status: "not_started",
  }));
}

function scoreCandidate(candidate: any, campaign: any): number {
  let score = 50;
  if (candidate.state?.toLowerCase() === campaign.state?.toLowerCase()) score += 15;
  if (candidate.county?.toLowerCase() === campaign.county?.toLowerCase()) score += 10;
  if (candidate.currently_caregiving) score += 10;
  if (candidate.years_experience >= 2) score += 5;
  if (candidate.years_experience >= 5) score += 5;
  if (candidate.phone) score += 5;
  if (candidate.email) score += 5;
  const targetLang = campaign.target_language || "english";
  if (candidate.languages_spoken?.includes(targetLang)) score += 5;
  return Math.min(score, 100);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { agency_id, campaign_id, mode } = await req.json();
    if (!agency_id || !campaign_id) throw new Error("agency_id and campaign_id required");

    const { data: campaign, error: campErr } = await sb
      .from("sourcing_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("agency_id", agency_id)
      .single();
    if (campErr || !campaign) throw new Error("Campaign not found");

    // Check for Clay API key
    const { data: clayKey } = await sb
      .from("api_keys")
      .select("key_value")
      .eq("agency_id", agency_id)
      .eq("key_name", "clay_api_key")
      .eq("connected", true)
      .maybeSingle();

    let mock = !clayKey?.key_value;
    let candidatesCreated = 0;
    let candidatesEnriched = 0;

    if (mode === "search") {
      let newCandidates: any[];

      if (mock) {
        newCandidates = generateMockCandidates(campaign, agency_id);
      } else {
        // Real Clay API call
        try {
          const res = await fetch("https://api.clay.com/v3/sources/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clayKey!.key_value}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `caregiver OR "home care aide" OR CNA OR HHA`,
              filters: {
                location: { state: campaign.state, county: campaign.county },
              },
              limit: campaign.max_candidates || 50,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            mock = true;
            newCandidates = generateMockCandidates(campaign, agency_id);
          } else {
            newCandidates = (data.results || []).map((r: any) => ({
              agency_id,
              sourcing_campaign_id: campaign.id,
              full_name: r.name || r.full_name || "Unknown",
              email: r.email || null,
              phone: r.phone || null,
              source_platform: "clay",
              state: r.state || campaign.state,
              city: r.city || null,
              county: r.county || campaign.county,
              current_employer: r.company || r.current_employer || null,
              current_pay_rate: r.salary ? Math.round(r.salary / 2080) : null,
              years_experience: r.experience_years || null,
              languages_spoken: r.languages || ["english"],
              currently_caregiving: r.is_caregiving || null,
              enrichment_status: "enriched",
              outreach_status: "not_started",
              phone_screen_status: "not_started",
            }));
          }
        } catch {
          mock = true;
          newCandidates = generateMockCandidates(campaign, agency_id);
        }
      }

      // Score candidates
      newCandidates = newCandidates.map(c => ({
        ...c,
        match_score: scoreCandidate(c, campaign),
      }));

      // Insert candidates
      if (newCandidates.length > 0) {
        const { error: insErr } = await sb.from("sourced_candidates").insert(newCandidates);
        if (insErr) throw insErr;
        candidatesCreated = newCandidates.length;
      }

      // Update campaign stats
      await sb.from("sourcing_campaigns").update({
        candidates_found: (campaign.candidates_found || 0) + candidatesCreated,
        last_run_at: new Date().toISOString(),
      }).eq("id", campaign.id);

    } else if (mode === "enrich") {
      const { data: pending } = await sb
        .from("sourced_candidates")
        .select("*")
        .eq("agency_id", agency_id)
        .eq("sourcing_campaign_id", campaign_id)
        .eq("enrichment_status", "pending");

      if (mock) {
        // Mock enrichment
        for (const c of pending || []) {
          await sb.from("sourced_candidates").update({
            enrichment_status: "enriched",
            phone: c.phone || `+1503555${Math.floor(Math.random() * 9000) + 1000}`,
            email: c.email || `${c.full_name.toLowerCase().replace(" ", ".")}@example.com`,
          }).eq("id", c.id);
          candidatesEnriched++;
        }
      } else {
        // Real Clay enrichment
        for (const c of pending || []) {
          try {
            const res = await fetch("https://api.clay.com/v3/people/enrich", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${clayKey!.key_value}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name: c.full_name, email: c.email, phone: c.phone }),
            });
            const data = await res.json();
            if (res.ok) {
              await sb.from("sourced_candidates").update({
                enrichment_status: "enriched",
                phone: data.phone || c.phone,
                email: data.email || c.email,
                enrichment_data: data,
              }).eq("id", c.id);
              candidatesEnriched++;
            } else {
              await sb.from("sourced_candidates").update({ enrichment_status: "failed" }).eq("id", c.id);
            }
          } catch {
            await sb.from("sourced_candidates").update({ enrichment_status: "failed" }).eq("id", c.id);
          }
        }
      }

      await sb.from("sourcing_campaigns").update({
        candidates_enriched: (campaign.candidates_enriched || 0) + candidatesEnriched,
      }).eq("id", campaign.id);
    }

    // Log to agent_activity_log
    await sb.from("agent_activity_log").insert({
      agency_id,
      agent_type: "sourcing",
      action: mode === "search" ? "candidates_sourced" : "candidates_enriched",
      entity_type: "sourcing_campaign",
      entity_id: campaign_id,
      details: mode === "search"
        ? `Sourced ${candidatesCreated} candidates${mock ? " (mock)" : ""}`
        : `Enriched ${candidatesEnriched} candidates${mock ? " (mock)" : ""}`,
      metadata: { mock, mode, count: mode === "search" ? candidatesCreated : candidatesEnriched },
      success: true,
    });

    return new Response(JSON.stringify({
      success: true,
      mock,
      candidates_created: candidatesCreated,
      candidates_enriched: candidatesEnriched,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
