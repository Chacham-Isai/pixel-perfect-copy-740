import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Plus, UserPlus, Loader2, Play, Pause, Phone, Bot, Send, Zap,
  CheckCircle2, XCircle, Clock, PhoneCall, Mail, MessageSquare, Activity,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useSourcingCampaigns, useSourcedCandidates, useAgentActivityLog, usePhoneScreens } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Pre-built sequences for display
const OUTREACH_SEQUENCES = {
  caregiver_cold: {
    name: "Caregiver Cold Outreach",
    description: "5-step sequence for new caregiver prospects not currently in your pipeline",
    steps: [
      { day: 0, channel: "sms", subject: null, body: "Hi {name}, {agency_name} is hiring caregivers at {pay_rate}/hr. Already caring for a family member? We can get you paid for it. Reply YES or call {phone}" },
      { day: 1, channel: "email", subject: "Get Paid {pay_rate}/Hour to Care for Your Loved One", body: "Program explanation, paperwork handled, sign-on bonus, apply link" },
      { day: 3, channel: "sms", subject: null, body: "{pay_rate}/hr, flexible schedule, we handle all Medicaid paperwork. Questions? Text back or call {phone}" },
      { day: 7, channel: "email", subject: "What Our Caregivers Say", body: "Testimonials, benefits, competitive pay comparison" },
      { day: 14, channel: "sms", subject: null, body: "Last reach out, {name}. Whenever you're ready for {pay_rate}/hr caregiving, we're here. {phone}" },
    ],
  },
  poaching: {
    name: "Competitor Poach",
    description: "5-step sequence targeting caregivers currently at other agencies",
    steps: [
      { day: 0, channel: "sms", subject: null, body: "Hi {name}, are you a caregiver? {agency_name} pays {pay_rate}/hr — that's thousands more per year than most agencies. Interested? Reply YES" },
      { day: 2, channel: "email", subject: "You Deserve Better Pay", body: "Direct competitor pay comparison, easy switch process" },
      { day: 5, channel: "sms", subject: null, body: "{pay_rate}/hr + sign-on bonus. We make switching easy — most caregivers transition in under a week." },
      { day: 10, channel: "email", subject: "Ready When You Are", body: "FAQ about switching agencies, no gap in pay" },
      { day: 21, channel: "sms", subject: null, body: "Door's always open, {name}. When you want the raise, text us. {phone}" },
    ],
  },
};

