import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Plus, TrendingUp, DollarSign, MousePointer, Users, Sparkles, Search, Globe, BarChart3, FileText, Zap, Star, AlertTriangle, ExternalLink, Loader2, ChevronDown, ChevronUp, Mail, MessageSquare, Trash2 } from "lucide-react";
import { useCampaigns, useReferralSources, useCampaignTemplates, useCampaignSequences, useSequenceEnrollments, useAgency } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ReferenceLine } from "recharts";

// Sequences Tab Component with full step editor
const SequencesTab = ({ sequences, agencyId }: { sequences: any[]; agencyId: string | null }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("manual");
  const [generatingSteps, setGeneratingSteps] = useState(false);

  const loadSteps = async (seqId: string) => {
    setLoadingSteps(true);
    const { data } = await supabase.from("sequence_steps" as any).select("*").eq("sequence_id", seqId).order("step_number");
    setSteps((data || []) as any[]);
    setLoadingSteps(false);
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); setSteps([]); }
    else { setExpandedId(id); loadSteps(id); }
  };

  const createSequence = async () => {
    if (!agencyId || !newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("campaign_sequences" as any).insert({
      agency_id: agencyId, name: newName, trigger_type: newTrigger,
    });
    if (error) toast.error("Failed to create");
    else { toast.success("Sequence created!"); setNewName(""); }
    setCreating(false);
  };

  const addStep = async (seqId: string) => {
    if (!agencyId) return;
    const nextNum = steps.length + 1;
    const { error } = await supabase.from("sequence_steps" as any).insert({
      agency_id: agencyId, sequence_id: seqId, step_number: nextNum,
      channel: "sms", delay_hours: nextNum === 1 ? 0 : 24,
      subject: `Step ${nextNum}`, body: "", active: true,
    });
    if (error) toast.error("Failed");
    else loadSteps(seqId);
  };

  const updateStep = async (stepId: string, updates: any) => {
    await supabase.from("sequence_steps" as any).update(updates).eq("id", stepId);
    if (expandedId) loadSteps(expandedId);
  };

  const deleteStep = async (stepId: string) => {
    await supabase.from("sequence_steps" as any).delete().eq("id", stepId);
    if (expandedId) loadSteps(expandedId);
  };

  const generateAISteps = async (seqId: string, seq: any) => {
    if (!agencyId) return;
    setGeneratingSteps(true);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-optimizer", {
        body: { mode: "template", agencyId, context: `Generate a 5-step ${seq.trigger_type} outreach sequence for caregivers. Return steps with channel (sms or email), subject, body, and delay_hours.` },
      });
      if (error) throw error;
      const aiSteps = data?.result?.steps || data?.result?.recommendations || [];
      for (let i = 0; i < Math.min(aiSteps.length, 5); i++) {
        const s = aiSteps[i];
        await supabase.from("sequence_steps" as any).insert({
          agency_id: agencyId, sequence_id: seqId, step_number: i + 1,
          channel: s.channel || "sms", delay_hours: s.delay_hours || (i * 24),
          subject: s.subject || s.title || `Step ${i + 1}`,
          body: s.body || s.description || "", ai_generated: true, active: true,
        });
      }
      toast.success("AI steps generated!");
      loadSteps(seqId);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setGeneratingSteps(false);
  };

  const toggleActive = async (seqId: string, active: boolean) => {
    await supabase.from("campaign_sequences" as any).update({ active: !active }).eq("id", seqId);
    toast.success(active ? "Sequence paused" : "Sequence activated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Campaign Sequences</h2>
      </div>

      {/* Create new sequence */}
      <Card className="bg-secondary/30 halevai-border">
        <CardContent className="p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Sequence Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. New Lead Welcome" className="bg-secondary border-border" />
            </div>
            <div className="w-40 space-y-1">
              <Label className="text-xs">Trigger</Label>
              <Select value={newTrigger} onValueChange={setNewTrigger}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="new_lead">New Lead</SelectItem>
                  <SelectItem value="form_submit">Form Submit</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createSequence} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Create</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {sequences.map((seq: any) => (
        <Card key={seq.id} className="bg-card halevai-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => toggleExpand(seq.id)}>
              <div>
                <h3 className="font-semibold text-foreground">{seq.name}</h3>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] border-border">{seq.trigger_type}</Badge>
                  {seq.target_state && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{seq.target_state}</Badge>}
                  <Badge variant="outline" className="text-[10px] border-border">{seq.target_language}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!seq.active} onCheckedChange={() => toggleActive(seq.id, seq.active)} />
                {expandedId === seq.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {expandedId === seq.id && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{steps.length} steps</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => generateAISteps(seq.id, seq)} disabled={generatingSteps}>
                      {generatingSteps ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}AI Generate Steps
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addStep(seq.id)}>
                      <Plus className="h-3 w-3 mr-1" />Add Step
                    </Button>
                  </div>
                </div>

                {loadingSteps ? <Skeleton className="h-20" /> : steps.map((step: any) => (
                  <Card key={step.id} className="bg-secondary/20 border-border">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary text-[10px]">Step {step.step_number}</Badge>
                          {step.channel === "email" ? <Mail className="h-3 w-3 text-blue-400" /> : <MessageSquare className="h-3 w-3 text-green-400" />}
                          <span className="text-xs text-muted-foreground">After {step.delay_hours}h</span>
                          {step.ai_generated && <Badge variant="outline" className="text-[8px] border-accent/30 text-accent">AI</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch checked={!!step.active} onCheckedChange={(v) => updateStep(step.id, { active: v })} />
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteStep(step.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={step.channel} onValueChange={(v) => updateStep(step.id, { channel: v })}>
                          <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent>
                        </Select>
                        <Input type="number" value={step.delay_hours} onChange={e => updateStep(step.id, { delay_hours: Number(e.target.value) })} className="bg-secondary border-border h-8 text-xs" placeholder="Delay (hrs)" />
                        <Input value={step.subject || ""} onChange={e => updateStep(step.id, { subject: e.target.value })} className="bg-secondary border-border h-8 text-xs" placeholder="Subject" />
                      </div>
                      <Textarea value={step.body || ""} onChange={e => updateStep(step.id, { body: e.target.value })} className="bg-secondary border-border text-xs min-h-[60px]" placeholder="Message body..." />
                    </CardContent>
                  </Card>
                ))}
                {steps.length === 0 && !loadingSteps && (
                  <p className="text-sm text-muted-foreground text-center py-4">No steps yet. Add manually or use AI to generate a complete sequence.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {sequences.length === 0 && <p className="text-muted-foreground text-center py-8">No sequences yet. Create one above to automate outreach.</p>}
    </div>
  );
};

const statusColor = (s: string | null) => {
  if (s === "active") return "bg-green-500/20 text-green-400";
  if (s === "paused") return "bg-yellow-500/20 text-yellow-400";
  if (s === "completed") return "bg-muted text-muted-foreground";
  return "bg-blue-500/20 text-blue-400";
};

const CHART_COLORS = ["hsl(195,100%,50%)", "hsl(270,80%,60%)", "hsl(150,70%,50%)", "hsl(40,90%,60%)", "hsl(0,84%,60%)"];

// Campaign card grid component
const CampaignGrid = ({ campaigns, onOptimize }: { campaigns: any[]; onOptimize: (id: string) => void }) => {
  if (campaigns.length === 0) return <p className="text-center text-muted-foreground py-8">No campaigns in this category</p>;
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((c) => {
        const cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
        const overTarget = c.target_cac && cpa > c.target_cac * 2;
        return (
          <Card key={c.id} className={`bg-card halevai-border hover:border-primary/30 transition-colors ${overTarget ? "border-destructive/40" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm">{c.campaign_name}</h3>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">{c.state || "—"}</Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{c.channel || "—"}</Badge>
                  </div>
                </div>
                <Badge className={`${statusColor(c.status)} text-[10px]`}>{c.status}</Badge>
              </div>
              {overTarget && (
                <div className="flex items-center gap-1 text-destructive text-xs mb-2">
                  <AlertTriangle className="h-3 w-3" /> CPA exceeds 2× target — consider pausing
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div><span className="text-muted-foreground">Spend</span><div className="font-data font-bold text-foreground">${(c.spend || 0).toLocaleString()}</div></div>
                <div><span className="text-muted-foreground">Clicks</span><div className="font-data text-foreground">{(c.clicks || 0).toLocaleString()}</div></div>
                <div><span className="text-muted-foreground">Conversions</span><div className="font-data font-bold text-primary">{c.conversions || 0}</div></div>
                <div><span className="text-muted-foreground">CPA</span><div className="font-data text-foreground">${cpa > 0 ? cpa.toFixed(2) : "—"}</div></div>
              </div>
              <div className="flex gap-1 mt-3">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onOptimize(c.id)}>
                  <Sparkles className="h-3 w-3 mr-1" /> AI Optimize
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => {}}>
                  <FileText className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const Campaigns = () => {
  usePageTitle("Campaigns");
  const { data: campaigns, isLoading } = useCampaigns();
  const { data: sources } = useReferralSources();
  const { data: templates } = useCampaignTemplates();
  const { data: sequences } = useCampaignSequences();
  const { agencyId } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<any>(null);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [dateRange, setDateRange] = useState("30d");

  const all = campaigns || [];
  const active = all.filter(c => c.status === "active");
  const totalSpend = active.reduce((s, c) => s + (c.spend || 0), 0);
  const totalClicks = active.reduce((s, c) => s + (c.clicks || 0), 0);
  const totalConversions = active.reduce((s, c) => s + (c.conversions || 0), 0);
  const avgCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "0";

  const byType = (type: string) => all.filter(c => c.campaign_type === type);

  // Chart data
  const channelSpend = Object.entries(all.reduce((acc: any, c) => {
    const ch = c.channel || "Other";
    acc[ch] = (acc[ch] || 0) + (c.spend || 0);
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const stateConversions = Object.entries(all.reduce((acc: any, c) => {
    const st = c.state || "Unknown";
    acc[st] = (acc[st] || 0) + (c.conversions || 0);
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const bestChannel = channelSpend.sort((a: any, b: any) => b.value - a.value)[0]?.name || "—";

  const handleOptimize = async (campaignId: string) => {
    setOptimizing(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-optimizer", {
        body: { mode: "optimization", agencyId, campaignId },
      });
      if (error) throw error;
      setOptimizeResult(data?.result);
    } catch (e: any) {
      toast.error(e.message || "Optimization failed");
    }
    setOptimizing(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Campaign Hub</h1>
          </div>
          <Button className="bg-primary text-primary-foreground" onClick={() => navigate("/campaign-builder")}>
            <Plus className="h-4 w-4 mr-1" /> New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, icon: DollarSign },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer },
            { label: "Conversions", value: String(totalConversions), icon: Users },
            { label: "Avg CPA", value: `$${avgCPA}`, icon: TrendingUp },
          ].map((k) => (
            <Card key={k.label} className="bg-card halevai-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</span>
                  <k.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="font-data text-xl font-bold text-foreground">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? <Skeleton className="h-64" /> : (
          <Tabs defaultValue="recruitment" className="space-y-4">
            <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="recruitment">Recruitment ({byType("recruitment").length})</TabsTrigger>
              <TabsTrigger value="marketing">Marketing ({byType("marketing").length})</TabsTrigger>
              <TabsTrigger value="social">Social ({byType("social").length})</TabsTrigger>
              <TabsTrigger value="community">Community ({byType("community").length})</TabsTrigger>
              <TabsTrigger value="sources">Sources ({(sources || []).length})</TabsTrigger>
              <TabsTrigger value="performance"><BarChart3 className="h-3 w-3 mr-1" />Performance</TabsTrigger>
              <TabsTrigger value="templates">Templates ({(templates || []).length})</TabsTrigger>
              <TabsTrigger value="sequences"><Zap className="h-3 w-3 mr-1" />Sequences ({(sequences || []).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="recruitment"><CampaignGrid campaigns={byType("recruitment")} onOptimize={handleOptimize} /></TabsContent>
            <TabsContent value="marketing"><CampaignGrid campaigns={byType("marketing")} onOptimize={handleOptimize} /></TabsContent>
            <TabsContent value="social"><CampaignGrid campaigns={byType("social")} onOptimize={handleOptimize} /></TabsContent>
            <TabsContent value="community"><CampaignGrid campaigns={byType("community")} onOptimize={handleOptimize} /></TabsContent>

            <TabsContent value="sources">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground">Referral Sources</h2>
                  <Button variant="outline" disabled={discoverLoading} onClick={async () => {
                    setDiscoverLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("discover-sources", {
                        body: { agencyId },
                      });
                      if (error) throw error;
                      toast.success(`Discovered ${data?.total_saved || 0} new sources!`);
                      qc.invalidateQueries({ queryKey: ["referral_sources"] });
                    } catch (e: any) {
                      toast.error(e.message || "Discovery failed");
                    }
                    setDiscoverLoading(false);
                  }}>
                    <Search className="h-4 w-4 mr-1" /> Discover Sources
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(sources || []).map((s: any) => (
                    <Card key={s.id} className="bg-card halevai-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">{s.source_type}</Badge>
                        </div>
                        <div className="flex gap-1 mb-2">
                          <Badge variant="outline" className="text-[10px] border-border">{s.state}</Badge>
                          {s.county && <Badge variant="outline" className="text-[10px] border-border">{s.county}</Badge>}
                          {s.language_community && <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{s.language_community}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{s.notes}</p>
                        {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2"><ExternalLink className="h-3 w-3" />Visit</a>}
                        <Badge className="mt-2 text-[10px]" variant="outline">{s.discovered_by === "ai" ? "AI Discovered" : "Manual"}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {(sources || []).length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">No sources yet. Click "Discover Sources" to find opportunities.</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="space-y-6">
                <div className="flex gap-2">
                  {["7d", "30d", "90d"].map(d => (
                    <Button key={d} size="sm" variant={dateRange === d ? "default" : "outline"} onClick={() => setDateRange(d)}>{d}</Button>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-card halevai-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Spend by Channel</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={channelSpend} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,20%,16%)" />
                          <XAxis type="number" tick={{ fill: "hsl(225,15%,55%)", fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fill: "hsl(225,15%,55%)", fontSize: 10 }} width={80} />
                          <Tooltip contentStyle={{ background: "hsl(225,25%,9%)", border: "1px solid hsl(195,100%,50%,0.2)" }} />
                          <Bar dataKey="value" fill="hsl(195,100%,50%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="bg-card halevai-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Conversions by State</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={stateConversions} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }: any) => `${name}: ${value}`}>
                            {stateConversions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "hsl(225,25%,9%)", border: "1px solid hsl(195,100%,50%,0.2)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                {/* ROI Table */}
                <Card className="bg-card halevai-border">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Campaign</TableHead><TableHead>Spend</TableHead><TableHead>Conversions</TableHead>
                          <TableHead>CPA</TableHead><TableHead>Target CPA</TableHead><TableHead>ROI Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {all.filter(c => c.status === "active").map(c => {
                          const cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
                          const ratio = c.target_cac && c.target_cac > 0 ? cpa / c.target_cac : 0;
                          const color = ratio === 0 ? "text-muted-foreground" : ratio < 1 ? "text-green-400" : ratio < 2 ? "text-yellow-400" : "text-red-400";
                          return (
                            <TableRow key={c.id} className="border-border">
                              <TableCell className="font-medium text-foreground">{c.campaign_name}</TableCell>
                              <TableCell className="font-data">${(c.spend || 0).toLocaleString()}</TableCell>
                              <TableCell className="font-data text-primary">{c.conversions || 0}</TableCell>
                              <TableCell className="font-data">${cpa > 0 ? cpa.toFixed(2) : "—"}</TableCell>
                              <TableCell className="font-data">${c.target_cac || "—"}</TableCell>
                              <TableCell className={`font-data font-bold ${color}`}>
                                {ratio === 0 ? "—" : ratio < 1 ? "✓ Under Target" : ratio < 2 ? "⚠ Above Target" : "✗ Over 2× Target"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground">Campaign Templates</h2>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(templates || []).map((t: any) => (
                    <Card key={t.id} className="bg-card halevai-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground text-sm">{t.title}</h3>
                          {t.performance_rating && (
                            <Badge variant="outline" className={`text-[10px] ${t.performance_rating === "top" ? "border-green-400/30 text-green-400" : "border-yellow-400/30 text-yellow-400"}`}>
                              <Star className="h-2 w-2 mr-0.5" />{t.performance_rating}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 mb-2">
                          <Badge variant="outline" className="text-[10px] border-border">{t.channel}</Badge>
                          <Badge variant="outline" className="text-[10px] border-border">{t.state}</Badge>
                          <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{t.target_language}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{(t.content as any)?.headline || (t.content as any)?.description || ""}</p>
                        <Button size="sm" className="w-full mt-3" variant="outline" onClick={() => navigate("/campaign-builder")}>
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {(templates || []).length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">No templates yet</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sequences">
              <SequencesTab sequences={sequences || []} agencyId={agencyId} />
            </TabsContent>
          </Tabs>
        )}

        {/* Optimization Result Dialog */}
        <Dialog open={!!optimizeResult} onOpenChange={() => setOptimizeResult(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">AI Optimization Recommendations</DialogTitle>
            </DialogHeader>
            {optimizeResult && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{optimizeResult.overall_assessment}</p>
                {(optimizeResult.recommendations || []).map((r: any, i: number) => (
                  <Card key={i} className="bg-secondary/30 halevai-border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={r.priority === "high" ? "bg-red-500/20 text-red-400" : r.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}>{r.priority}</Badge>
                        <span className="font-semibold text-foreground text-sm">{r.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                      {r.expected_impact && <p className="text-xs text-primary mt-1">Impact: {r.expected_impact}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Campaigns;
