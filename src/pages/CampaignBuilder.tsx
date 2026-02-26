import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PenTool, ArrowRight, ArrowLeft, Sparkles, Check, Loader2, ChevronDown, Download, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgencyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PLATFORMS = [
  { name: "Indeed", category: "Job Board", estimated: "500-2K reach", cpa: "$15-40" },
  { name: "ZipRecruiter", category: "Job Board", estimated: "300-1.5K reach", cpa: "$20-50" },
  { name: "Care.com", category: "Job Board", estimated: "200-800 reach", cpa: "$25-60" },
  { name: "Craigslist", category: "Job Board", estimated: "100-500 reach", cpa: "Free" },
  { name: "Glassdoor", category: "Job Board", estimated: "200-1K reach", cpa: "$30-60" },
  { name: "Facebook", category: "Social/Paid", estimated: "5K-50K reach", cpa: "$10-35" },
  { name: "Instagram", category: "Social/Paid", estimated: "3K-20K reach", cpa: "$12-40" },
  { name: "Google Ads", category: "Social/Paid", estimated: "1K-10K reach", cpa: "$20-50" },
  { name: "LinkedIn", category: "Social/Paid", estimated: "500-5K reach", cpa: "$30-70" },
  { name: "TikTok", category: "Social/Paid", estimated: "5K-100K reach", cpa: "$8-25" },
  { name: "Churches/Cultural Centers", category: "Community", estimated: "50-200 reach", cpa: "$0-5" },
  { name: "Senior Centers", category: "Community", estimated: "30-100 reach", cpa: "$0-5" },
  { name: "Job Fairs", category: "Community", estimated: "100-500 reach", cpa: "$10-30" },
  { name: "Community Events", category: "Community", estimated: "50-300 reach", cpa: "$5-20" },
  { name: "Google for Jobs", category: "Organic", estimated: "500-5K reach", cpa: "Free" },
  { name: "Employee Referrals", category: "Organic", estimated: "10-50 reach", cpa: "$200/hire" },
];

