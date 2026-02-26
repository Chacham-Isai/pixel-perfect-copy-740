import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCREENING_SCRIPT = `You are a friendly, professional recruiter calling on behalf of {agency_name}. Your goal is to screen potential caregivers. Be warm, conversational, and encouraging.

Follow this script, adapting naturally to the conversation:

1. "Hi there! I'm calling from {agency_name}. Thanks for your interest in our caregiver program paying {pay_rate} per hour. Can you tell me a little about yourself and what interests you about caregiving?"

2. "Great! Are you currently caring for a family member — like a parent, grandparent, or spouse?"
   - If yes: "Can you tell me about the person you're caring for? What kind of help do they need day to day?"

3. "Do you know if the person you care for has Medicaid, or have they applied for it?"

4. "What county or area are you located in?"

5. "Are you looking for full-time or part-time? What does your availability look like?"

6. "Do you have reliable transportation?"

7. If they mention a current employer: "How's your experience with your current agency? What would you change if you could?"

End the call warmly: "Thank you so much for your time! Someone from our team will follow up with next steps. Have a wonderful day!"`;

const ANALYSIS_PROMPT = `Analyze this phone screening transcript for a caregiver recruitment call. Extract the following as JSON:

{
  "ai_summary": "2-3 sentence summary of the call and candidate quality",
  "ai_score": <number 0-100 based on: patient identified (25pts), Medicaid status known (15pts), location match (15pts), availability stated (15pts), transportation (10pts), enthusiasm/engagement (10pts), currently caregiving (10pts)>,
  "ai_recommendation": "<advance|maybe|pass>",
  "screening_answers": {
    "currently_caregiving": <boolean or null>,
    "patient_name": "<string or null>",
    "patient_relationship": "<string or null>",
    "patient_needs": "<string or null>",
    "medicaid_status": "<string or null>",
    "county": "<string or null>",
    "availability": "<string or null>",
    "transportation": "<boolean or null>",
    "current_employer": "<string or null>",
    "soc_signals": "<string or null>"
  }
}

Transcript:
{transcript}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { agency_id, sourced_candidate_id, caregiver_id, phone_number, state } = await req.json();
    if (!agency_id || !phone_number) throw new Error("agency_id and phone_number required");

    // Load Bland AI key
    const { data: blandKey } = await sb
      .from("api_keys").select("key_value")
      .eq("agency_id", agency_id).eq("key_name", "bland_ai_api_key").eq("connected", true).maybeSingle();

    const mock = !blandKey?.key_value;

    // Load agency config
    const { data: bizConfig } = await sb.from("business_config").select("*").eq("agency_id", agency_id).maybeSingle();
    const { data: agencyData } = await sb.from("agencies").select("*").eq("id", agency_id).maybeSingle();
    const { data: payRate } = await sb.from("pay_rate_intel").select("recommended_rate")
      .eq("agency_id", agency_id).order("updated_at", { ascending: false }).limit(1).maybeSingle();

    const agencyName = bizConfig?.business_name || agencyData?.name || "Your Agency";
    const rate = payRate?.recommended_rate ? `$${payRate.recommended_rate}` : "$15-20";

    // Create phone_screens record
    const { data: screen, error: screenErr } = await sb.from("phone_screens").insert({
      agency_id,
      sourced_candidate_id: sourced_candidate_id || null,
      caregiver_id: caregiver_id || null,
      phone_number,
      status: mock ? "pending" : "ringing",
      agent_provider: "bland",
    }).select("id").single();
    if (screenErr) throw screenErr;

    if (mock) {
      // Update candidate status
      if (sourced_candidate_id) {
        await sb.from("sourced_candidates").update({ phone_screen_status: "pending" }).eq("id", sourced_candidate_id);
      }

      await sb.from("agent_activity_log").insert({
        agency_id,
        agent_type: "phone_screen",
        action: "screen_pending",
        entity_type: "phone_screen",
        entity_id: screen.id,
        details: `Phone screen created in pending status (Bland AI not configured)`,
        metadata: { mock: true, phone_number },
        success: true,
      });

      return new Response(JSON.stringify({
        success: true, mock: true, screen_id: screen.id,
        message: "Connect Bland AI in Settings > Integrations to enable automated phone screening",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Real Bland AI call
    const script = SCREENING_SCRIPT
      .replace(/\{agency_name\}/g, agencyName)
      .replace(/\{pay_rate\}/g, rate);

    const callRes = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        Authorization: blandKey!.key_value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number,
        task: script,
        reduce_latency: true,
        record: true,
        voice: "maya",
        max_duration: 600,
      }),
    });

    const callData = await callRes.json();
    if (!callRes.ok) {
      await sb.from("phone_screens").update({
        status: "failed",
      }).eq("id", screen.id);
      throw new Error(callData.message || "Bland AI call failed");
    }

    // Update with call_id
    await sb.from("phone_screens").update({
      call_id: callData.call_id,
      status: "ringing",
    }).eq("id", screen.id);

    if (sourced_candidate_id) {
      await sb.from("sourced_candidates").update({ phone_screen_status: "ringing" }).eq("id", sourced_candidate_id);
    }

    // Poll for completion (up to 10 minutes, every 15 seconds)
    let completed = false;
    let attempts = 0;
    const maxAttempts = 40;

    while (!completed && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 15000));
      attempts++;

      const statusRes = await fetch(`https://api.bland.ai/v1/calls/${callData.call_id}`, {
        headers: { Authorization: blandKey!.key_value },
      });
      const statusData = await statusRes.json();

      if (statusData.status === "completed" || statusData.completed) {
        completed = true;

        const transcript = statusData.transcripts?.map((t: any) => `${t.role}: ${t.text}`).join("\n") || statusData.transcript || "";
        const duration = statusData.call_length || statusData.duration || null;

        // Update screen with transcript
        await sb.from("phone_screens").update({
          status: "completed",
          transcript,
          duration_seconds: duration ? Math.round(duration) : null,
        }).eq("id", screen.id);

        // Analyze with AI
        try {
          const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
          if (lovableApiKey && transcript) {
            const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "user", content: ANALYSIS_PROMPT.replace("{transcript}", transcript) },
                ],
                response_format: { type: "json_object" },
              }),
            });

            const aiData = await aiRes.json();
            const analysis = JSON.parse(aiData.choices?.[0]?.message?.content || "{}");

            await sb.from("phone_screens").update({
              ai_summary: analysis.ai_summary || null,
              ai_score: analysis.ai_score || null,
              ai_recommendation: analysis.ai_recommendation || null,
              screening_answers: analysis.screening_answers || null,
            }).eq("id", screen.id);

            // Auto-promote if score >= 70 and recommendation is advance
            if (analysis.ai_score >= 70 && analysis.ai_recommendation === "advance" && sourced_candidate_id) {
              const { data: candidate } = await sb.from("sourced_candidates").select("*").eq("id", sourced_candidate_id).single();
              if (candidate && !candidate.promoted_to_caregiver_id) {
                const answers = analysis.screening_answers || {};
                const { data: cg } = await sb.from("caregivers").insert({
                  agency_id,
                  full_name: candidate.full_name,
                  phone: candidate.phone,
                  email: candidate.email,
                  state: candidate.state || state,
                  county: answers.county || candidate.county,
                  availability: answers.availability,
                  has_transportation: answers.transportation,
                  patient_name: answers.patient_name,
                  patient_relationship: answers.patient_relationship,
                  patient_medicaid_status: answers.medicaid_status,
                  currently_caregiving: answers.currently_caregiving,
                  source: "sourcing",
                  status: "new",
                  languages_spoken: candidate.languages_spoken,
                  years_caregiving_experience: candidate.years_experience,
                }).select("id").single();

                if (cg) {
                  await sb.from("sourced_candidates").update({
                    promoted_to_caregiver_id: cg.id,
                    phone_screen_status: "completed",
                  }).eq("id", sourced_candidate_id);

                  // Notify admin
                  const { data: members } = await sb.from("agency_members").select("user_id").eq("agency_id", agency_id).limit(1);
                  if (members?.[0]) {
                    await sb.from("notifications").insert({
                      agency_id,
                      user_id: members[0].user_id,
                      title: `AI Screen: ${candidate.full_name} scored ${analysis.ai_score}/100`,
                      body: `Auto-promoted to pipeline${answers.patient_name ? ` with patient ${answers.patient_name}` : ""}. Recommendation: ${analysis.ai_recommendation}`,
                      type: "agent",
                      link: "/caregivers",
                    });
                  }
                }
              }
            }
          }
        } catch (aiErr) {
          console.error("AI analysis failed:", aiErr);
        }
      } else if (statusData.status === "no-answer" || statusData.status === "voicemail" || statusData.status === "failed") {
        await sb.from("phone_screens").update({ status: statusData.status }).eq("id", screen.id);
        if (sourced_candidate_id) {
          await sb.from("sourced_candidates").update({ phone_screen_status: statusData.status }).eq("id", sourced_candidate_id);
        }
        completed = true;
      }
    }

    if (!completed) {
      await sb.from("phone_screens").update({ status: "timeout" }).eq("id", screen.id);
    }

    // Log activity
    await sb.from("agent_activity_log").insert({
      agency_id,
      agent_type: "phone_screen",
      action: completed ? "screen_completed" : "screen_timeout",
      entity_type: "phone_screen",
      entity_id: screen.id,
      details: `Phone screen ${completed ? "completed" : "timed out"} for ${phone_number}`,
      metadata: { call_id: callData.call_id, phone_number },
      success: completed,
    });

    return new Response(JSON.stringify({
      success: true,
      mock: false,
      screen_id: screen.id,
      call_id: callData.call_id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
