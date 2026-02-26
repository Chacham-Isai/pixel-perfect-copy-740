import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserPlus, Megaphone, Bot, Search, Newspaper, Eye, Calendar,
  ArrowRight, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign,
  MessageSquare, Mail, Phone, Plug, Check, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCaregivers, useCampaigns, useReviews, useActivityLog, useSourcedCandidates, usePayRateIntel, useMessageLog, useApiKeys, usePhoneScreens } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

const quickActions = [
  { label: "Add Caregiver", desc: "Add a new lead to your pipeline", icon: UserPlus, href: "/caregivers" },
  { label: "New Campaign", desc: "Launch a recruitment or marketing campaign", icon: Megaphone, href: "/campaign-builder" },
  { label: "Source Candidates", desc: "Find caregivers from job boards & social", icon: Search, href: "/talent-sourcing" },
  { label: "Ask Halevai", desc: "Get AI strategy & data analysis", icon: Bot, href: "/halevai" },
  { label: "View Pipeline", desc: "See all caregivers by stage", icon: Eye, href: "/caregivers" },
  { label: "Daily Briefing", desc: "Your morning performance report", icon: Newspaper, href: "/briefing" },
];

const funnelConfig = [
  { label: "New", status: "new", color: "bg-blue-500" },
  { label: "Contacted", status: "contacted", color: "bg-cyan-500" },
  { label: "Intake", status: "intake_started", color: "bg-yellow-500" },
  { label: "Enrollment", status: "enrollment_pending", color: "bg-orange-500" },
  { label: "Authorized", status: "authorized", color: "bg-purple-500" },
  { label: "Active", status: "active", color: "bg-green-500" },
];

const integrations = [
  { key: "twilio_account_sid", label: "Twilio", icon: Phone },
  { key: "sendgrid_api_key", label: "SendGrid", icon: Mail },
  { key: "clay_api_key", label: "Clay", icon: Search },
  { key: "ghl_api_key", label: "GHL", icon: Users },
  { key: "bland_ai_api_key", label: "Bland AI", icon: Bot },
];