const CampaignBuilder = () => {
  const [step, setStep] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [details, setDetails] = useState({ name: "", type: "recruitment", states: [] as string[], county: "", language: "english", budget: "", dateFrom: "", dateTo: "", targetCPA: "", autoPause: "" });
  const [generating, setGenerating] = useState(false);
  const [generatedPackage, setGeneratedPackage] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<Record<string, any>>({});
  const [checkingPlatforms, setCheckingPlatforms] = useState(false);
  const { agencyId } = useAuth();
  const { data: agency } = useAgency();
  const navigate = useNavigate();

  const steps = ["Select Platforms", "Campaign Details", "AI Generation", "Review & Launch"];

  const togglePlatform = (name: string) => {
    setSelectedPlatforms(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };
  const selectAll = (cat: string) => {
    const names = PLATFORMS.filter(p => cat === "paid" ? p.cpa !== "Free" && p.cpa !== "$0-5" : p.cpa === "Free" || p.cpa === "$0-5").map(p => p.name);
    setSelectedPlatforms(prev => [...new Set([...prev, ...names])]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-optimizer", {
        body: { mode: "full_package", agencyId, platforms: selectedPlatforms, campaignDetails: details },
      });
      if (error) throw error;
      setGeneratedPackage(data?.result);
      toast.success("Campaign content generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setGenerating(false);
  };

  const handleLaunch = async (asDraft = false) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("campaigns").insert({
        agency_id: agencyId!,
        campaign_name: details.name || "New Campaign",
        campaign_type: details.type as any,
        channel: selectedPlatforms.join(", "),
        state: (details.states[0] || agency?.primary_state) ?? null,
        county: details.county || null,
        target_language: details.language,
        spend: 0,
        status: asDraft ? "draft" : "active",
        target_cac: details.targetCPA ? Number(details.targetCPA) : null,
        pause_spend_threshold: details.autoPause ? Number(details.autoPause) : null,
        date_from: details.dateFrom || null,
        date_to: details.dateTo || null,
      } as any);
      if (error) throw error;
      toast.success(asDraft ? "Saved as draft!" : "Campaign launched!");
      navigate("/campaigns");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <PenTool className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campaign Builder</h1>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
              <span className={`text-sm hidden md:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Card className="bg-card halevai-border">
          <CardContent className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Select Platforms</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectAll("paid")}>Select All Paid</Button>
                    <Button size="sm" variant="outline" onClick={() => selectAll("free")}>Select All Free</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PLATFORMS.map(p => (
                    <Card key={p.name} onClick={() => togglePlatform(p.name)} className={`cursor-pointer transition-all p-3 ${selectedPlatforms.includes(p.name) ? "border-primary bg-primary/10" : "bg-secondary/30 halevai-border hover:border-primary/30"}`}>
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.estimated}</div>
                      <div className="text-[10px] text-primary font-data">{p.cpa}</div>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{selectedPlatforms.length} platform(s) selected</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Campaign Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Campaign Name</Label><Input value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Oregon Q1 Recruitment Blitz" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Campaign Type</Label>
                    <Select value={details.type} onValueChange={v => setDetails(d => ({ ...d, type: v }))}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="recruitment">Recruitment</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="social">Social</SelectItem><SelectItem value="community">Community</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Target State</Label><Input value={details.states.join(", ")} onChange={e => setDetails(d => ({ ...d, states: e.target.value.split(",").map(s => s.trim()) }))} placeholder="Oregon, Michigan" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>County/Area</Label><Input value={details.county} onChange={e => setDetails(d => ({ ...d, county: e.target.value }))} placeholder="Washington County" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Language</Label>
                    <Select value={details.language} onValueChange={v => setDetails(d => ({ ...d, language: v }))}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="vietnamese">Vietnamese</SelectItem><SelectItem value="chinese">Chinese</SelectItem><SelectItem value="spanish">Spanish</SelectItem><SelectItem value="russian">Russian</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Budget ($)</Label><Input type="number" value={details.budget} onChange={e => setDetails(d => ({ ...d, budget: e.target.value }))} placeholder="500" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={details.dateFrom} onChange={e => setDetails(d => ({ ...d, dateFrom: e.target.value }))} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={details.dateTo} onChange={e => setDetails(d => ({ ...d, dateTo: e.target.value }))} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Target CPA ($)</Label><Input type="number" value={details.targetCPA} onChange={e => setDetails(d => ({ ...d, targetCPA: e.target.value }))} placeholder="30" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Auto-Pause Threshold ($)</Label><Input type="number" value={details.autoPause} onChange={e => setDetails(d => ({ ...d, autoPause: e.target.value }))} placeholder="500" className="bg-secondary border-border" /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">AI-Generated Content</h2>
                  {!generatedPackage && <Button onClick={handleGenerate} disabled={generating}>{generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-1" />Generate Package</>}</Button>}
                </div>
                {generating && <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" /><p className="text-sm text-muted-foreground">Generating platform-specific content for {selectedPlatforms.length} platforms...</p></div>}
                {generatedPackage?.platforms && (
                  <div className="space-y-3">
                    {generatedPackage.platforms.map((p: any, i: number) => (
                      <Collapsible key={i}>
                        <CollapsibleTrigger asChild>
                          <Card className="bg-secondary/30 halevai-border cursor-pointer hover:border-primary/30">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/20 text-primary">{p.platform}</Badge>
                                <span className="text-sm text-foreground">{p.headlines?.[0]}</span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Card className="bg-card halevai-border mt-1">
                            <CardContent className="p-4 space-y-3">
                              <div><Label className="text-xs">Headlines</Label>{(p.headlines || []).map((h: string, j: number) => <p key={j} className="text-sm text-foreground">{h}</p>)}</div>
                              <div><Label className="text-xs">Descriptions</Label>{(p.descriptions || []).map((d: string, j: number) => <p key={j} className="text-sm text-muted-foreground">{d}</p>)}</div>
                              <div><Label className="text-xs">CTA</Label><p className="text-sm text-primary">{p.cta}</p></div>
                              {p.keywords && <div><Label className="text-xs">Keywords</Label><div className="flex flex-wrap gap-1">{p.keywords.map((k: string, j: number) => <Badge key={j} variant="outline" className="text-[10px]">{k}</Badge>)}</div></div>}
                              {p.utm_params && <div><Label className="text-xs">UTM</Label><p className="text-xs text-muted-foreground font-data">?utm_source={p.utm_params.source}&utm_medium={p.utm_params.medium}&utm_campaign={p.utm_params.campaign}</p></div>}
                              {p.audience_targeting && <div><Label className="text-xs">Audience</Label><p className="text-xs text-muted-foreground">{p.audience_targeting}</p></div>}
                            </CardContent>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
                {!generating && !generatedPackage && <p className="text-center text-muted-foreground py-8">Click "Generate Package" to create platform-specific content</p>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground text-center">Review & Launch</h2>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  <div className="text-xs text-muted-foreground">Campaign:</div><div className="text-xs text-foreground">{details.name || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">Type:</div><div className="text-xs text-foreground capitalize">{details.type}</div>
                  <div className="text-xs text-muted-foreground">Platforms:</div><div className="text-xs text-foreground">{selectedPlatforms.join(", ")}</div>
                  <div className="text-xs text-muted-foreground">States:</div><div className="text-xs text-foreground">{details.states.join(", ") || "—"}</div>
                  <div className="text-xs text-muted-foreground">Budget:</div><div className="text-xs text-foreground">${details.budget || "—"}</div>
                  <div className="text-xs text-muted-foreground">Target CPA:</div><div className="text-xs text-foreground">${details.targetCPA || "—"}</div>
                  <div className="text-xs text-muted-foreground">Language:</div><div className="text-xs text-foreground capitalize">{details.language}</div>
                  <div className="text-xs text-muted-foreground">Generated Content:</div><div className="text-xs text-foreground">{generatedPackage ? `${generatedPackage.platforms?.length || 0} platforms` : "None"}</div>
                </div>

                {/* Platform Connection Status */}
                {Object.keys(platformStatus).length > 0 && (
                  <Card className="bg-secondary/30 halevai-border max-w-md mx-auto">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Platform Connections</h3>
                      <div className="space-y-2">
                        {Object.entries(platformStatus).map(([key, val]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span className="text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                            <Badge variant="outline" className={val.connected ? "border-green-400/30 text-green-400" : "border-yellow-400/30 text-yellow-400"}>
                              {val.connected ? "✓ Connected" : "Not Connected"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-center gap-3 mt-6">
                  <Button onClick={() => handleLaunch(false)} disabled={saving} className="bg-primary text-primary-foreground halevai-glow">🚀 Launch Campaign</Button>
                  <Button onClick={() => handleLaunch(true)} disabled={saving} variant="outline"><Save className="h-4 w-4 mr-1" /> Save as Draft</Button>
                  <Button variant="outline"><Download className="h-4 w-4 mr-1" /> Download</Button>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step > 0 ? <Button variant="outline" onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button> : <div />}
              {step < 3 && (
                <Button className="bg-primary text-primary-foreground" disabled={step === 0 && selectedPlatforms.length === 0} onClick={async () => {
                  if (step === 2 && !generatedPackage) {
                    await handleGenerate();
                    // Check platform credentials when moving to review
                    try {
                      const { data } = await supabase.functions.invoke("post-to-ads", { body: { action: "check_credentials", agencyId } });
                      if (data?.platforms) setPlatformStatus(data.platforms);
                    } catch {}
                    setStep(3);
                  } else {
                    if (step === 2) {
                      try {
                        const { data } = await supabase.functions.invoke("post-to-ads", { body: { action: "check_credentials", agencyId } });
                        if (data?.platforms) setPlatformStatus(data.platforms);
                      } catch {}
                    }
                    setStep(s => s + 1);
                  }
                }}>
                  {step === 2 && !generatedPackage ? <><Sparkles className="h-4 w-4 mr-1" />Generate & Continue</> : <>Next <ArrowRight className="h-4 w-4 ml-1" /></>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CampaignBuilder;
