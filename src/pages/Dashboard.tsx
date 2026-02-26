import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, UserPlus, Megaphone, Bot, Search, Newspaper, Eye, Calendar,
  ArrowRight, TrendingUp, AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { Link } from "react-router-dom";

const funnelStages = [
  { label: "New", count: 47, color: "bg-blue-500", status: "new" },
  { label: "Contacted", count: 32, color: "bg-cyan-500", status: "contacted" },
  { label: "Intake", count: 18, color: "bg-yellow-500", status: "intake_started" },
  { label: "Enrollment", count: 12, color: "bg-orange-500", status: "enrollment_pending" },
  { label: "Authorized", count: 8, color: "bg-purple-500", status: "authorized" },
  { label: "Active", count: 24, color: "bg-green-500", status: "active" },
];

const quickActions = [
  { label: "Add Caregiver", icon: UserPlus, href: "/caregivers" },
  { label: "New Campaign", icon: Megaphone, href: "/campaign-builder" },
  { label: "Source Candidates", icon: Search, href: "/talent-sourcing" },
  { label: "Ask Halevai", icon: Bot, href: "/halevai" },
  { label: "View Pipeline", icon: Eye, href: "/caregivers" },
  { label: "Daily Briefing", icon: Newspaper, href: "/briefing" },
];

const recentActivity = [
  { action: "New caregiver Maria Gonzales added via Indeed", time: "12 min ago", type: "new" },
  { action: "Jose Rivera scored HOT (87/100) — auto SMS sent", time: "34 min ago", type: "hot" },
  { action: "Enrollment approved for Patricia Chen (Multnomah)", time: "1h ago", type: "success" },
  { action: "Stuck alert: David Kim in Intake for 9 days", time: "2h ago", type: "warning" },
  { action: "Campaign 'OR Recruitment Q1' hit $2.50 CPA target", time: "3h ago", type: "success" },
];

const Dashboard = () => {
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
                  You have <Link to="/caregivers?status=new" className="text-primary hover:underline">47 new caregivers</Link> in your pipeline, 
                  with <span className="text-primary">5 scored HOT</span> in the last 24 hours. 
                  <Link to="/enrollment" className="text-primary hover:underline"> 3 enrollments</Link> are stale (&gt;14 days). 
                  Your Oregon campaigns are converting at <span className="font-data text-primary">$18.50 CPA</span> — below your $25 target. 
                  <Link to="/competitors" className="text-primary hover:underline">FreedomCare raised pay rates</Link> in Washington County.
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
            <div className="flex items-end gap-2 h-40">
              {funnelStages.map((stage, i) => (
                <Link
                  key={stage.label}
                  to={`/caregivers?status=${stage.status}`}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <span className="font-data text-lg font-bold text-foreground">{stage.count}</span>
                  <div
                    className={`w-full ${stage.color} rounded-t-md transition-all group-hover:opacity-80`}
                    style={{ height: `${(stage.count / 50) * 100}%`, minHeight: "16px" }}
                  />
                  <span className="text-xs text-muted-foreground text-center">{stage.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards + Quick Launch */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total Spend", value: "$4,280", sub: "This month", icon: TrendingUp },
            { label: "New This Week", value: "23", sub: "Caregivers", icon: UserPlus },
            { label: "Reviews Pending", value: "4", sub: "Unresponded", icon: AlertTriangle },
            { label: "Enrollment Rate", value: "34%", sub: "→ Active", icon: CheckCircle },
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

        {/* Quick Launch */}
        <Card className="bg-card halevai-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.href}>
                  <Button variant="outline" className="w-full h-auto flex-col gap-2 py-4 border-border hover:border-primary/40 hover:bg-primary/5">
                    <a.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs">{a.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recruitment Agent Stats + Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Agent Stats */}
          <Card className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Recruitment Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sourced", value: "142" },
                  { label: "Outreach Sent", value: "89" },
                  { label: "Screens Done", value: "34" },
                  { label: "Auto-Promoted", value: "12" },
                ].map((s) => (
                  <div key={s.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="font-data text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                      a.type === "hot" ? "bg-red-500" :
                      a.type === "success" ? "bg-green-500" :
                      a.type === "warning" ? "bg-yellow-500" : "bg-primary"
                    }`} />
                    <div className="flex-1">
                      <p className="text-foreground">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