const Dashboard = () => {
  usePageTitle("Dashboard");
  const { data: caregivers, isLoading: loadingCaregivers } = useCaregivers();
  const { data: campaigns } = useCampaigns();
  const { data: reviews } = useReviews();
  const { data: activity } = useActivityLog();
  const { data: sourced } = useSourcedCandidates();
  const { data: rateIntel } = usePayRateIntel();
  const { data: messages } = useMessageLog(100);
  const { data: apiKeys } = useApiKeys();
  const { data: phoneScreens } = usePhoneScreens();

  const activeCampaigns = campaigns?.filter(c => c.status === "active") || [];
  const totalSpend = activeCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const newThisWeek = caregivers?.filter(c => new Date(c.created_at || "").getTime() > weekAgo).length || 0;
  const unrespondedReviews = reviews?.filter(r => !r.responded).length || 0;
  const activeCount = caregivers?.filter(c => c.status === "active").length || 0;
  const totalCount = caregivers?.length || 1;
  const enrollmentRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  // Messaging stats
  const recentMessages = messages?.filter(m => new Date(m.created_at || "").getTime() > weekAgo) || [];
  const smsSent = recentMessages.filter(m => m.channel === "sms" && m.status !== "failed").length;
  const emailSent = recentMessages.filter(m => m.channel === "email" && m.status !== "failed").length;
  const failedCount = recentMessages.filter(m => m.status === "failed").length;

  // Recruitment agent stats (this week)
  const sourcedThisWeek = sourced?.filter(s => new Date(s.created_at || "").getTime() > weekAgo).length || 0;
  const outreachSent = sourced?.filter(s => (s.outreach_status === "sent" || s.outreach_status === "responded") && new Date(s.updated_at || "").getTime() > weekAgo).length || 0;
  const screensDone = phoneScreens?.filter(s => s.status === "completed" && new Date(s.created_at || "").getTime() > weekAgo).length || 0;
  const autoPromoted = sourced?.filter(s => s.promoted_to_caregiver_id && new Date(s.updated_at || "").getTime() > weekAgo).length || 0;

  // Integration status
  const connectedKeys = new Set(apiKeys?.filter(k => k.connected).map(k => k.key_name) || []);

  const funnelStages = funnelConfig.map(f => ({
    ...f,
    count: caregivers?.filter(c => c.status === f.status).length || 0,
  }));
  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1);

  const activityTypeMap: Record<string, string> = {
    caregiver_added: "new", lead_scored: "hot", enrollment_approved: "success",
    stuck_alert: "warning", campaign_milestone: "success",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* AI Summary */}
        <Card className="bg-card halevai-border">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">Good morning! Here's your daily snapshot:</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  You have <Link to="/caregivers" className="text-primary hover:underline">{caregivers?.filter(c => c.status === "new").length || 0} new caregivers</Link> in your pipeline
                  {newThisWeek > 0 && <>, with <span className="text-primary">{newThisWeek} added this week</span></>}. 
                  Your campaigns are spending <span className="font-data text-primary">${totalSpend.toLocaleString()}</span> total. 
                  {unrespondedReviews > 0 && <><Link to="/reviews" className="text-primary hover:underline"> {unrespondedReviews} reviews</Link> need responses. </>}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  💡 Tip: Use the quick launch buttons below to take action, or ask <Link to="/halevai" className="text-primary hover:underline">Halevai AI</Link> for personalized strategy advice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card className="bg-card halevai-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Caregiver Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCaregivers ? (
              <div className="flex gap-2 h-40">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="flex-1 h-full" />)}</div>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {funnelStages.map((stage) => (
                  <Link key={stage.label} to={`/caregivers`} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="font-data text-lg font-bold text-foreground">{stage.count}</span>
                    <div
                      className={`w-full ${stage.color} rounded-t-md transition-all group-hover:opacity-80`}
                      style={{ height: `${(stage.count / maxFunnel) * 100}%`, minHeight: "16px" }}
                    />
                    <span className="text-xs text-muted-foreground text-center">{stage.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, sub: "Active campaigns", icon: TrendingUp },
            { label: "New This Week", value: String(newThisWeek), sub: "Caregivers", icon: UserPlus },
            { label: "Recommended Rate", value: rateIntel ? `$${Number(rateIntel.recommended_rate).toFixed(0)}/hr` : "—", sub: rateIntel ? `Medicaid: $${Number(rateIntel.medicaid_reimbursement_rate).toFixed(0)}/hr` : "Run analysis", icon: DollarSign },
            { label: "Enrollment Rate", value: `${enrollmentRate}%`, sub: "→ Active", icon: CheckCircle },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card halevai-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="font-data text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">{kpi.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Messaging Stats + Integration Status */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messaging This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="font-data text-xl font-bold text-foreground">{smsSent + emailSent}</div>
                  <div className="text-xs text-muted-foreground">Total Sent</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="font-data text-xl font-bold text-foreground">{smsSent}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Phone className="h-3 w-3" /> SMS</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="font-data text-xl font-bold text-foreground">{emailSent}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Mail className="h-3 w-3" /> Email</div>
                </div>
              </div>
              {failedCount > 0 && (
                <p className="text-xs text-destructive mt-2">{failedCount} failed message{failedCount > 1 ? "s" : ""}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plug className="h-5 w-5 text-primary" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {integrations.map((int) => {
                  const connected = connectedKeys.has(int.key);
                  return (
                    <Link key={int.key} to="/settings" className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 hover:bg-secondary transition-colors">
                      <int.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-foreground">{int.label}</span>
                      {connected ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground/40" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Launch */}
        <Card className="bg-card halevai-border">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Quick Launch</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.href}>
                  <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 border-border hover:border-primary/40 hover:bg-primary/5">
                    <a.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{a.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{a.desc}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Stats + Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Recruitment Agents <Badge className="bg-primary/20 text-primary text-[10px] ml-1">This Week</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sourced", value: String(sourcedThisWeek) },
                  { label: "Outreach Sent", value: String(outreachSent) },
                  { label: "Screens Done", value: String(screensDone) },
                  { label: "Auto-Promoted", value: String(autoPromoted) },
                ].map((s) => (
                  <div key={s.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="font-data text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(activity || []).slice(0, 5).map((a) => {
                  const type = activityTypeMap[a.action] || "new";
                  const time = a.created_at ? new Date(a.created_at) : new Date();
                  const mins = Math.floor((Date.now() - time.getTime()) / 60000);
                  const timeStr = mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
                  return (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        type === "hot" ? "bg-red-500" : type === "success" ? "bg-green-500" : type === "warning" ? "bg-yellow-500" : "bg-primary"
                      }`} />
                      <div className="flex-1">
                        <p className="text-foreground">{a.details || a.action}</p>
                        <p className="text-xs text-muted-foreground">{timeStr}</p>
                      </div>
                    </div>
                  );
                })}
                {(!activity || activity.length === 0) && <p className="text-sm text-muted-foreground">No recent activity</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
