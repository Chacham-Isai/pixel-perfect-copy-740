import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEQUENCES = {
  caregiver_cold: [
    { day: 0, channel: "sms", body: "Hi {name}, {agency_name} is hiring caregivers at {pay_rate}/hr. Already caring for a family member? We can get you paid for it. Reply YES or call {phone}" },
    { day: 1, channel: "email", subject: "Get Paid {pay_rate}/Hour to Care for Your Loved One", body: "Hi {name},\n\nDid you know you can get paid {pay_rate}/hour to care for your family member through Medicaid?\n\n{agency_name} handles all the paperwork — enrollment, authorization, and billing. You focus on caring.\n\n✅ {pay_rate}/hr pay rate\n✅ Flexible schedule — you set your hours\n✅ We handle all Medicaid paperwork\n✅ Sign-on bonus available\n\nReady to get started? Reply to this email or call us at {phone}.\n\nBest,\n{agency_name}" },
    { day: 3, channel: "sms", body: "{pay_rate}/hr, flexible schedule, we handle all Medicaid paperwork. Questions? Text back or call {phone}" },
    { day: 7, channel: "email", subject: "What Our Caregivers Say", body: "Hi {name},\n\nHere's what caregivers like you are saying about {agency_name}:\n\n\"I love that I can care for my mom and get paid. They made the whole process so easy.\" — Maria G.\n\n\"The pay is better than my old agency and they actually answer the phone.\" — Thanh N.\n\nWith {agency_name}, you'll earn {pay_rate}/hr — that's thousands more per year than most agencies in {state}.\n\nReady? Call us: {phone}\n\n{agency_name}" },
    { day: 14, channel: "sms", body: "Last reach out, {name}. Whenever you're ready for {pay_rate}/hr caregiving, we're here. {phone}" },
  ],
  poaching: [
    { day: 0, channel: "sms", body: "Hi {name}, are you a caregiver? {agency_name} pays {pay_rate}/hr — that's thousands more per year than most agencies. Interested? Reply YES" },
    { day: 2, channel: "email", subject: "You Deserve Better Pay", body: "Hi {name},\n\nIf you're currently working as a caregiver, you might be leaving money on the table.\n\n{agency_name} pays {pay_rate}/hr — compare that to what you're making now.\n\nSwitching is easy:\n1. Quick 15-min phone call\n2. We handle all paperwork\n3. No gap in pay\n4. Start within a week\n\nInterested? Reply or call {phone}.\n\n{agency_name}" },
    { day: 5, channel: "sms", body: "{pay_rate}/hr + sign-on bonus. We make switching easy — most caregivers transition in under a week. {phone}" },
    { day: 10, channel: "email", subject: "Ready When You Are", body: "Hi {name},\n\nWe know switching agencies feels like a big step. Here are answers to common questions:\n\nQ: Will there be a gap in my pay?\nA: No — we coordinate the transition.\n\nQ: Do I need to redo all paperwork?\nA: We handle everything. Minimal effort from you.\n\nQ: What if my patient wants to stay with my current agency?\nA: The patient chooses. Most prefer to stay with their caregiver.\n\nWhen you're ready: {phone}\n\n{agency_name}" },
    { day: 21, channel: "sms", body: "Door's always open, {name}. When you want the raise, text us. {phone}" },
  ],
};

function mergFields(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { agency_id, sourced_candidate_ids, sequence_type } = await req.json();
    if (!agency_id || !sourced_candidate_ids?.length || !sequence_type) {
      throw new Error("agency_id, sourced_candidate_ids, and sequence_type required");
    }

    // Load GHL keys
    const { data: ghlKey } = await sb
      .from("api_keys").select("key_value")
      .eq("agency_id", agency_id).eq("key_name", "ghl_api_key").eq("connected", true).maybeSingle();
    const { data: ghlSubaccount } = await sb
      .from("api_keys").select("key_value")
      .eq("agency_id", agency_id).eq("key_name", "ghl_subaccount_id").eq("connected", true).maybeSingle();

    const mock = !ghlKey?.key_value;

    // Load agency config
    const { data: bizConfig } = await sb.from("business_config").select("*").eq("agency_id", agency_id).maybeSingle();
    const { data: agencyData } = await sb.from("agencies").select("*").eq("id", agency_id).maybeSingle();
    const { data: payRate } = await sb.from("pay_rate_intel").select("recommended_rate")
      .eq("agency_id", agency_id).order("updated_at", { ascending: false }).limit(1).maybeSingle();

    const mergeVars: Record<string, string> = {
      agency_name: bizConfig?.business_name || agencyData?.name || "Your Agency",
      phone: bizConfig?.phone || agencyData?.phone || "",
      pay_rate: payRate?.recommended_rate ? `$${payRate.recommended_rate}` : "$15-20",
      state: agencyData?.primary_state || agencyData?.states?.[0] || "",
    };

    // Load candidates
    const { data: candidates } = await sb
      .from("sourced_candidates")
      .select("*")
      .in("id", sourced_candidate_ids)
      .eq("agency_id", agency_id);

    let sentCount = 0;
    const sequence = SEQUENCES[sequence_type as keyof typeof SEQUENCES];
    if (!sequence) throw new Error("Invalid sequence_type");
    const firstStep = sequence[0];

    for (const candidate of candidates || []) {
      const vars = { ...mergeVars, name: candidate.full_name };

      if (!mock) {
        // Create/update contact in GHL
        try {
          await fetch("https://rest.gohighlevel.com/v1/contacts/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ghlKey!.key_value}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName: candidate.full_name.split(" ")[0],
              lastName: candidate.full_name.split(" ").slice(1).join(" "),
              phone: candidate.phone,
              email: candidate.email,
              tags: [`halevai_${sequence_type}`],
              source: "halevai_sourcing",
              locationId: ghlSubaccount?.key_value,
            }),
          });
        } catch (e) {
          console.error("GHL contact creation failed:", e);
        }
      }

      // Send first message via send-message
      if (candidate.phone && firstStep.channel === "sms") {
        await fetch(`${supabaseUrl}/functions/v1/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agency_id,
            channel: "sms",
            to: candidate.phone,
            body: mergFields(firstStep.body, vars),
            template: `${sequence_type}_step_1`,
            related_type: "sourced_candidate",
            related_id: candidate.id,
          }),
        });
      }

      // Update candidate status
      await sb.from("sourced_candidates").update({
        outreach_status: mock ? "queued" : "sent",
      }).eq("id", candidate.id);
      sentCount++;
    }

    // Update campaign pushed counter
    if (candidates?.length) {
      const campaignId = candidates[0].sourcing_campaign_id;
      if (campaignId) {
        const { data: camp } = await sb.from("sourcing_campaigns").select("candidates_pushed").eq("id", campaignId).single();
        await sb.from("sourcing_campaigns").update({
          candidates_pushed: (camp?.candidates_pushed || 0) + sentCount,
        }).eq("id", campaignId);
      }
    }

    // Log activity
    await sb.from("agent_activity_log").insert({
      agency_id,
      agent_type: "outreach",
      action: "outreach_triggered",
      entity_type: "sourced_candidate",
      details: `Triggered ${sequence_type} outreach for ${sentCount} candidates${mock ? " (mock/queued)" : ""}`,
      metadata: { mock, sequence_type, count: sentCount },
      success: true,
    });

    return new Response(JSON.stringify({ success: true, mock, sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
