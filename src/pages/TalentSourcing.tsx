import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, UserPlus, Loader2, Play, Pause, Phone } from "lucide-react";
import { useSourcingCampaigns, useSourcedCandidates } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const TalentSourcing = () => {
  const { data: campaigns, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useSourcingCampaigns();
  const { data: candidates, isLoading: loadingCandidates, refetch: refetchCandidates } = useSourcedCandidates();
  const { agencyId } = useAuth();
  const allCampaigns = campaigns || [];
  const allCandidates = candidates || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", state: "", county: "", language: "english", max: "50" });
  const [promoting, setPromoting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!agencyId || !form.name.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("sourcing_campaigns").insert({
      agency_id: agencyId, name: form.name, state: form.state || null,
      county: form.county || null, target_language: form.language,
      max_candidates: Number(form.max) || 50, status: "active",
    } as any);
    if (error) toast.error("Failed to create");
    else { toast.success("Sourcing campaign created!"); setCreateOpen(false); setForm({ name: "", state: "", county: "", language: "english", max: "50" }); refetchCampaigns(); }
    setCreating(false);
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "paused" : "active";
    await supabase.from("sourcing_campaigns").update({ status: next } as any).eq("id", id);
    toast.success(`Campaign ${next}`);
    refetchCampaigns();
  };

  const handlePromote = async (candidate: any) => {
    if (!agencyId) return;
    setPromoting(candidate.id);
    try {
      const { data: cg, error } = await supabase.from("caregivers").insert({
        agency_id: agencyId, full_name: candidate.full_name,
        phone: candidate.phone || null, email: candidate.email || null,
        state: candidate.state || null, county: candidate.county || null,
        city: candidate.city || null, languages_spoken: candidate.languages_spoken || [],
        source: "sourcing" as any, status: "new" as any,
        years_caregiving_experience: candidate.years_experience || null,
      } as any).select("id").single();
      if (error) throw error;
      await supabase.from("sourced_candidates").update({ promoted_to_caregiver_id: cg.id, outreach_status: "promoted" } as any).eq("id", candidate.id);
      toast.success(`${candidate.full_name} promoted to caregiver pipeline!`);
      refetchCandidates();
    } catch (e: any) {
      toast.error(e.message || "Failed to promote");
    }
    setPromoting(null);
  };

  const handleOutreach = async (id: string) => {
    await supabase.from("sourced_candidates").update({ outreach_status: "sent" } as any).eq("id", id);
    toast.success("Outreach marked as sent");
    refetchCandidates();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Talent Sourcing</h1>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Create Sourcing Campaign</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Oregon Q1 Sourcing" className="bg-secondary border-border" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Oregon" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>County</Label><Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} placeholder="Washington" className="bg-secondary border-border" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Language</Label>
                    <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="vietnamese">Vietnamese</SelectItem><SelectItem value="chinese">Chinese</SelectItem><SelectItem value="spanish">Spanish</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Max Candidates</Label><Input type="number" value={form.max} onChange={e => setForm(f => ({ ...f, max: e.target.value }))} className="bg-secondary border-border" /></div>
                </div>
                <Button onClick={handleCreate} disabled={creating || !form.name.trim()} className="w-full bg-primary text-primary-foreground">
                  {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Sourced", value: allCandidates.length },
            { label: "Outreach Sent", value: allCandidates.filter(c => c.outreach_status !== "not_started").length },
            { label: "Responded", value: allCandidates.filter(c => c.outreach_status === "responded").length },
            { label: "Promoted", value: allCandidates.filter(c => c.promoted_to_caregiver_id).length },
          ].map(s => (
            <Card key={s.label} className="bg-card halevai-border">
              <CardContent className="p-4 text-center">
                <div className="font-data text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="campaigns">Campaigns ({allCampaigns.length})</TabsTrigger>
            <TabsTrigger value="candidates">Candidates ({allCandidates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4 space-y-4">
            {loadingCampaigns ? <Skeleton className="h-48" /> : allCampaigns.map((sc) => (
              <Card key={sc.id} className="bg-card halevai-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{sc.name}</h3>
                      <p className="text-xs text-muted-foreground">{sc.county || "Statewide"}, {sc.state} • {sc.target_language} • {sc.schedule}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={sc.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>{sc.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(sc.id, sc.status || "draft")}>
                        {sc.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="font-data text-lg font-bold text-foreground">{sc.candidates_found || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Found</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="font-data text-lg font-bold text-primary">{sc.candidates_enriched || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Enriched</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="font-data text-lg font-bold text-green-400">{sc.candidates_pushed || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Pushed to Pipeline</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loadingCampaigns && allCampaigns.length === 0 && <p className="text-center text-muted-foreground py-8">No sourcing campaigns. Create one to start finding caregivers.</p>}
          </TabsContent>

          <TabsContent value="candidates" className="mt-4">
            {loadingCandidates ? <Skeleton className="h-48" /> : (
              <Card className="bg-card halevai-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Candidate</TableHead><TableHead>Platform</TableHead><TableHead>Location</TableHead>
                        <TableHead>Match</TableHead><TableHead>Current Employer</TableHead><TableHead>Pay</TableHead><TableHead>Outreach</TableHead><TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCandidates.map((c) => (
                        <TableRow key={c.id} className="border-border hover:bg-secondary/30">
                          <TableCell>
                            <div>
                              <span className="font-medium text-foreground">{c.full_name}</span>
                              {c.phone && <p className="text-[10px] text-muted-foreground">{c.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{c.source_platform || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{c.county || "—"}, {c.state || "—"}</TableCell>
                          <TableCell><span className={`font-data font-bold ${(c.match_score || 0) >= 80 ? "text-green-400" : (c.match_score || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>{c.match_score ?? "—"}</span></TableCell>
                          <TableCell className="text-muted-foreground">{c.current_employer || "—"}</TableCell>
                          <TableCell className="font-data text-muted-foreground">{c.current_pay_rate ? `$${c.current_pay_rate}/hr` : "—"}</TableCell>
                          <TableCell>
                            <Badge className={
                              c.outreach_status === "responded" ? "bg-green-500/20 text-green-400" :
                              c.outreach_status === "sent" ? "bg-blue-500/20 text-blue-400" :
                              c.outreach_status === "promoted" ? "bg-purple-500/20 text-purple-400" :
                              "bg-secondary text-muted-foreground"
                            }>{(c.outreach_status || "not started").replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!c.promoted_to_caregiver_id && (
                                <>
                                  {c.outreach_status === "not_started" && (
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleOutreach(c.id)}>
                                      <Phone className="h-3 w-3 mr-1" />Outreach
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" className="text-xs h-7 text-primary border-primary/30" onClick={() => handlePromote(c)} disabled={promoting === c.id}>
                                    {promoting === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><UserPlus className="h-3 w-3 mr-1" />Promote</>}
                                  </Button>
                                </>
                              )}
                              {c.promoted_to_caregiver_id && <span className="text-[10px] text-purple-400">In Pipeline</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {allCandidates.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No sourced candidates yet</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TalentSourcing;