const TalentSourcing = () => {
  const { data: campaigns, isLoading: loadingCampaigns, refetch: refetchCampaigns } = useSourcingCampaigns();
  const { data: candidates, isLoading: loadingCandidates, refetch: refetchCandidates } = useSourcedCandidates();
  const { data: activityLog, isLoading: loadingActivity, refetch: refetchActivity } = useAgentActivityLog();
  const { data: phoneScreens, isLoading: loadingScreens, refetch: refetchScreens } = usePhoneScreens();
  const { agencyId } = useAuth();
  const allCampaigns = campaigns || [];
  const allCandidates = candidates || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", state: "", county: "", language: "english", max: "50" });
  const [promoting, setPromoting] = useState<string | null>(null);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);
  const [enrichingCampaign, setEnrichingCampaign] = useState<string | null>(null);

  // Outreach modal
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [sequenceType, setSequenceType] = useState<string>("caregiver_cold");
  const [sendingOutreach, setSendingOutreach] = useState(false);

  // Phone screen modal
  const [screenOpen, setScreenOpen] = useState(false);
  const [screenCandidate, setScreenCandidate] = useState<any>(null);
  const [callingScreen, setCallingScreen] = useState(false);

  // Expanded screen rows
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set());

  // Realtime subscription for agent activity
  useEffect(() => {
    if (!agencyId) return;
    const channel = supabase
      .channel("agent_activity_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_activity_log", filter: `agency_id=eq.${agencyId}` }, () => {
        refetchActivity();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agencyId, refetchActivity]);

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

  const handleRunNow = async (campaignId: string) => {
    if (!agencyId) return;
    setRunningCampaign(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke("source-candidates", {
        body: { agency_id: agencyId, campaign_id: campaignId, mode: "search" },
      });
      if (error) throw error;
      if (data?.mock) {
        toast.success(`Sourced ${data.candidates_created} sample candidates (connect Clay for real sourcing)`);
      } else {
        toast.success(`Sourced ${data.candidates_created} candidates!`);
      }
      refetchCampaigns();
      refetchCandidates();
    } catch (e: any) {
      toast.error(e.message || "Failed to run sourcing");
    }
    setRunningCampaign(null);
  };

  const handleEnrichAll = async (campaignId: string) => {
    if (!agencyId) return;
    setEnrichingCampaign(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke("source-candidates", {
        body: { agency_id: agencyId, campaign_id: campaignId, mode: "enrich" },
      });
      if (error) throw error;
      toast.success(`Enriched ${data.candidates_enriched} candidates${data.mock ? " (mock)" : ""}`);
      refetchCampaigns();
      refetchCandidates();
    } catch (e: any) {
      toast.error(e.message || "Failed to enrich");
    }
    setEnrichingCampaign(null);
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

  const toggleCandidateSelect = (id: string) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkOutreach = async () => {
    if (!agencyId || selectedCandidates.length === 0) return;
    setSendingOutreach(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-outreach", {
        body: { agency_id: agencyId, sourced_candidate_ids: selectedCandidates, sequence_type: sequenceType },
      });
      if (error) throw error;
      if (data?.mock) {
        toast.success(`Queued ${data.sent} candidates for outreach (connect GoHighLevel to send)`);
      } else {
        toast.success(`Outreach sent to ${data.sent} candidates!`);
      }
      setOutreachOpen(false);
      setSelectedCandidates([]);
      refetchCandidates();
    } catch (e: any) {
      toast.error(e.message || "Outreach failed");
    }
    setSendingOutreach(false);
  };

  const handlePhoneScreen = async (candidate: any) => {
    if (!agencyId || !candidate.phone) return;
    setCallingScreen(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-phone-screen", {
        body: {
          agency_id: agencyId,
          sourced_candidate_id: candidate.id,
          phone_number: candidate.phone,
          state: candidate.state,
        },
      });
      if (error) throw error;
      if (data?.mock) {
        toast.success("Phone screen queued (connect Bland AI in Settings to call)");
      } else {
        toast.success("Phone screen initiated!");
      }
      setScreenOpen(false);
      refetchScreens();
      refetchCandidates();
    } catch (e: any) {
      toast.error(e.message || "Screen failed");
    }
    setCallingScreen(false);
  };

  const toggleScreenExpand = (id: string) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getScreenStatusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: any }> = {
      pending: { color: "bg-muted text-muted-foreground", icon: Clock },
      ringing: { color: "bg-yellow-500/20 text-yellow-400 animate-pulse", icon: PhoneCall },
      completed: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
      no_answer: { color: "bg-orange-500/20 text-orange-400", icon: XCircle },
      failed: { color: "bg-red-500/20 text-red-400", icon: XCircle },
    };
    const m = map[status] || map.pending;
    const Icon = m.icon;
    return <Badge className={m.color}><Icon className="h-3 w-3 mr-1" />{status.replace("_", " ")}</Badge>;
  };

  const eligibleForOutreach = allCandidates.filter(c => c.outreach_status === "not_started" && !c.promoted_to_caregiver_id);

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
            { label: "Outreach Sent", value: allCandidates.filter(c => !["not_started"].includes(c.outreach_status)).length },
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
            <TabsTrigger value="activity"><Activity className="h-3 w-3 mr-1" />Agent Activity</TabsTrigger>
            <TabsTrigger value="sequences"><Send className="h-3 w-3 mr-1" />Sequences</TabsTrigger>
            <TabsTrigger value="screening"><Phone className="h-3 w-3 mr-1" />Phone Screening</TabsTrigger>
          </TabsList>

          {/* CAMPAIGNS TAB */}
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
                      <Badge className={sc.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}>{sc.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(sc.id, sc.status || "draft")}>
                        {sc.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground"
                        onClick={() => handleRunNow(sc.id)}
                        disabled={runningCampaign === sc.id}
                      >
                        {runningCampaign === sc.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                        Run Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnrichAll(sc.id)}
                        disabled={enrichingCampaign === sc.id}
                      >
                        {enrichingCampaign === sc.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                        Enrich All
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
                      <div className="font-data text-lg font-bold text-emerald-400">{sc.candidates_pushed || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Pushed to Pipeline</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loadingCampaigns && allCampaigns.length === 0 && <p className="text-center text-muted-foreground py-8">No sourcing campaigns. Create one to start finding caregivers.</p>}
          </TabsContent>

          {/* CANDIDATES TAB */}
          <TabsContent value="candidates" className="mt-4 space-y-4">
            {eligibleForOutreach.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{selectedCandidates.length} selected</span>
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground"
                  disabled={selectedCandidates.length === 0}
                  onClick={() => setOutreachOpen(true)}
                >
                  <Send className="h-3 w-3 mr-1" /> Queue for Outreach ({selectedCandidates.length})
                </Button>
              </div>
            )}

            {loadingCandidates ? <Skeleton className="h-48" /> : (
              <Card className="bg-card halevai-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Candidate</TableHead><TableHead>Platform</TableHead><TableHead>Location</TableHead>
                        <TableHead>Match</TableHead><TableHead>Employer</TableHead><TableHead>Pay</TableHead><TableHead>Outreach</TableHead><TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCandidates.map((c) => (
                        <TableRow key={c.id} className="border-border hover:bg-secondary/30">
                          <TableCell>
                            {c.outreach_status === "not_started" && !c.promoted_to_caregiver_id && (
                              <Checkbox
                                checked={selectedCandidates.includes(c.id)}
                                onCheckedChange={() => toggleCandidateSelect(c.id)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium text-foreground">{c.full_name}</span>
                              {c.phone && <p className="text-[10px] text-muted-foreground">{c.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{c.source_platform || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{c.county || "—"}, {c.state || "—"}</TableCell>
                          <TableCell><span className={`font-data font-bold ${(c.match_score || 0) >= 80 ? "text-emerald-400" : (c.match_score || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>{c.match_score ?? "—"}</span></TableCell>
                          <TableCell className="text-muted-foreground">{c.current_employer || "—"}</TableCell>
                          <TableCell className="font-data text-muted-foreground">{c.current_pay_rate ? `$${c.current_pay_rate}/hr` : "—"}</TableCell>
                          <TableCell>
                            <Badge className={
                              c.outreach_status === "responded" ? "bg-emerald-500/20 text-emerald-400" :
                              c.outreach_status === "sent" ? "bg-blue-500/20 text-blue-400" :
                              c.outreach_status === "queued" ? "bg-yellow-500/20 text-yellow-400" :
                              c.outreach_status === "promoted" ? "bg-purple-500/20 text-purple-400" :
                              "bg-secondary text-muted-foreground"
                            }>{(c.outreach_status || "not started").replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!c.promoted_to_caregiver_id && (
                                <>
                                  {c.phone && c.phone_screen_status === "not_started" && (
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setScreenCandidate(c); setScreenOpen(true); }}>
                                      <Phone className="h-3 w-3 mr-1" />Screen
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
                      {allCandidates.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No sourced candidates yet</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AGENT ACTIVITY TAB */}
          <TabsContent value="activity" className="mt-4">
            <Card className="bg-card halevai-border">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Agent Activity Feed</CardTitle></CardHeader>
              <CardContent>
                {loadingActivity ? <Skeleton className="h-48" /> : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {(activityLog || []).map((entry: any) => {
                        const iconMap: Record<string, any> = { sourcing: Bot, outreach: Send, phone_screen: Phone, system: Zap };
                        const Icon = iconMap[entry.agent_type] || Bot;
                        return (
                          <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                            <div className={`p-1.5 rounded ${entry.success ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{entry.action.replace(/_/g, " ")}</span>
                                {entry.success ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Success</Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400 text-[10px]">Failed</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                              <span className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                      {(!activityLog || activityLog.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">No agent activity yet. Run a sourcing campaign to get started.</p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OUTREACH SEQUENCES TAB */}
          <TabsContent value="sequences" className="mt-4 space-y-4">
            {Object.entries(OUTREACH_SEQUENCES).map(([key, seq]) => (
              <Card key={key} className="bg-card halevai-border">
                <CardHeader>
                  <CardTitle className="text-base">{seq.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{seq.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {seq.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded bg-secondary/30 border border-border/50">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5">Day {step.day}</Badge>
                          {step.channel === "sms" ? (
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Mail className="h-3.5 w-3.5 text-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          {step.subject && <p className="text-xs font-medium text-foreground mb-1">{step.subject}</p>}
                          <p className="text-xs text-muted-foreground">{step.body}</p>
                        </div>
                        <Badge className={step.channel === "sms" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                          {step.channel.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* PHONE SCREENING TAB */}
          <TabsContent value="screening" className="mt-4">
            <Card className="bg-card halevai-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />Phone Screens</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingScreens ? <Skeleton className="h-48" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Candidate</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead><TableHead>AI Score</TableHead><TableHead>Recommendation</TableHead><TableHead>Date</TableHead><TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(phoneScreens || []).map((ps: any) => (
                        <>
                          <TableRow key={ps.id} className="border-border hover:bg-secondary/30 cursor-pointer" onClick={() => toggleScreenExpand(ps.id)}>
                            <TableCell className="font-medium text-foreground">{ps.phone_number}</TableCell>
                            <TableCell className="text-muted-foreground">{ps.phone_number}</TableCell>
                            <TableCell>{getScreenStatusBadge(ps.status)}</TableCell>
                            <TableCell className="font-data text-muted-foreground">{ps.duration_seconds ? `${Math.floor(ps.duration_seconds / 60)}:${String(ps.duration_seconds % 60).padStart(2, "0")}` : "—"}</TableCell>
                            <TableCell>
                              {ps.ai_score != null ? (
                                <span className={`font-data font-bold ${ps.ai_score >= 80 ? "text-emerald-400" : ps.ai_score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{ps.ai_score}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {ps.ai_recommendation ? (
                                <Badge className={
                                  ps.ai_recommendation === "advance" ? "bg-emerald-500/20 text-emerald-400" :
                                  ps.ai_recommendation === "maybe" ? "bg-yellow-500/20 text-yellow-400" :
                                  "bg-red-500/20 text-red-400"
                                }>{ps.ai_recommendation}</Badge>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(ps.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {expandedScreens.has(ps.id) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                          </TableRow>
                          {expandedScreens.has(ps.id) && (
                            <TableRow key={`${ps.id}-detail`} className="border-border">
                              <TableCell colSpan={8} className="p-4 bg-secondary/20">
                                <div className="space-y-4">
                                  {ps.ai_summary && (
                                    <div className="p-3 rounded bg-primary/5 border border-primary/10">
                                      <p className="text-xs font-medium text-primary mb-1">AI Summary</p>
                                      <p className="text-sm text-foreground">{ps.ai_summary}</p>
                                    </div>
                                  )}
                                  {ps.screening_answers && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground mb-2">Screening Answers</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(ps.screening_answers as Record<string, any>).map(([k, v]) => (
                                          <div key={k} className="text-xs">
                                            <span className="text-muted-foreground">{k.replace(/_/g, " ")}:</span>{" "}
                                            <span className="text-foreground">{v == null ? "—" : String(v)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {ps.transcript && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground mb-1">Transcript</p>
                                      <ScrollArea className="h-48">
                                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{ps.transcript}</pre>
                                      </ScrollArea>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                      {(!phoneScreens || phoneScreens.length === 0) && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No phone screens yet. Select a candidate to schedule a call.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Outreach Modal */}
        <Dialog open={outreachOpen} onOpenChange={setOutreachOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Queue for Outreach</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sequence Type</Label>
                <Select value={sequenceType} onValueChange={setSequenceType}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caregiver_cold">Caregiver Cold Outreach</SelectItem>
                    <SelectItem value="poaching">Competitor Poach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 rounded bg-secondary/50 border border-border">
                <p className="text-xs font-medium text-foreground mb-1">First Message Preview ({sequenceType === "caregiver_cold" ? "SMS" : "SMS"}):</p>
                <p className="text-xs text-muted-foreground italic">
                  {OUTREACH_SEQUENCES[sequenceType as keyof typeof OUTREACH_SEQUENCES]?.steps[0].body}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{selectedCandidates.length} candidate(s) will receive this 5-step sequence.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOutreachOpen(false)}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground" onClick={handleBulkOutreach} disabled={sendingOutreach}>
                {sendingOutreach ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Send to {selectedCandidates.length} candidates
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phone Screen Confirm Modal */}
        <Dialog open={screenOpen} onOpenChange={setScreenOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Schedule AI Phone Screen</DialogTitle></DialogHeader>
            {screenCandidate && (
              <div className="space-y-4">
                <div className="p-3 rounded bg-secondary/50 border border-border">
                  <p className="text-sm font-medium text-foreground">{screenCandidate.full_name}</p>
                  <p className="text-xs text-muted-foreground">{screenCandidate.phone}</p>
                  <p className="text-xs text-muted-foreground">{screenCandidate.state} • Match: {screenCandidate.match_score || "—"}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The AI will call this candidate, conduct a 7-question screening interview, and provide a score and recommendation.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setScreenOpen(false)}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground" onClick={() => handlePhoneScreen(screenCandidate)} disabled={callingScreen}>
                {callingScreen ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PhoneCall className="h-4 w-4 mr-1" />}
                Call Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default TalentSourcing;
