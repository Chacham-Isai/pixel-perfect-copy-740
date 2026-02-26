import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, TrendingUp, Users, AlertTriangle, CheckCircle, Star } from "lucide-react";

const Briefing = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Newspaper className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Daily Briefing</h1>
        <span className="text-sm text-muted-foreground font-data">February 26, 2026</span>
      </div>

      <Card className="bg-card halevai-border halevai-bg-gradient">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Executive Summary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Strong day yesterday — <span className="text-primary font-bold">8 new caregivers</span> entered the pipeline, with 3 scoring HOT. 
            Oregon campaigns are outperforming targets at <span className="font-data text-primary">$18.50 CPA</span> vs your $25 target. 
            Michigan sourcing is ramping up with 12 new candidates enriched. 
            One concern: <span className="text-yellow-400">3 enrollment cases</span> are going stale (&gt;14 days) — recommend follow-up with county reps today.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: "Pipeline Health", icon: Users, items: [
            { label: "New caregivers (24h)", value: "8", color: "text-primary" },
            { label: "HOT leads identified", value: "3", color: "text-red-400" },
            { label: "Moved to next stage", value: "5", color: "text-green-400" },
            { label: "Lost/closed", value: "1", color: "text-muted-foreground" },
          ]},
          { title: "Campaign Performance", icon: TrendingUp, items: [
            { label: "Total spend yesterday", value: "$142", color: "text-foreground" },
            { label: "New clicks", value: "47", color: "text-primary" },
            { label: "Conversions", value: "3", color: "text-green-400" },
            { label: "Avg CPA", value: "$18.50", color: "text-primary" },
          ]},
          { title: "Action Items", icon: AlertTriangle, items: [
            { label: "Follow up with stale enrollments", value: "3", color: "text-yellow-400" },
            { label: "Respond to negative review", value: "1", color: "text-red-400" },
            { label: "Review sourced candidates", value: "12", color: "text-primary" },
            { label: "Approve recommendations", value: "2", color: "text-primary" },
          ]},
          { title: "Wins", icon: CheckCircle, items: [
            { label: "Patricia Chen authorized (Multnomah)", value: "✓", color: "text-green-400" },
            { label: "OR campaign under CPA target", value: "✓", color: "text-green-400" },
            { label: "5-star review from Jennifer M.", value: "★", color: "text-yellow-400" },
            { label: "2 candidates responded to outreach", value: "✓", color: "text-green-400" },
          ]},
        ].map((section) => (
          <Card key={section.title} className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <section.icon className="h-4 w-4 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-data font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Briefing;
