import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callEdgeFn(supabaseUrl: string, fnName: string, payload: any) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.error(`${fnName} call failed:`, e);
    return { success: false, error: e.message };
  }
}

// === Automation handlers ===

async function handleLeadScoring(sb: any, aid: string, supabaseUrl: string, agencyName: string, rate: string, agencyPhone: string) {
  const { data: unscored } = await sb.from("caregivers")
    .select("id, full_name, phone, email, state, county, currently_caregiving, years_caregiving_experience, patient_name, patient_medicaid_id, patient_medicaid_status, has_transportation, availability, created_at, background_check_status")
    .eq("agency_id", aid)
    .is("lead_score", null);

  let count = 0;
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

    if (tier === "HOT" && c.phone) {
      await callEdgeFn(supabaseUrl, "send-message", {
        agency_id: aid, channel: "sms", to: c.phone,
        body: `Hi ${c.full_name}, this is ${agencyName}! We'd love to help you get paid ${rate}/hr to care for your family. Reply YES to get started or call us at ${agencyPhone}`,
        template: "hot_lead_welcome", related_type: "caregiver", related_id: c.id,
      });
    }
    count++;
  }
  return count;
}

async function handleFollowUpReminders(sb: any, aid: string, supabaseUrl: string, agencyName: string, rate: string, agencyPhone: string, adminUserId?: string) {
  const { data: stale } = await sb.from("caregivers")
    .select("id, full_name, phone, email, status, last_contacted_at, created_at, auto_followup_count")
    .eq("agency_id", aid)
    .in("status", ["contacted", "intake_started"]);

  let count = 0;
  const threeDaysAgo = Date.now() - 3 * 86400000;
  for (const c of stale || []) {
    const lastContact = c.last_contacted_at || c.created_at;
    if (lastContact && new Date(lastContact).getTime() < threeDaysAgo) {
      const followupCount = (c.auto_followup_count || 0) + 1;
      await sb.from("caregivers").update({
        follow_up_date: new Date().toISOString().slice(0, 10),
        auto_followup_count: followupCount,
      }).eq("id", c.id);

      if (c.phone) {
        const messages = [
          `Hi ${c.full_name}, this is ${agencyName}. Just checking in — are you still interested in getting paid ${rate}/hr for caregiving? Reply YES or call ${agencyPhone}`,
          `${c.full_name}, we haven't heard from you. We'd love to help you earn ${rate}/hr caring for your loved one. Call us: ${agencyPhone}`,
          `Hi ${c.full_name}, last reminder from ${agencyName}. Earn ${rate}/hr as a caregiver — we handle all the paperwork! ${agencyPhone}`,
          `${c.full_name}, ${agencyName} is still here to help. ${rate}/hr, flexible schedule. Ready when you are: ${agencyPhone}`,
        ];
        await callEdgeFn(supabaseUrl, "send-message", {
          agency_id: aid, channel: "sms", to: c.phone,
          body: messages[Math.min(followupCount - 1, messages.length - 1)],
          template: `follow_up_stage_${followupCount}`, related_type: "caregiver", related_id: c.id,
        });
      }

      if (adminUserId) {
        await sb.from("notifications").insert({
          agency_id: aid, user_id: adminUserId,
          title: `Follow up needed: ${c.full_name}`,
          body: `${c.full_name} hasn't been contacted in 3+ days. Status: ${c.status}`,
          type: "follow_up", link: "/caregivers",
        });
      }
      count++;
    }
  }
  return count;
}

async function handlePerformanceAlerts(sb: any, aid: string, adminUserId?: string) {
  const { data: campaigns } = await sb.from("campaigns")
    .select("id, campaign_name, spend, pause_spend_threshold, conversions")
    .eq("agency_id", aid).eq("status", "active");

  let count = 0;
  for (const camp of campaigns || []) {
    if (camp.pause_spend_threshold && (camp.spend || 0) >= camp.pause_spend_threshold && adminUserId) {
      await sb.from("notifications").insert({
        agency_id: aid, user_id: adminUserId,
        title: `⚠️ Campaign spend alert: ${camp.campaign_name}`,
        body: `Campaign "${camp.campaign_name}" has reached $${camp.spend} (threshold: $${camp.pause_spend_threshold}). ${camp.conversions || 0} conversions.`,
        type: "alert", link: "/campaigns",
      });
      count++;
    }
  }
  return count;
}

