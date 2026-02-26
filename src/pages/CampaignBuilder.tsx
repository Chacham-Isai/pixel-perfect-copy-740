import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PenTool, ArrowRight, ArrowLeft, Sparkles, Check, Loader2, ChevronDown, Download, Save, CheckCircle2, Circle, Info, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgencyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PLATFORM_CATEGORIES = [
  {
    label: "📱 Social Media Ads",
    description: "Paid ads that show up in people's social media feeds — great for reaching caregivers where they already spend time.",
    platforms: [
      { name: "Facebook/Meta Ads", tip: "Best for reaching caregivers 30-55. You choose the area, age, interests — Facebook shows your ad to the right people.", estimated: "5K-50K reach", cpa: "$10-35" },
      { name: "Instagram Ads", tip: "Runs through the same system as Facebook. Great for younger caregivers with visual ads.", estimated: "3K-20K reach", cpa: "$12-40" },
      { name: "TikTok Ads", tip: "Short video ads. Huge reach with younger audiences. Low cost per click.", estimated: "5K-100K reach", cpa: "$8-25" },
      { name: "LinkedIn Ads", tip: "Best for experienced/certified caregivers. Higher cost but higher quality leads.", estimated: "500-5K reach", cpa: "$30-70" },
      { name: "Nextdoor Ads", tip: "Hyper-local neighborhood ads. People trust Nextdoor for local services.", estimated: "1K-10K reach", cpa: "$15-40" },
    ],
  },
  {
    label: "🔍 Search Engine Ads",
    description: "Your ad appears when someone searches Google or Bing for caregiver jobs in your area. You only pay when they click.",
    platforms: [
      { name: "Google Ads (Search)", tip: "Shows your ad at the top of Google when someone searches 'caregiver jobs near me'. The #1 way people find jobs online.", estimated: "1K-10K reach", cpa: "$20-50" },
      { name: "Google Ads (Display)", tip: "Banner ads that appear on websites across the internet. Good for brand awareness.", estimated: "10K-100K reach", cpa: "$5-20" },
      { name: "Bing/Microsoft Ads", tip: "Same concept as Google Ads but on Bing. Lower competition = cheaper clicks. Often used by older demographics.", estimated: "500-5K reach", cpa: "$15-40" },
      { name: "YouTube Ads", tip: "Video ads that play before YouTube videos. Great for showing what it's like to work for your agency.", estimated: "5K-50K reach", cpa: "$10-30" },
    ],
  },
  {
    label: "🌐 SEO & Organic",
    description: "Free traffic from search engines. Takes longer to build but costs nothing per click. Halevai builds this for you automatically.",
    platforms: [
      { name: "Google for Jobs", tip: "Your job listing appears directly in Google search results for free. Halevai auto-formats your postings.", estimated: "500-5K reach", cpa: "Free" },
      { name: "SEO Landing Pages", tip: "Custom pages optimized to rank on Google for searches like 'caregiver jobs in [your county]'. Halevai builds these.", estimated: "100-2K/mo reach", cpa: "Free" },
      { name: "Google Business Profile", tip: "Your agency's Google listing. When people search your agency name, this is what they see. Builds trust.", estimated: "200-2K reach", cpa: "Free" },
    ],
  },
  {
    label: "💼 Job Boards",
    description: "Websites where people specifically go to look for jobs. Caregivers actively searching will find your listing here.",
    platforms: [
      { name: "Indeed", tip: "The #1 job site. Most caregivers check Indeed first. Sponsored listings get 3-5x more applicants.", estimated: "500-2K reach", cpa: "$15-40" },
      { name: "ZipRecruiter", tip: "Sends your listing to 100+ job boards at once. AI matches your posting with qualified candidates.", estimated: "300-1.5K reach", cpa: "$20-50" },
      { name: "Care.com", tip: "Specifically for caregiving jobs. Pre-qualified candidates who already have caregiving experience.", estimated: "200-800 reach", cpa: "$25-60" },
      { name: "Craigslist", tip: "Free to post in most areas. Simple and effective, especially in urban markets.", estimated: "100-500 reach", cpa: "Free" },
      { name: "Glassdoor", tip: "Job seekers research companies here. Good reviews + job listings = more trust.", estimated: "200-1K reach", cpa: "$30-60" },
    ],
  },
  {
    label: "🏘️ Community & Grassroots",
    description: "Offline and local outreach. Lower tech, but builds deep trust in communities where many caregivers come from.",
    platforms: [
      { name: "Churches/Cultural Centers", tip: "Flyers and announcements at local churches, temples, community centers. Especially effective in immigrant communities.", estimated: "50-200 reach", cpa: "$0-5" },
      { name: "Senior Centers", tip: "Post flyers where family caregivers already visit. They often know others who'd be interested.", estimated: "30-100 reach", cpa: "$0-5" },
      { name: "Job Fairs", tip: "Set up a table at local job fairs. Meet candidates face-to-face. Halevai generates your materials.", estimated: "100-500 reach", cpa: "$10-30" },
      { name: "Community Events", tip: "Sponsor or attend local events. Great for word-of-mouth in your target neighborhoods.", estimated: "50-300 reach", cpa: "$5-20" },
      { name: "Employee Referrals", tip: "Your current caregivers refer friends/family. Highest quality hires. Halevai tracks the referral bonus.", estimated: "10-50 reach", cpa: "$200/hire" },
    ],
  },
];

