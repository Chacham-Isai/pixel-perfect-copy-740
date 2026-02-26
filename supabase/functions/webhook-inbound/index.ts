import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return input;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const contentType = req.headers.get("content-type") || "";
    let channel: "sms" | "email" = "sms";
    let fromContact = "";
    let toContact = "";
    let body = "";
    let subject: string | null = null;
    let externalId: string | null = null;
    let rawMetadata: Record<string, any> = {};

    // Detect if Twilio (form-urlencoded with MessageSid) or SendGrid (JSON with envelope)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio SMS webhook
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      channel = "sms";
      fromContact = normalizePhone(params.get("From") || "");
      toContact = normalizePhone(params.get("To") || "");
      body = params.get("Body") || "";
      externalId = params.get("MessageSid") || null;
      rawMetadata = Object.fromEntries(params.entries());
    } else {
      // SendGrid Inbound Parse or JSON
      let jsonData: any;
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        jsonData: any = {};
        formData.forEach((value, key) => {
          jsonData[key] = value;
        });
      } else {
        jsonData = await req.json();
      }

      // SendGrid format
      if (jsonData.envelope || jsonData.from) {
        channel = "email";
        const envelope = typeof jsonData.envelope === "string" ? JSON.parse(jsonData.envelope) : jsonData.envelope;
        fromContact = envelope?.from || jsonData.from || "";
        toContact = envelope?.to?.[0] || jsonData.to || "";
        body = jsonData.text || jsonData.html || "";
        subject = jsonData.subject || null;
        externalId = jsonData["message-id"] || null;
        rawMetadata = jsonData;
      }
    }

    if (!fromContact || !body) {
      return new Response(
        "<Response></Response>",
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Match to agency by looking up who owns the to_contact
    let agencyId: string | null = null;

    if (channel === "sms") {
      // Look up which agency has this phone number as their Twilio number
      const { data: keyMatch } = await sb
        .from("api_keys")
        .select("agency_id")
        .eq("key_name", "twilio_phone_number")
        .eq("key_value", toContact)
        .maybeSingle();
      agencyId = keyMatch?.agency_id || null;
    } else {
      // For email, try matching domain from sendgrid_inbound_domain
      const toDomain = toContact.split("@")[1];
      if (toDomain) {
        const { data: keys } = await sb
          .from("api_keys")
          .select("agency_id, key_value")
          .eq("key_name", "sendgrid_inbound_domain");
        if (keys) {
          const match = keys.find((k: any) => toDomain.includes(k.key_value));
          if (match) agencyId = match.agency_id;
        }
      }
    }

    // Fallback: if only one agency exists, use it
    if (!agencyId) {
      const { data: agencies } = await sb.from("agencies").select("id").limit(2);
      if (agencies && agencies.length === 1) {
        agencyId = agencies[0].id;
      }
    }

    if (!agencyId) {
      console.error("Could not match inbound message to any agency", { fromContact, toContact });
      return new Response(
        "<Response></Response>",
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Match to caregiver or sourced_candidate
    let caregiverId: string | null = null;
    let sourcedCandidateId: string | null = null;
    let contactName: string | null = null;
    let matched = false;

    if (channel === "sms") {
      const { data: cg } = await sb
        .from("caregivers")
        .select("id, full_name, phone")
        .eq("agency_id", agencyId)
        .ilike("phone", `%${fromContact.slice(-10)}%`)
        .maybeSingle();
      if (cg) {
        caregiverId = cg.id;
        contactName = cg.full_name;
        matched = true;
      } else {
        const { data: sc } = await sb
          .from("sourced_candidates")
          .select("id, full_name, phone")
          .eq("agency_id", agencyId)
          .ilike("phone", `%${fromContact.slice(-10)}%`)
          .maybeSingle();
        if (sc) {
          sourcedCandidateId = sc.id;
          contactName = sc.full_name;
          matched = true;
        }
      }
    } else {
      const fromEmail = fromContact.includes("<") 
        ? fromContact.match(/<(.+?)>/)?.[1] || fromContact 
        : fromContact;
      const { data: cg } = await sb
        .from("caregivers")
        .select("id, full_name, email")
        .eq("agency_id", agencyId)
        .ilike("email", fromEmail)
        .maybeSingle();
      if (cg) {
        caregiverId = cg.id;
        contactName = cg.full_name;
        matched = true;
      } else {
        const { data: sc } = await sb
          .from("sourced_candidates")
          .select("id, full_name, email")
          .eq("agency_id", agencyId)
          .ilike("email", fromEmail)
          .maybeSingle();
        if (sc) {
          sourcedCandidateId = sc.id;
          contactName = sc.full_name;
          matched = true;
        }
      }
    }

    // Insert inbound message
    const { error: insertErr } = await sb.from("inbound_messages").insert({
      agency_id: agencyId,
      channel,
      from_contact: fromContact,
      to_contact: toContact,
      subject,
      body,
      external_id: externalId,
      caregiver_id: caregiverId,
      sourced_candidate_id: sourcedCandidateId,
      matched,
      metadata: rawMetadata,
    });
    if (insertErr) console.error("Insert inbound_messages error:", insertErr);

    // Update or create conversation thread
    const threadKey = channel === "sms" ? "contact_phone" : "contact_email";
    const threadContact = channel === "sms" ? normalizePhone(fromContact) : fromContact;

    const { data: existingThread } = await sb
      .from("conversation_threads")
      .select("id, unread_count")
      .eq("agency_id", agencyId)
      .eq(threadKey, threadContact)
      .maybeSingle();

    if (existingThread) {
      await sb.from("conversation_threads").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 100),
        unread_count: (existingThread.unread_count || 0) + 1,
        contact_name: contactName || undefined,
        caregiver_id: caregiverId || undefined,
        sourced_candidate_id: sourcedCandidateId || undefined,
        updated_at: new Date().toISOString(),
      }).eq("id", existingThread.id);
    } else {
      await sb.from("conversation_threads").insert({
        agency_id: agencyId,
        contact_phone: channel === "sms" ? threadContact : null,
        contact_email: channel === "email" ? threadContact : null,
        contact_name: contactName,
        caregiver_id: caregiverId,
        sourced_candidate_id: sourcedCandidateId,
        channel,
        last_message_at: new Date().toISOString(),
        last_message_preview: body.slice(0, 100),
        unread_count: 1,
      });
    }

    // Create notification for agency members
    const { data: members } = await sb
      .from("agency_members")
      .select("user_id")
      .eq("agency_id", agencyId);

    if (members) {
      const preview = body.slice(0, 80);
      const name = contactName || fromContact;
      const notifications = members.map((m: any) => ({
        agency_id: agencyId,
        user_id: m.user_id,
        title: `New ${channel.toUpperCase()} reply from ${name}`,
        body: preview,
        type: "inbound_message",
        link: "/inbox",
      }));
      await sb.from("notifications").insert(notifications);
    }

    // Auto-detect keywords
    const upperBody = body.toUpperCase().trim();
    const positiveKeywords = ["YES", "INTERESTED", "START", "APPLY"];
    const stopKeywords = ["STOP", "UNSUBSCRIBE", "OPT OUT", "OPTOUT"];

    if (caregiverId) {
      if (positiveKeywords.some(kw => upperBody.includes(kw))) {
        const { data: cg } = await sb.from("caregivers").select("status").eq("id", caregiverId).single();
        if (cg && (cg.status === "new" || cg.status === "contacted")) {
          await sb.from("caregivers").update({ status: "contacted" }).eq("id", caregiverId);
          await sb.from("caregiver_activities").insert({
            agency_id: agencyId,
            caregiver_id: caregiverId,
            action_type: "auto_status_update",
            note: `Auto-advanced to "contacted" based on positive reply: "${body.slice(0, 60)}"`,
          });
        }
      }

      if (stopKeywords.some(kw => upperBody.includes(kw))) {
        await sb.from("caregiver_activities").insert({
          agency_id: agencyId,
          caregiver_id: caregiverId,
          action_type: "opt_out",
          note: `Opt-out keyword detected: "${body.slice(0, 60)}"`,
        });
        // Pause any active sequence enrollments
        await sb
          .from("sequence_enrollments")
          .update({ status: "cancelled" })
          .eq("caregiver_id", caregiverId)
          .eq("status", "active");
      }
    }

    if (sourcedCandidateId) {
      await sb.from("sourced_candidates").update({ outreach_status: "responded" }).eq("id", sourcedCandidateId);
    }

    // Log to agent_activity_log
    await sb.from("agent_activity_log").insert({
      agency_id: agencyId,
      agent_type: "system",
      action: "inbound_message_received",
      details: `${channel} from ${fromContact}: ${body.slice(0, 80)}`,
      entity_type: caregiverId ? "caregiver" : sourcedCandidateId ? "sourced_candidate" : "unknown",
      entity_id: caregiverId || sourcedCandidateId || null,
      success: true,
    });

    // Return appropriate response
    if (channel === "sms") {
      return new Response(
        "<Response></Response>",
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("webhook-inbound error:", e);
    return new Response(
      "<Response></Response>",
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  }
});
