import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Globe, Plus, Eye, Sparkles, Loader2, BarChart3, ExternalLink, ArrowLeft, Copy, Check } from "lucide-react";
import { useLandingPages, useLandingPageEvents, useAgency } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";

const LandingPages = () => {
  usePageTitle("Landing Pages");
  const { data: pages, isLoading, refetch } = useLandingPages();
  const { data: events } = useLandingPageEvents();
  const { data: agency } = useAgency();
  const { agencyId } = useAuth();
  const all = pages || [];
  const allEvents = events || [];
  const [createOpen, setCreateOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<any>(null);
  const [analyticsPage, setAnalyticsPage] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [language, setLanguage] = useState("english");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-landing-content", {
        body: { agencyId, state: state || agency?.primary_state, county, language },
      });
      if (error) throw error;
      const slug = (title || `${state}-${county}-${language}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
      const { error: insertErr } = await supabase.from("landing_pages").insert({
        agency_id: agencyId!,
        title: title || data?.hero_headline || "New Landing Page",
        slug,
        state: state || null,
        county: county || null,
        language,
        hero_headline: data?.hero_headline || null,
        hero_subheadline: data?.hero_subheadline || null,
        hero_cta_text: data?.hero_cta_text || "Apply Now",
        benefits: data?.benefits || [],
        testimonials: data?.testimonials || [],
        faq: data?.faq || [],
        pay_rate_highlight: data?.pay_rate_highlight || null,
        published: false,
      } as any);
      if (insertErr) throw insertErr;
      toast.success("Landing page created!");
      setCreateOpen(false);
      setTitle(""); setState(""); setCounty(""); setLanguage("english");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to create page");
    }
    setGenerating(false);
  };

  const togglePublish = async (page: any) => {
    const { error } = await supabase.from("landing_pages").update({ published: !page.published }).eq("id", page.id);
    if (error) toast.error("Failed to update");
    else { toast.success(page.published ? "Unpublished" : "Published!"); refetch(); }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/lp/${slug}`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Analytics data for selected page
  const pageEvents = analyticsPage ? allEvents.filter((e: any) => e.landing_page_id === analyticsPage.id) : [];
  const viewEvents = pageEvents.filter((e: any) => e.event_type === "page_view");
  const submitEvents = pageEvents.filter((e: any) => e.event_type === "form_submit");

  // Views per day (last 30 days)
  const viewsByDay = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
    const count = viewEvents.filter((e: any) => e.created_at?.startsWith(date)).length;
    return { date: format(subDays(new Date(), 29 - i), "MMM d"), views: count };
  });

  // UTM breakdown
  const utmSources = viewEvents.reduce((acc: any, e: any) => {
    const src = e.utm_source || "Direct";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const utmData = Object.entries(utmSources).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value);

  const utmMediums = viewEvents.reduce((acc: any, e: any) => {
    const med = e.utm_medium || "None";
    acc[med] = (acc[med] || 0) + 1;
    return acc;
  }, {});
  const mediumData = Object.entries(utmMediums).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value);

  if (analyticsPage) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setAnalyticsPage(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{analyticsPage.title} — Analytics</h1>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Views", value: analyticsPage.views || viewEvents.length },
              { label: "Submissions", value: analyticsPage.form_submissions || submitEvents.length },
              { label: "CVR", value: viewEvents.length > 0 ? `${((submitEvents.length / viewEvents.length) * 100).toFixed(1)}%` : "—" },
              { label: "UTM Sources", value: Object.keys(utmSources).length },
            ].map(k => (
              <Card key={k.label} className="bg-card halevai-border">
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</span>
                  <div className="font-data text-xl font-bold text-foreground">{k.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card halevai-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Views Over Time (30 days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={viewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-card halevai-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Traffic by Source</h3>
                {utmData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={utmData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-sm text-center py-8">No traffic data yet</p>}
              </CardContent>
            </Card>

            <Card className="bg-card halevai-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Traffic by Medium</h3>
                {mediumData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mediumData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-sm text-center py-8">No medium data yet</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Create Page</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Create Landing Page</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Page Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Oregon Caregiver Recruitment" className="bg-secondary border-border" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>State</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="Oregon" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>County</Label><Input value={county} onChange={e => setCounty(e.target.value)} placeholder="Washington" className="bg-secondary border-border" /></div>
                </div>
                <div className="space-y-2"><Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="vietnamese">Vietnamese</SelectItem><SelectItem value="chinese">Chinese</SelectItem><SelectItem value="spanish">Spanish</SelectItem><SelectItem value="russian">Russian</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={generating} className="w-full bg-primary text-primary-foreground">
                  {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating with AI...</> : <><Sparkles className="h-4 w-4 mr-1" />Generate & Create</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <Skeleton className="h-48" /> : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {all.map((p) => (
              <Card key={p.id} className="bg-card halevai-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">{p.title}</h3>
                    <div className="flex items-center gap-2">
                      <Switch checked={!!p.published} onCheckedChange={() => togglePublish(p)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">{p.state || "—"}</Badge>
                    {p.county && <Badge variant="outline" className="text-[10px] border-border">{p.county}</Badge>}
                    <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{(p.language || "en").toUpperCase().slice(0, 2)}</Badge>
                    <Badge className={`text-[10px] ${p.published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>{p.published ? "Live" : "Draft"}</Badge>
                  </div>
                  {p.hero_headline && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.hero_headline}</p>}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div><span className="text-muted-foreground">Views</span><div className="font-data font-bold text-foreground">{(p.views || 0).toLocaleString()}</div></div>
                    <div><span className="text-muted-foreground">Leads</span><div className="font-data font-bold text-primary">{p.form_submissions || 0}</div></div>
                    <div><span className="text-muted-foreground">CVR</span><div className="font-data text-foreground">{(p.views || 0) > 0 ? `${(((p.form_submissions || 0) / (p.views || 1)) * 100).toFixed(1)}%` : "—"}</div></div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setPreviewPage(p)}><Eye className="h-3 w-3 mr-1" />Preview</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setAnalyticsPage(p)}><BarChart3 className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => copyLink(p.slug)}>{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</Button>
                    {p.published && (
                      <Button size="sm" variant="outline" className="text-xs" asChild>
                        <a href={`/lp/${p.slug}`} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3" /></a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {all.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No landing pages yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">Create AI-generated landing pages to convert ad clicks into caregiver applications.</p>
                <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Create Page</Button>
              </div>
            )}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewPage} onOpenChange={() => setPreviewPage(null)}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-foreground">{previewPage?.title}</DialogTitle></DialogHeader>
            {previewPage && (
              <div className="space-y-6">
                <div className="bg-primary/10 rounded-lg p-6 text-center">
                  <h2 className="text-xl font-bold text-foreground mb-2">{previewPage.hero_headline}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{previewPage.hero_subheadline}</p>
                  {previewPage.pay_rate_highlight && <div className="text-2xl font-bold text-primary font-data mb-4">{previewPage.pay_rate_highlight}</div>}
                  <Button className="bg-primary text-primary-foreground">{previewPage.hero_cta_text || "Apply Now"}</Button>
                </div>
                {Array.isArray(previewPage.benefits) && previewPage.benefits.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Benefits</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(previewPage.benefits as any[]).map((b: any, i: number) => (
                        <Card key={i} className="bg-secondary/30"><CardContent className="p-3">
                          <h4 className="font-medium text-foreground text-sm">{b.title}</h4>
                          <p className="text-xs text-muted-foreground">{b.description}</p>
                        </CardContent></Card>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(previewPage.faq) && previewPage.faq.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">FAQ</h3>
                    {(previewPage.faq as any[]).map((f: any, i: number) => (
                      <div key={i} className="mb-3">
                        <h4 className="text-sm font-medium text-foreground">{f.question}</h4>
                        <p className="text-xs text-muted-foreground">{f.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default LandingPages;