async function handleStaleEnrollmentAlerts(sb: any, aid: string, supabaseUrl: string, agencyName: string, rate: string, agencyPhone: string, adminUserId?: string) {
  const { data: stale } = await sb.from("caregivers")
    .select("id, full_name, phone, email, status, enrollment_started_at, created_at")
    .eq("agency_id", aid)
    .in("status", ["intake_started", "enrollment_pending"]);

  let count = 0;
  const fourteenDaysAgo = Date.now() - 14 * 86400000;
  for (const c of stale || []) {
    const ref = c.enrollment_started_at || c.created_at;
    if (ref && new Date(ref).getTime() < fourteenDaysAgo) {
      if (c.phone) {
        await callEdgeFn(supabaseUrl, "send-message", {
          agency_id: aid, channel: "sms", to: c.phone,
          body: `Hi ${c.full_name}, just checking in on your enrollment with ${agencyName}. Need help? Call us: ${agencyPhone}`,
          template: "stale_enrollment_reminder", related_type: "caregiver", related_id: c.id,
        });
      } else if (c.email) {
        await callEdgeFn(supabaseUrl, "send-message", {
          agency_id: aid, channel: "email", to: c.email,
          subject: `${c.full_name}, let's finish your enrollment`,
          body: `Hi ${c.full_name},\n\nWe noticed your enrollment with ${agencyName} is still in progress. We're here to help you complete it and start earning ${rate}/hr.\n\nCall us at ${agencyPhone} or reply to this email.\n\nBest,\n${agencyName}`,
          template: "stale_enrollment_reminder", related_type: "caregiver", related_id: c.id,
        });
      }
      if (adminUserId) {
        await sb.from("notifications").insert({
          agency_id: aid, user_id: adminUserId,
          title: `Stale enrollment: ${c.full_name}`,
          body: `${c.full_name} has been in "${c.status}" for over 14 days.`,
          type: "stale_enrollment", link: "/caregivers",
        });
      }
      count++;
    }
  }
  return count;
}

async function handleAutoWelcomeSms(sb: any, aid: string, supabaseUrl: string, agencyName: string, rate: string, agencyPhone: string) {
  // Send welcome SMS to new caregivers who haven't been contacted
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { data: newLeads } = await sb.from("caregivers")
    .select("id, full_name, phone")
    .eq("agency_id", aid)
    .eq("status", "new")
    .is("last_contacted_at", null)
    .gt("created_at", oneDayAgo);

  let count = 0;
  for (const c of newLeads || []) {
    if (c.phone) {
      await callEdgeFn(supabaseUrl, "send-message", {
        agency_id: aid, channel: "sms", to: c.phone,
        body: `Welcome ${c.full_name}! ${agencyName} received your info. You could earn ${rate}/hr as a caregiver. Questions? Call ${agencyPhone}`,
        template: "auto_welcome", related_type: "caregiver", related_id: c.id,
      });
      await sb.from("caregivers").update({ last_contacted_at: new Date().toISOString(), status: "contacted" }).eq("id", c.id);
      count++;
    }
  }
  return count;
}

async function handleAutoSourceCandidates(sb: any, aid: string, supabaseUrl: string) {
  // Auto-run active sourcing campaigns
  const { data: campaigns } = await sb.from("sourcing_campaigns")
    .select("id").eq("agency_id", aid).eq("status", "active");

  let count = 0;
  for (const camp of campaigns || []) {
    await callEdgeFn(supabaseUrl, "source-candidates", {
      agency_id: aid, campaign_id: camp.id, mode: "search",
    });
    count++;
  }
  return count;
}

async function handleAutoOutreachHighMatch(sb: any, aid: string, supabaseUrl: string) {
  // Auto-trigger outreach for high-match sourced candidates
  const { data: candidates } = await sb.from("sourced_candidates")
    .select("id").eq("agency_id", aid).eq("outreach_status", "not_started")
    .gte("match_score", 70).limit(10);

  let count = 0;
  for (const c of candidates || []) {
    await callEdgeFn(supabaseUrl, "trigger-outreach", {
      agency_id: aid, candidate_ids: [c.id], sequence_type: "caregiver_cold",
    });
    count++;
  }
  return count;
}

