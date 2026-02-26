import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Image, Sparkles, Loader2, Download, Trash2, ArrowLeftRight } from "lucide-react";
import { useAdCreatives } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";

const AdCreatives = () => {
  usePageTitle("Ad Creatives");
  const { data: creatives, isLoading, refetch } = useAdCreatives();
  const { agencyId } = useAuth();
  const qc = useQueryClient();
  const all = creatives || [];
  const [genOpen, setGenOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("Facebook Feed (1200×628)");
  const [generating, setGenerating] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-creative", {
        body: { agencyId, prompt, platform },
      });
      if (error) throw error;
      await supabase.from("ad_creatives").insert({
        agency_id: agencyId!,
        headline: data?.headline || "",
        body_copy: data?.body_copy || "",
        prompt,
        image_url: data?.image_url || null,
      } as any);
      toast.success("Creative generated!");
      setGenOpen(false);
      setPrompt("");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setGenerating(false);
  };

  const handleAutoPrompt = () => {
    setPrompt("Warm, professional photo of a diverse caregiver helping an elderly person at home. Bright natural lighting, genuine smiles. Include text overlay space for $21/hr headline. Home care agency branding.");
  };

  const handleDownload = (c: any) => {
    const content = `HEADLINE:\n${c.headline || ""}\n\nBODY COPY:\n${c.body_copy || ""}\n\nPROMPT:\n${c.prompt || ""}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creative-${(c.headline || "untitled").slice(0, 30).replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (c.image_url) {
      window.open(c.image_url, "_blank");
    }
    toast.success("Creative downloaded");
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("ad_creatives").delete().eq("id", id);
      if (error) throw error;
      toast.success("Creative deleted");
      qc.invalidateQueries({ queryKey: ["ad_creatives"] });
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]);
  };

  const compareCreatives = compareIds.map(id => all.find(c => c.id === id)).filter(Boolean);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Ad Creatives</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCompareMode(!compareMode)}>
              <ArrowLeftRight className="h-4 w-4 mr-1" /> {compareMode ? "Exit Compare" : "A/B Compare"}
            </Button>
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4 mr-1" /> Generate Creative</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="text-foreground">Generate Ad Creative</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Creative Prompt</Label>
                    <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe what you want..." className="bg-secondary border-border min-h-[100px]" />
                    <Button size="sm" variant="outline" onClick={handleAutoPrompt}><Sparkles className="h-3 w-3 mr-1" /> Auto-Prompt</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Size</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Facebook Feed (1200×628)">Facebook Feed (1200×628)</SelectItem>
                        <SelectItem value="Instagram Square (1080×1080)">Instagram Square (1080×1080)</SelectItem>
                        <SelectItem value="Instagram Story (1080×1920)">Instagram Story (1080×1920)</SelectItem>
                        <SelectItem value="Google Display (300×250)">Google Display (300×250)</SelectItem>
                        <SelectItem value="LinkedIn (1200×627)">LinkedIn (1200×627)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full bg-primary text-primary-foreground">
                    {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-1" />Generate</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {compareMode && compareCreatives.length === 2 && (
          <Card className="bg-card halevai-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">A/B Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                {compareCreatives.map((c: any) => (
                  <div key={c.id} className="space-y-2">
                    <div className="h-32 bg-secondary/50 rounded-lg flex items-center justify-center">
                      {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover rounded-lg" /> : <Image className="h-8 w-8 text-muted-foreground/30" />}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">{c.headline}</h4>
                    <p className="text-xs text-muted-foreground">{c.body_copy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}</div> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {all.map((c) => (
              <Card key={c.id} className={`bg-card halevai-border hover:border-primary/30 transition-colors ${compareMode && compareIds.includes(c.id) ? "border-primary ring-1 ring-primary/30" : ""}`} onClick={compareMode ? () => toggleCompare(c.id) : undefined}>
                <CardContent className="p-4">
                  <div className="h-32 bg-secondary/50 rounded-lg mb-3 flex items-center justify-center">
                    {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover rounded-lg" /> : <Image className="h-8 w-8 text-muted-foreground/30" />}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{c.headline}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.body_copy}</p>
                  {c.prompt && <p className="text-[10px] text-muted-foreground/50 mb-2 line-clamp-1">Prompt: {c.prompt}</p>}
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); handleDownload(c); }}><Download className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" className="text-xs text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {all.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-3">No ad creatives yet. Click "Generate Creative" to get started.</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdCreatives;
