import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Plus, Facebook, Instagram, Linkedin, List, Grid3X3, Sparkles, Loader2, ChevronLeft, ChevronRight, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { useContentPosts } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, addDays } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";

const platformIcon = (p: string | null) => {
  switch (p) {
    case "facebook": return <Facebook className="h-3 w-3 text-blue-400" />;
    case "instagram": return <Instagram className="h-3 w-3 text-pink-400" />;
    case "linkedin": return <Linkedin className="h-3 w-3 text-blue-300" />;
    default: return null;
  }
};

const ContentCalendar = () => {
  usePageTitle("Content Calendar");
  const { data: posts, isLoading, refetch } = useContentPosts();
  const { agencyId } = useAuth();
  const all = posts || [];
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [genOpen, setGenOpen] = useState(false);
  const [genPlatforms, setGenPlatforms] = useState<string[]>(["facebook"]);
  const [genTopic, setGenTopic] = useState("caregiver recruitment");
  const [genState, setGenState] = useState("Oregon");
  const [genLanguage, setGenLanguage] = useState("english");
  const [genCount, setGenCount] = useState("3");
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingDays = (startDay + 6) % 7;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { agencyId, platforms: genPlatforms, topic: genTopic, state: genState, language: genLanguage, count: Number(genCount) },
      });
      if (error) throw error;
      const generatedPosts = data?.posts || [];
      for (const p of generatedPosts) {
        await supabase.from("content_posts").insert({
          agency_id: agencyId!,
          title: p.title,
          body: p.body,
          platform: p.platform?.toLowerCase(),
          hashtags: p.hashtags || [],
          status: "draft",
          ai_generated: true,
          state: genState,
          language: genLanguage,
          scheduled_date: null,
        } as any);
      }
      toast.success(`${generatedPosts.length} posts generated!`);
      setGenOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setGenerating(false);
  };

  const togglePlatform = (p: string) => {
    setGenPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const selectAll = () => {
    if (selectedIds.length === all.length) setSelectedIds([]);
    else setSelectedIds(all.map(p => p.id));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) { toast.error("Select posts first"); return; }
    
    if (action === "delete") {
      for (const id of selectedIds) {
        await supabase.from("content_posts").delete().eq("id", id);
      }
      toast.success(`${selectedIds.length} posts deleted`);
    } else if (action === "publish") {
      for (const id of selectedIds) {
        await supabase.from("content_posts").update({ status: "published" }).eq("id", id);
      }
      toast.success(`${selectedIds.length} posts published`);
    } else if (action === "schedule") {
      // Auto-schedule: spread across next 7 days
      for (let i = 0; i < selectedIds.length; i++) {
        const date = format(addDays(new Date(), Math.floor(i / 2) + 1), "yyyy-MM-dd");
        await supabase.from("content_posts").update({ status: "scheduled", scheduled_date: date }).eq("id", selectedIds[i]);
      }
      toast.success(`${selectedIds.length} posts scheduled over next week`);
    } else if (action === "draft") {
      for (const id of selectedIds) {
        await supabase.from("content_posts").update({ status: "draft" }).eq("id", id);
      }
      toast.success(`${selectedIds.length} posts set to draft`);
    }
    setSelectedIds([]);
    refetch();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(v => v === "calendar" ? "list" : "calendar")}>
              {view === "calendar" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4 mr-1" /> Generate Posts</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="text-foreground">Generate Content</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="flex gap-2">
                      {["facebook", "instagram", "linkedin", "tiktok"].map(p => (
                        <Button key={p} size="sm" variant={genPlatforms.includes(p) ? "default" : "outline"} onClick={() => togglePlatform(p)} className="capitalize">{p}</Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Topic</Label>
                    <Select value={genTopic} onValueChange={setGenTopic}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caregiver recruitment">Caregiver Recruitment</SelectItem>
                        <SelectItem value="caregiver testimonial">Caregiver Testimonial</SelectItem>
                        <SelectItem value="pay rate highlight">Pay Rate Highlight</SelectItem>
                        <SelectItem value="family caregiving tips">Family Caregiving Tips</SelectItem>
                        <SelectItem value="hiring announcement">Hiring Announcement</SelectItem>
                        <SelectItem value="community event">Community Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>State</Label><Input value={genState} onChange={e => setGenState(e.target.value)} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Language</Label>
                      <Select value={genLanguage} onValueChange={setGenLanguage}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="vietnamese">Vietnamese</SelectItem><SelectItem value="chinese">Chinese</SelectItem><SelectItem value="spanish">Spanish</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Number of Posts</Label><Input type="number" min="1" max="10" value={genCount} onChange={e => setGenCount(e.target.value)} className="bg-secondary border-border" /></div>
                  <Button onClick={handleGenerate} disabled={generating} className="w-full bg-primary text-primary-foreground">
                    {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-1" />Generate {genCount} Posts</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm text-foreground font-medium">{selectedIds.length} post{selectedIds.length > 1 ? "s" : ""} selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("schedule")}><Clock className="h-3 w-3 mr-1" />Auto-Schedule</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("publish")}><CheckCircle2 className="h-3 w-3 mr-1" />Publish</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("draft")}>Set Draft</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleBulkAction("delete")}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? <Skeleton className="h-64" /> : view === "calendar" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h2 className="font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
              ))}
              {Array(paddingDays).fill(0).map((_, i) => <div key={`pad-${i}`} className="min-h-[80px]" />)}
              {daysInMonth.map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayPosts = all.filter(p => p.scheduled_date === dateStr);
                return (
                  <div key={dateStr} className={`min-h-[80px] rounded-lg p-1 border ${isToday(day) ? "border-primary/40 bg-primary/5" : "border-border/30"}`}>
                    <div className="text-xs text-muted-foreground mb-1">{format(day, "d")}</div>
                    {dayPosts.slice(0, 3).map(p => (
                      <div key={p.id} className="text-[9px] bg-secondary/50 rounded px-1 py-0.5 mb-0.5 truncate flex items-center gap-0.5">
                        {platformIcon(p.platform)}
                        <span className="text-foreground truncate">{p.title}</span>
                      </div>
                    ))}
                    {dayPosts.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayPosts.length - 3} more</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="bg-card halevai-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-8"><Checkbox checked={selectedIds.length === all.length && all.length > 0} onCheckedChange={selectAll} /></TableHead>
                    <TableHead>Title</TableHead><TableHead>Platform</TableHead><TableHead>Status</TableHead>
                    <TableHead>Date</TableHead><TableHead>State</TableHead><TableHead>Language</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-secondary/30">
                      <TableCell><Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} /></TableCell>
                      <TableCell className="font-medium text-foreground">{p.title}</TableCell>
                      <TableCell><div className="flex items-center gap-1">{platformIcon(p.platform)}<span className="text-muted-foreground capitalize">{p.platform}</span></div></TableCell>
                      <TableCell><Badge className={p.status === "published" ? "bg-green-500/20 text-green-400" : p.status === "scheduled" ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"}>{p.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.scheduled_date || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{p.state || "—"}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{(p.language || "en").toUpperCase().slice(0, 2)}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {all.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-1">No content yet</h3>
                          <p className="text-sm text-muted-foreground max-w-md mb-4">Generate AI-powered social media posts for your caregiver recruitment campaigns.</p>
                          <Button onClick={() => setGenOpen(true)} className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4 mr-1" /> Generate Posts</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ContentCalendar;