async function handleAutoScreenResponded(sb: any, aid: string, supabaseUrl: string) {
  // Auto-screen sourced candidates who responded to outreach
  const { data: responded } = await sb.from("sourced_candidates")
    .select("id, phone").eq("agency_id", aid).eq("outreach_status", "responded")
    .eq("phone_screen_status", "not_started").limit(5);

  let count = 0;
  for (const c of responded || []) {
    if (c.phone) {
      await callEdgeFn(supabaseUrl, "ai-phone-screen", {
        agency_id: aid, candidate_id: c.id, phone_number: c.phone,
      });
      count++;
    }
  }
  return count;
}

async function handleAutoReviewRequest(sb: any, aid: string, supabaseUrl: string, agencyName: string, agencyPhone: string) {
  // Send review requests to recently activated caregivers
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: active } = await sb.from("caregivers")
    .select("id, full_name, phone, email")
    .eq("agency_id", aid).eq("status", "active")
    .gt("updated_at", thirtyDaysAgo);

  // Get existing review requests to avoid duplicates
  const { data: existing } = await sb.from("review_requests")
    .select("caregiver_id").eq("agency_id", aid);
  const sent = new Set((existing || []).map((r: any) => r.caregiver_id));

  let count = 0;
  for (const c of active || []) {
    if (sent.has(c.id)) continue;
    if (c.phone) {
      await callEdgeFn(supabaseUrl, "send-message", {
        agency_id: aid, channel: "sms", to: c.phone,
        body: `Hi ${c.full_name}, thank you for being part of ${agencyName}! Would you mind leaving us a quick review? It helps other families find care. Reply REVIEW or call ${agencyPhone}`,
        template: "review_request", related_type: "caregiver", related_id: c.id,
      });
      await sb.from("review_requests").insert({ agency_id: aid, caregiver_id: c.id, status: "sent" });
      count++;
    }
  }
  return count;
}

async function handleBackgroundCheckReminder(sb: any, aid: string, supabaseUrl: string, agencyName: string, agencyPhone: string, adminUserId?: string) {
  const { data: pending } = await sb.from("caregivers")
    .select("id, full_name, phone, background_check_status, created_at")
    .eq("agency_id", aid)
    .eq("background_check_status", "not_started")
    .in("status", ["intake_started", "enrollment_pending"]);

  let count = 0;
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  for (const c of pending || []) {
    if (c.created_at && new Date(c.created_at).getTime() < sevenDaysAgo) {
      if (c.phone) {
        await callEdgeFn(supabaseUrl, "send-message", {
          agency_id: aid, channel: "sms", to: c.phone,
          body: `Hi ${c.full_name}, ${agencyName} here. To complete your enrollment, we need your background check. Please call ${agencyPhone} for next steps.`,
          template: "bg_check_reminder", related_type: "caregiver", related_id: c.id,
        });
      }
      if (adminUserId) {
        await sb.from("notifications").insert({
          agency_id: aid, user_id: adminUserId,
          title: `Background check pending: ${c.full_name}`,
          body: `${c.full_name} has not started background check after 7+ days.`,
          type: "warning", link: "/caregivers",
        });
      }
      count++;
    }
  }
  return count;
}

async function handleAuthExpiryAlert(sb: any, aid: string, adminUserId?: string) {
  // Alert for caregivers whose authorization is expiring within 30 days
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const { data: expiring } = await sb.from("caregivers")
    .select("id, full_name, authorization_date")
    .eq("agency_id", aid).eq("status", "active")
    .lte("authorization_date", thirtyDaysFromNow)
    .gte("authorization_date", today);

  let count = 0;
  for (const c of expiring || []) {
    if (adminUserId) {
      await sb.from("notifications").insert({
        agency_id: aid, user_id: adminUserId,
        title: `⚠️ Auth expiring: ${c.full_name}`,
        body: `Authorization expires ${c.authorization_date}. Renew soon.`,
        type: "warning", link: "/caregivers",
      });
      count++;
    }
  }
  return count;
}