const ALL_PLATFORMS = PLATFORM_CATEGORIES.flatMap(c => c.platforms);

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
    const names = ALL_PLATFORMS.filter(p => cat === "paid" ? p.cpa !== "Free" && p.cpa !== "$0-5" : p.cpa === "Free" || p.cpa === "$0-5").map(p => p.name);
    setSelectedPlatforms(prev => [...new Set([...prev, ...names])]);
  };
  const selectCategory = (catLabel: string) => {
    const cat = PLATFORM_CATEGORIES.find(c => c.label === catLabel);
    if (!cat) return;
    const names = cat.platforms.map(p => p.name);
    const allSelected = names.every(n => selectedPlatforms.includes(n));
    if (allSelected) setSelectedPlatforms(prev => prev.filter(p => !names.includes(p)));
    else setSelectedPlatforms(prev => [...new Set([...prev, ...names])]);
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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/campaigns">Campaigns</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Campaign Builder</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
              <TooltipProvider delayDuration={200}>
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Select Platforms</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectAll("paid")} className="gap-1"><Zap className="h-3 w-3" />Select All Paid</Button>
                    <Button size="sm" variant="outline" onClick={() => selectAll("free")} className="gap-1">Select All Free</Button>
                  </div>
                </div>

                {/* Sticky selection summary */}
                {selectedPlatforms.length > 0 && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground font-medium">{selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""} selected</span>
                      <span className="text-xs text-muted-foreground">— {selectedPlatforms.slice(0, 3).join(", ")}{selectedPlatforms.length > 3 ? ` +${selectedPlatforms.length - 3} more` : ""}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive" onClick={() => setSelectedPlatforms([])}>Clear All</Button>
                  </div>
                )}

                <div className="space-y-5">
                  {PLATFORM_CATEGORIES.map(cat => {
                    const catNames = cat.platforms.map(p => p.name);
                    const selectedInCat = catNames.filter(n => selectedPlatforms.includes(n)).length;
                    return (
                      <div key={cat.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{cat.label}</h3>
                            <p className="text-xs text-muted-foreground max-w-xl">{cat.description}</p>
                          </div>
                          <Button size="sm" variant={selectedInCat === catNames.length ? "default" : "outline"} className="text-xs shrink-0 gap-1" onClick={() => selectCategory(cat.label)}>
                            {selectedInCat === catNames.length ? <><Check className="h-3 w-3" />All Selected</> : <>Select All ({catNames.length})</>}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {cat.platforms.map(p => {
                            const isSelected = selectedPlatforms.includes(p.name);
                            return (
                              <Tooltip key={p.name}>
                                <TooltipTrigger asChild>
                                  <Card
                                    onClick={() => {
                                      togglePlatform(p.name);
                                      if (!isSelected) toast.success(`${p.name} added`, { duration: 1500 });
                                    }}
                                    className={`cursor-pointer transition-all duration-200 p-3 relative group ${
                                      isSelected
                                        ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]"
                                        : "bg-secondary/30 halevai-border hover:border-primary/40 hover:bg-secondary/50"
                                    }`}
                                  >
                                    {/* Selection indicator */}
                                    <div className={`absolute top-2 right-2 transition-all duration-200 ${isSelected ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-30"}`}>
                                      {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <div className="text-sm font-medium text-foreground pr-5">{p.name}</div>
                                    <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{p.tip}</div>
                                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50">
                                      <span className="text-[10px] text-muted-foreground">{p.estimated}</span>
                                      <span className={`text-[10px] font-data font-bold ${p.cpa === "Free" || p.cpa === "$0-5" ? "text-green-400" : "text-primary"}`}>{p.cpa}</span>
                                    </div>
                                  </Card>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs font-medium">{p.name}</p>
                                  <p className="text-xs text-muted-foreground">{p.tip}</p>
                                  <p className="text-xs mt-1">Est. reach: <strong>{p.estimated}</strong> · Cost: <strong>{p.cpa}</strong></p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedPlatforms.length === 0 && (
                  <div className="text-center py-4 bg-secondary/20 rounded-lg border border-dashed border-border">
                    <Info className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Click on any platform card to select it</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Or use "Select All" buttons above for quick selection</p>
                  </div>
                )}
              </div>
              </TooltipProvider>
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
