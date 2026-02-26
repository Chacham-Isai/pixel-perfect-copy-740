import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const VALID_JOBS = ["automations", "briefing", "scoring", "sequences", "sync-ads"] as const;
type JobType = typeof VALID_JOBS[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify cron secret
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || providedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const job = url.searchParams.get("job") as JobType | null;
    if (!job || !VALID_JOBS.includes(job)) {
      return new Response(JSON.stringify({ error: `Invalid job. Valid: ${VALID_JOBS.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Get all agencies
    const { data: agencies } = await sb.from("agencies").select("id");
    const agencyIds = (agencies || []).map((a: any) => a.id);

    const results: any[] = [];

    for (const agencyId of agencyIds) {
      try {
        let fnName = "";
        let payload: any = { agencyId };

        switch (job) {
          case "automations":
            fnName = "run-automations";
            break;
          case "briefing":
            fnName = "generate-briefing";
            payload = { agencyId, userId: null };
            break;
          case "scoring":
            fnName = "score-leads";
            break;
          case "sequences":
            fnName = "run-automations";
            break;
          case "sync-ads":
            fnName = "sync-ad-metrics";
            break;
        }

        const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        results.push({ agency: agencyId, job, success: res.ok, data });

        // Log the activity
        await sb.from("agent_activity_log").insert({
          agency_id: agencyId,
          agent_type: "cron",
          action: `cron_${job}`,
          details: `Cron job "${job}" executed. Status: ${res.ok ? "success" : "error"}`,
          success: res.ok,
        });
      } catch (e) {
        results.push({ agency: agencyId, job, success: false, error: e.message });
        await sb.from("agent_activity_log").insert({
          agency_id: agencyId,
          agent_type: "cron",
          action: `cron_${job}`,
          details: `Cron job "${job}" failed: ${e.message}`,
          success: false,
          error_message: e.message,
        });
      }
    }

    return new Response(JSON.stringify({ job, agencies_processed: agencyIds.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
