import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, CheckCircle, X, Rocket, Loader2, Package, ExternalLink, MapPin } from "lucide-react";
import { useRecommendations, useCampaignPackages } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const priorityColor = (p: string | null) => p === "high" ? "bg-red-500/20 text-red-400" : p === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400";

const Recommendations = () => {
  const { data: recs, isLoading, refetch } = useRecommendations();
  const { data: packages } = useCampaignPackages();
  const { agencyId } = useAuth();
  const all = recs || [];
  const pending = all.filter(r => r.status === "pending");
  const [launching, setLaunching] = useState<string | null>(null);
  const [dismissId, setDismissId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("not_relevant");
  const [packageDetail, setPackageDetail] = useState<any>(null);

  const handleApprove = async (rec: any) => {
    setLaunching(rec.id);
    try {
      // Create campaign from recommendation
      const { error: campErr } = await supabase.from("campaigns").insert({
        agency_id: agencyId!,
        campaign_name: rec.title,
        campaign_type: rec.category === "recruitment" ? "recruitment" : "marketing",
        status: "active",
      } as any);
      if (campErr) throw campErr;

      // Update recommendation status
      await supabase.from("halevai_recommendations").update({ status: "approved", approved_at: new Date().toISOString() } as any).eq("id", rec.id);
      toast.success("Campaign launched from recommendation!");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to launch");
    }
    setLaunching(null);
  };

  const handleDismiss = async (id: string) => {
    try {
      await supabase.from("halevai_recommendations").update({ status: "dismissed", dismissed_at: new Date().toISOString(), dismissed_reason: dismissReason } as any).eq("id", id);
      toast.success("Recommendation dismissed");
      setDismissId(null);
      refetch();
    } catch (e: any) {
      toast.error("Failed to dismiss");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Recommendations</h1>
          </div>
          <Badge className="bg-primary/20 text-primary font-data">{pending.length} pending</Badge>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({all.filter(r => r.status === "approved").length})</TabsTrigger>
            <TabsTrigger value="packages"><Package className="h-3 w-3 mr-1" />Packages ({(packages || []).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}</div> : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <Card key={r.id} className="bg-card halevai-border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
                            <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{r.category}</Badge>
                          </div>
                          <h3 className="font-semibold text-foreground">{r.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                          {r.reasoning && <p className="text-xs text-muted-foreground/70 mt-1 italic">{r.reasoning}</p>}
                          <p className="text-xs text-primary font-data mt-2">Estimated Impact: {r.impact_estimate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => handleApprove(r)} disabled={launching === r.id}>
                          {launching === r.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Rocket className="h-3 w-3 mr-1" />} Approve & Launch
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setDismissId(r.id)}>
                          <X className="h-3 w-3 mr-1" /> Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pending.length === 0 && <p className="text-center text-muted-foreground py-8">No pending recommendations</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <div className="space-y-3">
              {all.filter(r => r.status === "approved").map((r) => (
                <Card key={r.id} className="bg-card halevai-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-green-500/20 text-green-400">Approved</Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{r.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground">{r.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="packages">
            <div className="space-y-3">
              {(packages || []).map((pkg: any) => (
                <Card key={pkg.id} className="bg-card halevai-border cursor-pointer hover:border-primary/30" onClick={() => setPackageDetail(pkg)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className={pkg.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>{pkg.status}</Badge>
                        <span className="text-sm text-foreground ml-2">
                          {Array.isArray(pkg.platforms) ? (pkg.platforms as string[]).join(", ") : "Multi-platform"}
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(packages || []).length === 0 && <p className="text-center text-muted-foreground py-8">No campaign packages yet</p>}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dismiss Dialog */}
        <Dialog open={!!dismissId} onOpenChange={() => setDismissId(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Dismiss Recommendation</DialogTitle></DialogHeader>
            <Select value={dismissReason} onValueChange={setDismissReason}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_relevant">Not relevant</SelectItem>
                <SelectItem value="already_doing">Already doing this</SelectItem>
                <SelectItem value="budget_constraint">Budget constraint</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => dismissId && handleDismiss(dismissId)}>Confirm Dismiss</Button>
          </DialogContent>
        </Dialog>

        {/* Package Detail */}
        <Dialog open={!!packageDetail} onOpenChange={() => setPackageDetail(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle className="text-foreground">Campaign Package</DialogTitle></DialogHeader>
            {packageDetail && (
              <Tabs defaultValue="overview">
                <TabsList className="bg-secondary/50"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="tracking">Tracking</TabsTrigger><TabsTrigger value="guide">Launch Guide</TabsTrigger></TabsList>
                <TabsContent value="overview">
                  <div className="space-y-3 mt-3">
                    <div><span className="text-xs text-muted-foreground">Platforms</span><p className="text-sm text-foreground">{Array.isArray(packageDetail.platforms) ? (packageDetail.platforms as string[]).join(", ") : "—"}</p></div>
                    <div><span className="text-xs text-muted-foreground">Status</span><Badge className="ml-2">{packageDetail.status}</Badge></div>
                    {packageDetail.content && typeof packageDetail.content === "object" && Object.entries(packageDetail.content as Record<string, any>).map(([k, v]: [string, any]) => (
                      <div key={k}><span className="text-xs text-primary capitalize">{k}</span><p className="text-xs text-muted-foreground">{typeof v === "object" ? JSON.stringify(v) : String(v)}</p></div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="tracking">
                  <div className="space-y-3 mt-3">
                    {packageDetail.utm_params && <div><span className="text-xs text-muted-foreground">UTM Parameters</span><pre className="text-xs text-foreground font-data bg-secondary/30 p-2 rounded mt-1">{JSON.stringify(packageDetail.utm_params, null, 2)}</pre></div>}
                    {packageDetail.tracking_urls && <div><span className="text-xs text-muted-foreground">Tracking URLs</span><pre className="text-xs text-foreground font-data bg-secondary/30 p-2 rounded mt-1">{JSON.stringify(packageDetail.tracking_urls, null, 2)}</pre></div>}
                  </div>
                </TabsContent>
                <TabsContent value="guide">
                  <div className="space-y-3 mt-3 text-sm text-muted-foreground">
                    <p>1. Copy the platform-specific ad content from the Overview tab</p>
                    <p>2. Go to each platform's ad manager and create a new campaign</p>
                    <p>3. Paste the headlines, descriptions, and CTAs</p>
                    <p>4. Use the UTM-tagged tracking URLs from the Tracking tab</p>
                    <p>5. Set your budget and targeting based on campaign details</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Recommendations;