// === Main handler ===

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
        .from("automation_configs").select("*")
        .eq("agency_id", aid).eq("active", true);
      if (autErr) throw autErr;

      // Load context data
      const { data: bizConfig } = await sb.from("business_config").select("*").eq("agency_id", aid).maybeSingle();
      const { data: agencyData } = await sb.from("agencies").select("*").eq("id", aid).maybeSingle();
      const agencyName = bizConfig?.business_name || agencyData?.name || "Your Agency";
      const agencyPhone = bizConfig?.phone || agencyData?.phone || "";

      const { data: payRate } = await sb.from("pay_rate_intel").select("recommended_rate")
        .eq("agency_id", aid).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      const rate = payRate?.recommended_rate ? `$${payRate.recommended_rate}` : "$15-20";

      const { data: members } = await sb.from("agency_members").select("user_id").eq("agency_id", aid).limit(1);
      const adminUserId = members?.[0]?.user_id;

      const results: { key: string; actions: number }[] = [];

      for (const auto of automations || []) {
        let actionsCount = 0;

        try {
          switch (auto.automation_key) {
            case "lead_scoring":
            case "auto_lead_scoring":
            case "auto_score_caregivers":
              actionsCount = await handleLeadScoring(sb, aid, supabaseUrl, agencyName, rate, agencyPhone);
              break;
            case "follow_up_reminders":
            case "auto_followup_sms":
            case "auto_followup_sequence":
              actionsCount = await handleFollowUpReminders(sb, aid, supabaseUrl, agencyName, rate, agencyPhone, adminUserId);
              break;
            case "performance_alerts":
            case "campaign_pause_alerts":
              actionsCount = await handlePerformanceAlerts(sb, aid, adminUserId);
              break;
            case "stale_enrollment_alerts":
            case "enrollment_stale_alert":
            case "enrollment_nudges":
              actionsCount = await handleStaleEnrollmentAlerts(sb, aid, supabaseUrl, agencyName, rate, agencyPhone, adminUserId);
              break;
            case "auto_welcome_sms":
            case "auto_sms_hot_caregivers":
              actionsCount = await handleAutoWelcomeSms(sb, aid, supabaseUrl, agencyName, rate, agencyPhone);
              break;
            case "auto_source_candidates":
              actionsCount = await handleAutoSourceCandidates(sb, aid, supabaseUrl);
              break;
            case "auto_outreach_high_match":
              actionsCount = await handleAutoOutreachHighMatch(sb, aid, supabaseUrl);
              break;
            case "auto_screen_responded":
              actionsCount = await handleAutoScreenResponded(sb, aid, supabaseUrl);
              break;
            case "auto_review_request":
            case "review_request_on_active":
            case "review_solicitation":
              actionsCount = await handleAutoReviewRequest(sb, aid, supabaseUrl, agencyName, agencyPhone);
              break;
            case "background_check_reminder":
              actionsCount = await handleBackgroundCheckReminder(sb, aid, supabaseUrl, agencyName, agencyPhone, adminUserId);
              break;
            case "auth_expiry_alert":
            case "authorization_expiry_alert":
              actionsCount = await handleAuthExpiryAlert(sb, aid, adminUserId);
              break;
            case "process_sequences":
              // Handled by separate sequence processing logic
              break;
            case "competitor_monitoring":
            case "poach_detector":
            case "content_scheduling":
            case "daily_briefing":
            case "landing_page_alerts":
            case "negative_review_alert":
            case "stuck_caregiver_detection":
              // Future implementation - no-op for now
              break;
            default:
              console.log(`Unknown automation key: ${auto.automation_key}`);
          }
        } catch (handlerErr) {
          console.error(`Error in ${auto.automation_key}:`, handlerErr);
        }

        await sb.from("automation_configs").update({
          last_run_at: new Date().toISOString(),
          actions_this_week: (auto.actions_this_week || 0) + actionsCount,
        }).eq("id", auto.id);

        results.push({ key: auto.automation_key, actions: actionsCount });
      }

      await sb.from("activity_log").insert({
        agency_id: aid, action: "automations_run",
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
