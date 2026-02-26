import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agency_id, state, county } = await req.json();
    if (!agency_id) throw new Error("agency_id required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // 1. Gather competitor data from DB
    const { data: competitors } = await supabase
      .from("competitors")
      .select("name, pay_rate_min, pay_rate_max, state, markets")
      .eq("agency_id", agency_id);

    // 2. Get agency info
    const { data: agency } = await supabase
      .from("agencies")
      .select("name, primary_state, states")
      .eq("id", agency_id)
      .single();

    const targetState = state || agency?.primary_state || "New York";
    const targetCounty = county || "";

    // 3. Try Firecrawl to scrape pay rate data
    let scrapedData = "";
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (FIRECRAWL_API_KEY) {
      try {
        const searchQuery = `home care caregiver pay rate ${targetState} ${targetCounty} 2025 2026 CDPAP PCA hourly wage`;
        console.log("Searching with Firecrawl:", searchQuery);
        const fcResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });
        const fcData = await fcResp.json();
        if (fcData.success && fcData.data) {
          scrapedData = fcData.data
            .map((r: any) => `Source: ${r.url}\nTitle: ${r.title}\n${(r.markdown || r.description || "").slice(0, 1500)}`)
            .join("\n\n---\n\n");
          console.log(`Scraped ${fcData.data.length} sources`);
        }
      } catch (e) {
        console.warn("Firecrawl search failed, proceeding with AI analysis only:", e);
      }
    } else {
      console.log("No FIRECRAWL_API_KEY, using AI analysis only");
    }

    // 4. Build prompt for AI analysis
    const competitorSummary = (competitors || [])
      .map((c) => `${c.name}: $${c.pay_rate_min}-$${c.pay_rate_max}/hr (${c.state})`)
      .join("\n");

    const prompt = `You are a home care agency pay rate strategist. Analyze competitive pay rates for caregivers in ${targetState}${targetCounty ? `, ${targetCounty} county` : ""}.

COMPETITOR DATA FROM DATABASE:
${competitorSummary || "No competitor data available yet."}

${scrapedData ? `SCRAPED WEB DATA ON CAREGIVER PAY RATES:\n${scrapedData}` : "No web data available."}

IMPORTANT CONTEXT:
- Medicaid CDPAP/PCA reimbursement rates vary by state and county
- The agency needs to pay MORE than competitors to attract caregivers
- But the rate must be sustainable within Medicaid reimbursement limits
- Consider: base Medicaid reimbursement, overtime rules, benefits costs
- In NY the Medicaid reimbursement is typically $18-23/hr depending on county
- Factor in that agencies keep a margin (typically 15-25% of reimbursement)

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "recommended_rate": <number - optimal hourly rate to offer caregivers>,
  "medicaid_reimbursement_rate": <number - estimated Medicaid reimbursement rate for this area>,
  "market_avg_rate": <number - average competitor pay rate>,
  "market_min_rate": <number - lowest competitor rate>,
  "market_max_rate": <number - highest competitor rate>,
  "analysis_summary": "<2-3 sentence explanation of why this rate is optimal, mentioning reimbursement ceiling and competitive positioning>",
  "sources_used": [<list of source descriptions>]
}`;

    console.log("Calling AI for analysis...");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert in US home care agency economics and Medicaid reimbursement rates. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      throw new Error(`AI analysis failed: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    console.log("AI response:", rawContent.slice(0, 200));

    // Parse JSON from response (handle potential markdown wrapping)
    let analysis: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      throw new Error("Failed to parse AI analysis response");
    }

    // 5. Upsert result
    const record = {
      agency_id,
      state: targetState,
      county: targetCounty || null,
      recommended_rate: analysis.recommended_rate,
      medicaid_reimbursement_rate: analysis.medicaid_reimbursement_rate,
      market_avg_rate: analysis.market_avg_rate,
      market_min_rate: analysis.market_min_rate,
      market_max_rate: analysis.market_max_rate,
      competitor_count: (competitors || []).length,
      analysis_summary: analysis.analysis_summary,
      sources: analysis.sources_used || [],
      updated_at: new Date().toISOString(),
    };

    // Check if exists for this agency+state+county
    const { data: existing } = await supabase
      .from("pay_rate_intel")
      .select("id")
      .eq("agency_id", agency_id)
      .eq("state", targetState)
      .is("county", targetCounty || null)
      .maybeSingle();

    if (existing) {
      await supabase.from("pay_rate_intel").update(record).eq("id", existing.id);
    } else {
      await supabase.from("pay_rate_intel").insert(record);
    }

    return new Response(JSON.stringify({ success: true, ...record }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-pay-rates error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
