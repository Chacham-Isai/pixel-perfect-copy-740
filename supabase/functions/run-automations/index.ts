import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callSendMessage(supabaseUrl: string, payload: any) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.error("send-message call failed:", e);
    return { success: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { agencyId } = await req.json();
    if (!agencyId) throw new Error("agencyId required");

    let agencyIds: string[] = [];
    if (agencyId === "all") {
      const { data: agencies } = await sb.from("agencies").select("id");
      agencyIds = (agencies || []).map((a: any) => a.id);
    } else {
      agencyIds = [agencyId];
    }

    const allResults: { agency: string; results: { key: string; actions: number }[] }[] = [];

    for (const aid of agencyIds) {
      const { data: automations, error: autErr } = await sb
        .from("automation_configs")
        .select("*")
        .eq("agency_id", aid)
        .eq("active", true);
      if (autErr) throw autErr;

      // Load business config for merge fields
      const { data: bizConfig } = await sb
        .from("business_config")
        .select("*")
        .eq("agency_id", aid)
        .maybeSingle();
      const { data: agencyData } = await sb.from("agencies").select("*").eq("id", aid).maybeSingle();
      const agencyName = bizConfig?.business_name || agencyData?.name || "Your Agency";
      const agencyPhone = bizConfig?.phone || agencyData?.phone || "";

      // Load pay rate for merge fields
      const { data: payRate } = await sb
        .from("pay_rate_intel")
        .select("recommended_rate")
        .eq("agency_id", aid)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const rate = payRate?.recommended_rate ? `$${payRate.recommended_rate}` : "$15-20";

      // Get first admin user for in_app notifications
      const { data: members } = await sb.from("agency_members").select("user_id").eq("agency_id", aid).limit(1);
      const adminUserId = members?.[0]?.user_id;

      const results: { key: string; actions: number }[] = [];

      for (const auto of automations || []) {
        let actionsCount = 0;

        switch (auto.automation_key) {
          case "lead_scoring": {
            const { data: unscored } = await sb.from("caregivers")
              .select("id, full_name, phone, email, state, county, currently_caregiving, years_caregiving_experience, patient_name, patient_medicaid_id, patient_medicaid_status, has_transportation, availability, created_at, background_check_status, last_contacted_at")
              .eq("agency_id", aid)
              .is("lead_score", null);

            for (const c of unscored || []) {
              let score = 0;
              if (c.phone) score += 8;
              if (c.email) score += 7;
              if (c.state) score += 5;
              if (c.county) score += 5;
              if (c.currently_caregiving) score += 10;
              if (c.patient_name) score += 8;
              if (c.patient_medicaid_id) score += 7;
              if (c.patient_medicaid_status === "active") score += 5;
              if (c.has_transportation) score += 5;
              if (c.availability) score += 5;
              if (c.created_at) {
                const days = (Date.now() - new Date(c.created_at).getTime()) / 86400000;
                if (days <= 1) score += 10;
                else if (days <= 3) score += 7;
                else if (days <= 7) score += 4;
              }
              if (c.background_check_status === "passed") score += 5;
              score = Math.min(score, 100);
              const tier = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";
              await sb.from("caregivers").update({ lead_score: score, lead_tier: tier }).eq("id", c.id);

              // Send welcome SMS to HOT leads
              if (tier === "HOT" && c.phone) {
                await callSendMessage(supabaseUrl, {
                  agency_id: aid,
                  channel: "sms",
                  to: c.phone,
                  body: `Hi ${c.full_name}, this is ${agencyName}! We'd love to help you get paid ${rate}/hr to care for your family. Reply YES to get started or call us at ${agencyPhone}`,
                  template: "hot_lead_welcome",
                  related_type: "caregiver",
                  related_id: c.id,
                });
              }
              actionsCount++;
            }
            break;
          }

          case "follow_up_reminders": {
            const { data: stale } = await sb.from("caregivers")
              .select("id, full_name, phone, email, status, last_contacted_at, created_at, auto_followup_count")
              .eq("agency_id", aid)
              .in("status", ["contacted", "intake_started"]);

            const threeDaysAgo = Date.now() - 3 * 86400000;
            for (const c of stale || []) {
              const lastContact = c.last_contacted_at || c.created_at;
              if (lastContact && new Date(lastContact).getTime() < threeDaysAgo) {
                const today = new Date().toISOString().slice(0, 10);
                const followupCount = (c.auto_followup_count || 0) + 1;
                await sb.from("caregivers").update({
                  follow_up_date: today,
                  auto_followup_count: followupCount,
                }).eq("id", c.id);

                // Send follow-up SMS if phone available
                if (c.phone) {
                  const messages = [
                    `Hi ${c.full_name}, this is ${agencyName}. Just checking in — are you still interested in getting paid ${rate}/hr for caregiving? Reply YES or call ${agencyPhone}`,
                    `${c.full_name}, we haven't heard from you. We'd love to help you earn ${rate}/hr caring for your loved one. Call us: ${agencyPhone}`,
                    `Hi ${c.full_name}, last reminder from ${agencyName}. Earn ${rate}/hr as a caregiver — we handle all the paperwork! ${agencyPhone}`,
                    `${c.full_name}, ${agencyName} is still here to help. ${rate}/hr, flexible schedule. Ready when you are: ${agencyPhone}`,
                  ];
                  const msg = messages[Math.min(followupCount - 1, messages.length - 1)];
                  await callSendMessage(supabaseUrl, {
                    agency_id: aid,
                    channel: "sms",
                    to: c.phone,
                    body: msg,
                    template: `follow_up_stage_${followupCount}`,
                    related_type: "caregiver",
                    related_id: c.id,
                  });
                }

                // Still create in-app notification
                if (adminUserId) {
                  await sb.from("notifications").insert({
                    agency_id: aid,
                    user_id: adminUserId,
                    title: `Follow up needed: ${c.full_name}`,
                    body: `${c.full_name} hasn't been contacted in 3+ days. Status: ${c.status}`,
                    type: "follow_up",
                    link: "/caregivers",
                  });
                }
                actionsCount++;
              }
            }
            break;
          }

          case "performance_alerts": {
            const { data: campaigns } = await sb.from("campaigns")
              .select("id, campaign_name, spend, pause_spend_threshold, conversions")
              .eq("agency_id", aid)
              .eq("status", "active");

            for (const camp of campaigns || []) {
              if (camp.pause_spend_threshold && (camp.spend || 0) >= camp.pause_spend_threshold) {
                if (adminUserId) {
                  await sb.from("notifications").insert({
                    agency_id: aid,
                    user_id: adminUserId,
                    title: `⚠️ Campaign spend alert: ${camp.campaign_name}`,
                    body: `Campaign "${camp.campaign_name}" has reached $${camp.spend} (threshold: $${camp.pause_spend_threshold}). ${camp.conversions || 0} conversions.`,
                    type: "alert",
                    link: "/campaigns",
                  });
                }
                actionsCount++;
              }
            }
            break;
          }

          case "stale_enrollment_alerts": {
            const { data: stale } = await sb.from("caregivers")
              .select("id, full_name, phone, email, status, enrollment_started_at, created_at")
              .eq("agency_id", aid)
              .in("status", ["intake_started", "enrollment_pending"]);

            const fourteenDaysAgo = Date.now() - 14 * 86400000;
            for (const c of stale || []) {
              const ref = c.enrollment_started_at || c.created_at;
              if (ref && new Date(ref).getTime() < fourteenDaysAgo) {
                // Send reminder SMS/email
                if (c.phone) {
                  await callSendMessage(supabaseUrl, {
                    agency_id: aid,
                    channel: "sms",
                    to: c.phone,
                    body: `Hi ${c.full_name}, just checking in on your enrollment with ${agencyName}. Need help? Call us: ${agencyPhone}`,
                    template: "stale_enrollment_reminder",
                    related_type: "caregiver",
                    related_id: c.id,
                  });
                } else if (c.email) {
                  await callSendMessage(supabaseUrl, {
                    agency_id: aid,
                    channel: "email",
                    to: c.email,
                    subject: `${c.full_name}, let's finish your enrollment`,
                    body: `Hi ${c.full_name},\n\nWe noticed your enrollment with ${agencyName} is still in progress. We're here to help you complete it and start earning ${rate}/hr.\n\nCall us at ${agencyPhone} or reply to this email.\n\nBest,\n${agencyName}`,
                    template: "stale_enrollment_reminder",
                    related_type: "caregiver",
                    related_id: c.id,
                  });
                }

                if (adminUserId) {
                  await sb.from("notifications").insert({
                    agency_id: aid,
                    user_id: adminUserId,
                    title: `Stale enrollment: ${c.full_name}`,
                    body: `${c.full_name} has been in "${c.status}" for over 14 days.`,
                    type: "stale_enrollment",
                    link: "/caregivers",
                  });
                }
                actionsCount++;
              }
            }
            break;
          }
        }

        await sb.from("automation_configs").update({
          last_run_at: new Date().toISOString(),
          actions_this_week: (auto.actions_this_week || 0) + actionsCount,
        }).eq("id", auto.id);

        results.push({ key: auto.automation_key, actions: actionsCount });
      }

      await sb.from("activity_log").insert({
        agency_id: aid,
        action: "automations_run",
        details: `Ran ${results.length} automations, ${results.reduce((s, r) => s + r.actions, 0)} total actions`,
        actor: "system",
      });

      allResults.push({ agency: aid, results });
    }

    return new Response(JSON.stringify({ results: allResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
