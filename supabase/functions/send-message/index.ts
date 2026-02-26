import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendMessagePayload {
  agency_id: string;
  channel: "sms" | "email" | "in_app";
  to: string;
  subject?: string;
  body: string;
  template?: string;
  related_type?: string;
  related_id?: string;
  user_id?: string; // required for in_app
}

async function getApiKey(sb: any, agencyId: string, keyName: string): Promise<string | null> {
  const { data } = await sb
    .from("api_keys")
    .select("key_value")
    .eq("agency_id", agencyId)
    .eq("key_name", keyName)
    .eq("connected", true)
    .maybeSingle();
  return data?.key_value || null;
}

async function sendSms(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  to: string,
  body: string
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
  });

  const data = await res.json();
  if (res.ok) {
    return { success: true, externalId: data.sid };
  }
  return { success: false, error: data.message || "Twilio error" };
}

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  htmlBody: string,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [{ type: "text/html", value: htmlBody }],
    }),
  });

  if (res.ok || res.status === 202) {
    const messageId = res.headers.get("X-Message-Id") || undefined;
    return { success: true, externalId: messageId };
  }
  const errText = await res.text();
  return { success: false, error: errText };
}

function buildBrandedHtml(body: string, config: any): string {
  const name = config?.business_name || "Your Agency";
  const color = config?.primary_color || "#00bfff";
  const logo = config?.logo_url || "";
  const phone = config?.phone || "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:${color};padding:24px;text-align:center;">
${logo ? `<img src="${logo}" alt="${name}" style="max-height:48px;margin-bottom:8px;" />` : ""}
<h1 style="color:#ffffff;margin:0;font-size:20px;">${name}</h1>
</td></tr>
<tr><td style="padding:32px 24px;color:#333;font-size:15px;line-height:1.6;">
${body.replace(/\n/g, "<br/>")}
</td></tr>
<tr><td style="padding:16px 24px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;">
${phone ? `Questions? Call us at ${phone}` : ""}<br/>© ${new Date().getFullYear()} ${name}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const payload: SendMessagePayload = await req.json();
    const { agency_id, channel, to, subject, body, template, related_type, related_id, user_id } = payload;

    if (!agency_id || !channel || !to || !body) {
      throw new Error("Missing required fields: agency_id, channel, to, body");
    }

    let status = "pending";
    let externalId: string | undefined;
    let errorMessage: string | undefined;
    let mock = false;

    if (channel === "sms") {
      const sid = await getApiKey(sb, agency_id, "twilio_account_sid");
      const token = await getApiKey(sb, agency_id, "twilio_auth_token");
      const phone = await getApiKey(sb, agency_id, "twilio_phone_number");

      if (sid && token && phone) {
        const result = await sendSms(sid, token, phone, to, body);
        if (result.success) {
          status = "sent";
          externalId = result.externalId;
        } else {
          status = "failed";
          errorMessage = result.error;
        }
      } else {
        mock = true;
        status = "pending";
        errorMessage = "Twilio not configured — connect in Settings > Integrations";
      }
    } else if (channel === "email") {
      const sgKey = await getApiKey(sb, agency_id, "sendgrid_api_key");

      // Load business config for branding
      const { data: config } = await sb
        .from("business_config")
        .select("*")
        .eq("agency_id", agency_id)
        .maybeSingle();

      if (sgKey) {
        const fromEmail = config?.email || "noreply@halevai.ai";
        const fromName = config?.business_name || "Halevai";
        const htmlBody = buildBrandedHtml(body, config);

        const result = await sendEmail(sgKey, to, subject || "Message from your agency", htmlBody, fromEmail, fromName);
        if (result.success) {
          status = "sent";
          externalId = result.externalId;
        } else {
          status = "failed";
          errorMessage = result.error;
        }
      } else {
        mock = true;
        status = "pending";
        errorMessage = "SendGrid not configured — connect in Settings > Integrations";
      }
    } else if (channel === "in_app") {
      if (!user_id) {
        throw new Error("user_id required for in_app channel");
      }
      const { error } = await sb.from("notifications").insert({
        agency_id,
        user_id,
        title: subject || "New message",
        body,
        type: template || "message",
        link: related_type === "caregiver" ? "/caregivers" : undefined,
      });
      if (error) {
        status = "failed";
        errorMessage = error.message;
      } else {
        status = "sent";
      }
    }

    // Log to message_log
    const { data: logEntry, error: logErr } = await sb.from("message_log").insert({
      agency_id,
      channel,
      to_contact: to,
      subject,
      body,
      status,
      external_id: externalId,
      template,
      related_type,
      related_id: related_id || null,
      error_message: errorMessage,
    }).select("id").single();

    const messageId = logEntry?.id || null;

    return new Response(
      JSON.stringify({ success: status === "sent", message_id: messageId, status, mock, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
