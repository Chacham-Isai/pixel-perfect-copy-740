import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, TrendingUp, Users, AlertTriangle, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useCaregivers, useCampaigns, useReviews, useSourcedCandidates, useRecommendations } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

const Briefing = () => {
  const { data: caregivers, isLoading } = useCaregivers();
  const { data: campaigns } = useCampaigns();
  const { data: reviews } = useReviews();
  const { data: sourced } = useSourcedCandidates();
  const { data: recs } = useRecommendations();
  const { agencyId, user } = useAuth();
  const [generating, setGenerating] = useState(false);

  const all = caregivers || [];
  const active = campaigns?.filter(c => c.status === "active") || [];
  const newToday = all.filter(c => {
    const d = new Date(c.created_at || "");
    return Date.now() - d.getTime() < 86400000;
  });
  const hotLeads = newToday.filter(c => c.lead_tier === "HOT");
  const totalConversions = active.reduce((s, c) => s + (c.conversions || 0), 0);
  const avgCPA = totalConversions > 0 ? (active.reduce((s, c) => s + (c.spend || 0), 0) / totalConversions).toFixed(2) : "0";
  const staleEnrollments = all.filter(c => {
    if (!["intake_started", "enrollment_pending"].includes(c.status || "")) return false;
    const ref = c.enrollment_started_at || c.created_at;
    if (!ref) return false;
    return (Date.now() - new Date(ref).getTime()) > 14 * 86400000;
  });
  const unrespondedReviews = (reviews || []).filter(r => !r.responded && (r.rating || 5) <= 3);
  const pendingRecs = (recs || []).filter(r => r.status === "pending");

  const handleGenerateBriefing = async () => {
    if (!agencyId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-briefing", {
        body: { agencyId, userId: user?.id },
      });
      if (error) throw error;
      toast.success("Briefing generated and saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate briefing");
    }
    setGenerating(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Daily Briefing</h1>
            <span className="text-sm text-muted-foreground font-data">{format(new Date(), "MMMM d, yyyy")}</span>
          </div>
          <Button size="sm" onClick={handleGenerateBriefing} disabled={generating} className="bg-primary text-primary-foreground">
            {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-1" />Save Briefing</>}
          </Button>
        </div>

        {isLoading ? <Skeleton className="h-32" /> : (
          <Card className="bg-card halevai-border halevai-bg-gradient">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Executive Summary</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-primary font-bold">{newToday.length} new caregivers</span> entered the pipeline today, with {hotLeads.length} scoring HOT.
                Campaigns are converting at <span className="font-data text-primary">${avgCPA} CPA</span>.
                {staleEnrollments.length > 0 && <> <span className="text-yellow-400">{staleEnrollments.length} enrollment cases</span> are going stale (&gt;14 days).</>}
                {unrespondedReviews.length > 0 && <> {unrespondedReviews.length} negative review{unrespondedReviews.length > 1 ? "s" : ""} need{unrespondedReviews.length === 1 ? "s" : ""} a response.</>}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Pipeline Health", icon: Users, items: [
              { label: "New caregivers (24h)", value: String(newToday.length), color: "text-primary" },
              { label: "HOT leads identified", value: String(hotLeads.length), color: "text-red-400" },
              { label: "Active caregivers", value: String(all.filter(c => c.status === "active").length), color: "text-green-400" },
              { label: "Total in pipeline", value: String(all.length), color: "text-foreground" },
            ]},
            { title: "Campaign Performance", icon: TrendingUp, items: [
              { label: "Active campaigns", value: String(active.length), color: "text-foreground" },
              { label: "Total conversions", value: String(totalConversions), color: "text-green-400" },
              { label: "Avg CPA", value: `$${avgCPA}`, color: "text-primary" },
              { label: "Sourced candidates", value: String(sourced?.length || 0), color: "text-primary" },
            ]},
            { title: "Action Items", icon: AlertTriangle, items: [
              { label: "Stale enrollments (>14d)", value: String(staleEnrollments.length), color: staleEnrollments.length > 0 ? "text-yellow-400" : "text-green-400" },
              { label: "Negative reviews unresponded", value: String(unrespondedReviews.length), color: unrespondedReviews.length > 0 ? "text-red-400" : "text-green-400" },
              { label: "Pending recommendations", value: String(pendingRecs.length), color: "text-primary" },
              { label: "Outreach responses", value: String(sourced?.filter(s => s.outreach_status === "responded").length || 0), color: "text-primary" },
            ]},
            { title: "Wins", icon: CheckCircle, items: [
              ...(hotLeads.length > 0 ? [{ label: `${hotLeads[0]?.full_name} scored HOT`, value: "✓", color: "text-green-400" }] : []),
              ...(Number(avgCPA) > 0 && Number(avgCPA) < 25 ? [{ label: "Campaigns under CPA target", value: "✓", color: "text-green-400" }] : []),
              { label: `${all.filter(c => c.status === "active").length} active caregivers generating revenue`, value: "✓", color: "text-green-400" },
              { label: `${(sourced || []).length} candidates sourced`, value: "✓", color: "text-green-400" },
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
};

export default Briefing;
