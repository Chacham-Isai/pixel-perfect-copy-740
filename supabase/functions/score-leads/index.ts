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

    const { agencyId } = await req.json();
    if (!agencyId) throw new Error("agencyId required");

    // Fetch caregivers without a score or needing re-score
    const { data: caregivers, error } = await sb
      .from("caregivers")
      .select("*")
      .eq("agency_id", agencyId)
      .is("lead_score", null);
    if (error) throw error;

    const scored: { id: string; score: number; tier: string; reasoning: string }[] = [];

    for (const c of caregivers || []) {
      let score = 0;
      const reasons: string[] = [];

      // Contact info completeness (0-15)
      if (c.phone) { score += 8; reasons.push("+8 phone provided"); }
      if (c.email) { score += 7; reasons.push("+7 email provided"); }

      // Location match (0-10)
      if (c.state) { score += 5; reasons.push("+5 state known"); }
      if (c.county) { score += 5; reasons.push("+5 county known"); }

      // Experience (0-15)
      if (c.currently_caregiving) { score += 10; reasons.push("+10 currently caregiving"); }
      if (c.years_caregiving_experience && c.years_caregiving_experience > 0) {
        const exp = Math.min(c.years_caregiving_experience, 5);
        score += exp; reasons.push(`+${exp} years experience`);
      }

      // Patient info (0-20)
      if (c.patient_name) { score += 8; reasons.push("+8 patient identified"); }
      if (c.patient_medicaid_id) { score += 7; reasons.push("+7 Medicaid ID provided"); }
      if (c.patient_medicaid_status === "active") { score += 5; reasons.push("+5 active Medicaid"); }

      // Transportation (0-5)
      if (c.has_transportation) { score += 5; reasons.push("+5 has transportation"); }

      // Availability (0-5)
      if (c.availability) { score += 5; reasons.push("+5 availability specified"); }

      // Recency bonus (0-10)
      if (c.created_at) {
        const daysOld = (Date.now() - new Date(c.created_at).getTime()) / 86400000;
        if (daysOld <= 1) { score += 10; reasons.push("+10 submitted today"); }
        else if (daysOld <= 3) { score += 7; reasons.push("+7 submitted within 3 days"); }
        else if (daysOld <= 7) { score += 4; reasons.push("+4 submitted within a week"); }
      }

      // Background check (0-5)
      if (c.background_check_status === "passed") { score += 5; reasons.push("+5 background check passed"); }

      // Engagement (0-10)
      if (c.last_contacted_at) {
        const daysSinceContact = (Date.now() - new Date(c.last_contacted_at).getTime()) / 86400000;
        if (daysSinceContact <= 2) { score += 10; reasons.push("+10 recently contacted"); }
        else if (daysSinceContact <= 7) { score += 5; reasons.push("+5 contacted this week"); }
      }

      score = Math.min(score, 100);
      const tier = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";
      scored.push({ id: c.id, score, tier, reasoning: reasons.join("; ") });
    }

    // Batch update
    for (const s of scored) {
      await sb.from("caregivers").update({
        lead_score: s.score,
        lead_tier: s.tier,
        score_reasoning: s.reasoning,
      }).eq("id", s.id);
    }

    return new Response(JSON.stringify({ scored: scored.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
