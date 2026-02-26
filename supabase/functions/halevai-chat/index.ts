import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Get agency_id
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const agencyId = membership?.agency_id;
    if (!agencyId) throw new Error("No agency found for user");

    const { messages } = await req.json();

    // Fetch live agency data in parallel for context
    const [
      agencyRes,
      caregiversRes,
      hotLeadsRes,
      campaignsRes,
      competitorsRes,
      reviewsRes,
      contentRes,
      landingPagesRes,
      sourcingRes,
      automationsRes,
      recsRes,
      activeCampaignsRes,
      enrollmentRes,
      staleRes,
      topSourceRes,
      revenueRes,
      sourcedCandidatesRes,
      phoneScreensRes,
      agentActivityRes,
      apiKeysRes,
      messageLogRes,
      conversationThreadsRes,
      inboundMessagesRes,
      sequenceEnrollmentsRes,
    ] = await Promise.all([
      supabase.from("agencies").select("*").eq("id", agencyId).single(),
      supabase.from("caregivers").select("id, full_name, status, lead_score, source, state, county, created_at").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(50),
      supabase.from("caregivers").select("id, full_name, lead_score, status, phone, created_at").eq("agency_id", agencyId).in("status", ["new", "contacted"]).order("lead_score", { ascending: false }).limit(10),
      supabase.from("campaigns").select("*").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(10),
      supabase.from("competitors").select("*").eq("agency_id", agencyId),
      supabase.from("reviews").select("*").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(20),
      supabase.from("content_posts").select("*").eq("agency_id", agencyId).order("scheduled_date", { ascending: false }).limit(10),
      supabase.from("landing_pages").select("id, title, slug, views, form_submissions, conversion_rate, published").eq("agency_id", agencyId),
      supabase.from("sourcing_campaigns").select("*").eq("agency_id", agencyId).limit(5),
      supabase.from("automation_configs").select("*").eq("agency_id", agencyId),
      supabase.from("halevai_recommendations").select("*").eq("agency_id", agencyId).eq("status", "pending").order("created_at", { ascending: false }).limit(5),
      supabase.from("campaigns").select("id, campaign_name, spend, clicks, conversions, cost_per_conversion, status").eq("agency_id", agencyId).eq("status", "active"),
      supabase.from("caregivers").select("id, full_name, status, enrollment_started_at").eq("agency_id", agencyId).in("status", ["intake_started", "enrollment_pending"]),
      supabase.from("caregivers").select("id, full_name, status, last_contacted_at").eq("agency_id", agencyId).in("status", ["new", "contacted"]).order("last_contacted_at", { ascending: true }).limit(10),
      supabase.from("caregivers").select("source").eq("agency_id", agencyId),
      supabase.from("caregivers").select("monthly_revenue").eq("agency_id", agencyId).eq("status", "active"),
      supabase.from("sourced_candidates").select("outreach_status").eq("agency_id", agencyId),
      supabase.from("phone_screens").select("status, ai_score, ai_recommendation, created_at").eq("agency_id", agencyId),
      supabase.from("agent_activity_log").select("agent_type, action, details, created_at").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(5),
      supabase.from("api_keys").select("key_name, connected").eq("agency_id", agencyId),
      supabase.from("message_log").select("channel, status, created_at").eq("agency_id", agencyId),
      // NEW: Additional context
      supabase.from("conversation_threads").select("id, status, unread_count, channel, last_message_at").eq("agency_id", agencyId),
      supabase.from("inbound_messages").select("id, channel, from_contact, body, created_at, read").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(10),
      supabase.from("sequence_enrollments").select("status, sequence_id, started_at, completed_at").eq("agency_id", agencyId),
    ]);

    const agency = agencyRes.data;
    const caregivers = caregiversRes.data || [];
    const hotLeads = hotLeadsRes.data || [];
    const campaigns = campaignsRes.data || [];
    const competitors = competitorsRes.data || [];
    const reviews = reviewsRes.data || [];
    const content = contentRes.data || [];
    const landingPages = landingPagesRes.data || [];
    const sourcing = sourcingRes.data || [];
    const automations = automationsRes.data || [];
    const recommendations = recsRes.data || [];
    const activeCampaigns = activeCampaignsRes.data || [];
    const enrollments = enrollmentRes.data || [];
    const staleLeads = staleRes.data || [];
    const allSources = topSourceRes.data || [];
    const activeRevenue = revenueRes.data || [];
    const sourcedCandidates = sourcedCandidatesRes.data || [];
    const phoneScreensData = phoneScreensRes.data || [];
    const agentActivity = agentActivityRes.data || [];
    const apiKeysData = apiKeysRes.data || [];
    const messageLogData = messageLogRes.data || [];
    const conversationThreads = conversationThreadsRes.data || [];
    const recentInbound = inboundMessagesRes.data || [];
    const sequenceEnrollments = sequenceEnrollmentsRes.data || [];

    // Compute stats
    const totalCaregivers = caregivers.length;
    const statusCounts: Record<string, number> = {};
    caregivers.forEach(c => { statusCounts[c.status || "unknown"] = (statusCounts[c.status || "unknown"] || 0) + 1; });
    
    const sourceCounts: Record<string, number> = {};
    allSources.forEach(c => { sourceCounts[c.source || "unknown"] = (sourceCounts[c.source || "unknown"] || 0) + 1; });
    const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];

    const totalRevenue = activeRevenue.reduce((sum, c) => sum + (c.monthly_revenue || 0), 0);
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "N/A";

    const totalSpend = activeCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
    const totalConversions = activeCampaigns.reduce((s, c) => s + (c.conversions || 0), 0);
    const avgCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "N/A";

    // NEW: Recruitment & messaging stats
    const outreachCounts: Record<string, number> = {};
    sourcedCandidates.forEach(c => { outreachCounts[c.outreach_status || "unknown"] = (outreachCounts[c.outreach_status || "unknown"] || 0) + 1; });

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recentScreens = phoneScreensData.filter(s => s.created_at && s.created_at > sevenDaysAgo);
    const completedScreens = recentScreens.filter(s => s.status === "completed");
    const avgScreenScore = completedScreens.length > 0 ? Math.round(completedScreens.reduce((s, c) => s + (c.ai_score || 0), 0) / completedScreens.length) : 0;
    const advancedCount = completedScreens.filter(s => s.ai_recommendation === "advance").length;

    const connectedIntegrations = apiKeysData.filter(k => k.connected).map(k => k.key_name);
    const disconnectedIntegrations = apiKeysData.filter(k => !k.connected).map(k => k.key_name);

    const recentMessages = messageLogData.filter(m => m.created_at && m.created_at > sevenDaysAgo);
    const msgByChannel: Record<string, number> = {};
    recentMessages.forEach(m => { msgByChannel[m.channel] = (msgByChannel[m.channel] || 0) + 1; });
    const failedMsgCount = recentMessages.filter(m => m.status === "failed").length;

    // NEW: Conversation & sequence stats
    const totalUnread = conversationThreads.reduce((s: number, t: any) => s + (t.unread_count || 0), 0);
    const openThreads = conversationThreads.filter((t: any) => t.status === "open").length;
    const threadsByChannel: Record<string, number> = {};
    conversationThreads.forEach((t: any) => { threadsByChannel[t.channel] = (threadsByChannel[t.channel] || 0) + 1; });

    const unreadInbound = recentInbound.filter((m: any) => !m.read).length;
    const recentInboundPreview = recentInbound.slice(0, 5).map((m: any) => 
      `${m.from_contact} (${m.channel}): "${(m.body || "").slice(0, 60)}..." [${m.created_at}]`
    );

    const seqActive = sequenceEnrollments.filter((e: any) => e.status === "active").length;
    const seqCompleted = sequenceEnrollments.filter((e: any) => e.status === "completed").length;
    const seqPaused = sequenceEnrollments.filter((e: any) => e.status === "paused").length;
    const seqTotal = sequenceEnrollments.length;

    const systemPrompt = `You are Halevai AI, an expert home care agency growth strategist for "${agency?.name || "this agency"}".
You operate across states: ${agency?.states?.join(", ") || "unknown"}.

## YOUR ROLE
- You are a proactive, data-driven growth advisor for home care agencies
- You provide specific, actionable recommendations based on real-time data
- You speak confidently with numbers and suggest concrete next steps
- Use markdown formatting: **bold** for emphasis, bullet points for lists, headers for sections

## LIVE AGENCY DATA (updated in real-time)

### Pipeline Summary
- Total caregivers in pipeline: ${totalCaregivers}
- Status breakdown: ${JSON.stringify(statusCounts)}
- Top lead source: ${topSource ? `${topSource[0]} (${topSource[1]} leads)` : "N/A"}
- Hot leads (new/contacted, sorted by score): ${hotLeads.map(l => `${l.full_name} (score: ${l.lead_score || "unscored"})`).join(", ") || "None"}
- Stale leads needing follow-up: ${staleLeads.map(l => `${l.full_name} (last contact: ${l.last_contacted_at || "never"})`).join(", ") || "None"}

### Active Enrollments
${enrollments.map(e => `- ${e.full_name}: ${e.status} (started: ${e.enrollment_started_at || "unknown"})`).join("\n") || "- None in progress"}

### Campaign Performance
- Active campaigns: ${activeCampaigns.length}
- Total spend: $${totalSpend.toFixed(2)}
- Total conversions: ${totalConversions}
- Average CPA: $${avgCPA}
${activeCampaigns.map(c => `- ${c.campaign_name}: $${c.spend} spent, ${c.conversions} conversions, $${c.cost_per_conversion?.toFixed(2) || "N/A"} CPA`).join("\n")}

### Competitors
${competitors.map(c => `- ${c.name}: ${c.avg_rating}★ (${c.review_count} reviews), pay $${c.pay_rate_min}-$${c.pay_rate_max}/hr`).join("\n") || "- No competitor data yet"}

### Reviews & Reputation
- Average rating: ${avgRating}
- Total reviews: ${reviews.length}
- Unresponded reviews: ${reviews.filter(r => !r.responded).length}

### Landing Pages
${landingPages.map(lp => `- ${lp.title}: ${lp.views} views, ${lp.form_submissions} submissions, ${lp.conversion_rate}% CVR`).join("\n") || "- No landing pages yet"}

### Content Calendar
- Scheduled posts: ${content.filter(c => c.status === "scheduled").length}
- Draft posts: ${content.filter(c => c.status === "draft").length}

### Revenue
- Active caregivers generating revenue: ${activeRevenue.length}
- Total monthly revenue: $${totalRevenue.toFixed(2)}

### Sourcing Campaigns
${sourcing.map(s => `- ${s.name}: ${s.candidates_found} found, ${s.candidates_enriched} enriched, status: ${s.status}`).join("\n") || "- No sourcing campaigns"}

### Sourced Candidates Pipeline
- Total sourced: ${sourcedCandidates.length}
- By outreach status: ${JSON.stringify(outreachCounts)}

### AI Phone Screening (Last 7 Days)
- Screens completed: ${completedScreens.length}
- Average AI score: ${avgScreenScore}/100
- Candidates recommended to advance: ${advancedCount}

### Recent Agent Activity
${agentActivity.map(a => `- [${a.agent_type}] ${a.action}: ${a.details || "no details"} (${a.created_at})`).join("\n") || "- No recent agent activity"}

### Integrations Connected
- Connected: ${connectedIntegrations.length > 0 ? connectedIntegrations.join(", ") : "None"}
- Not configured: ${disconnectedIntegrations.length > 0 ? disconnectedIntegrations.join(", ") : "All connected"}

### Messaging (Last 7 Days)
- Messages by channel: ${JSON.stringify(msgByChannel)}
- Failed messages: ${failedMsgCount}

### Inbox / Conversations
- Open threads: ${openThreads}
- Total unread messages: ${totalUnread}
- Threads by channel: ${JSON.stringify(threadsByChannel)}
- Unread inbound replies: ${unreadInbound}
${recentInboundPreview.length > 0 ? `- Recent replies:\n${recentInboundPreview.map(r => `  - ${r}`).join("\n")}` : "- No recent inbound replies"}

### Sequence Enrollments
- Total enrollments: ${seqTotal}
- Active: ${seqActive}, Completed: ${seqCompleted}, Paused: ${seqPaused}
${seqTotal > 0 ? `- Completion rate: ${seqTotal > 0 ? Math.round((seqCompleted / seqTotal) * 100) : 0}%` : ""}

### Automations
- Active automations: ${automations.filter(a => a.active).length}/${automations.length}

### Pending AI Recommendations
${recommendations.map(r => `- [${r.priority}] ${r.title}: ${r.description}`).join("\n") || "- No pending recommendations"}

## INSTRUCTIONS
- Always reference specific numbers from the data above
- When suggesting campaigns, include target geography, messaging, and budget
- When discussing competitors, reference their actual pay rates and ratings
- Proactively flag issues: stale leads, underperforming campaigns, competitor moves
- Mention integration status when relevant (e.g. "Connect Twilio to start sending SMS")
- Reference recruitment agent metrics when discussing sourcing
- Suggest actionable next steps the user can take right now
- Keep responses focused and under 400 words unless asked for detail`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("halevai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
