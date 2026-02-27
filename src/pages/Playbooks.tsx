import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Clock, DollarSign, TrendingUp, Play, Loader2, CheckCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePlaybooks } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

const categoryColors: Record<string, string> = {
  recruitment: "border-blue-400/30 text-blue-400",
  marketing: "border-green-400/30 text-green-400",
  community: "border-yellow-400/30 text-yellow-400",
  competitive: "border-red-400/30 text-red-400",
  operations: "border-purple-400/30 text-purple-400",
  retention: "border-cyan-400/30 text-cyan-400",
};

const Playbooks = () => {
  usePageTitle("Playbooks");
  const { data: playbooks, isLoading } = usePlaybooks();
  const { agencyId } = useAuth();
  const all = playbooks || [];
  const [executing, setExecuting] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = all.filter(p => {
    if (filter !== "all" && p.category !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = ["all", ...new Set(all.map(p => p.category).filter(Boolean))];

  const handleExecute = async (playbook: any) => {
    setExecuting(playbook.id);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-optimizer", {
        body: { mode: "playbook_execution", agencyId, playbookId: playbook.id },
      });
      if (error) throw error;
      setExecResult(data?.result);
      toast.success("Playbook executed! Campaigns and recommendations created.");
    } catch (e: any) {
      toast.error(e.message || "Execution failed");
    }
    setExecuting(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Growth Playbooks</h1>
          </div>
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search playbooks..." className="bg-secondary border-border pl-9" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)} className="capitalize">{c}</Button>
          ))}
        </div>

        {isLoading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}</div> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const stepsArr = Array.isArray(p.steps) ? p.steps : [];
              return (
                <Card key={p.id} className="bg-card halevai-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className={categoryColors[p.category || ""] || "border-primary/30 text-primary"}>{p.category}</Badge>
                      <span className="text-xs text-muted-foreground font-data">{stepsArr.length} steps</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.description}</p>
                    {p.best_for && <p className="text-xs text-accent mb-3">Best for: {p.best_for}</p>}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {p.estimated_time || "—"}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" /> {p.estimated_cost || "—"}</div>
                      <div className="flex items-center gap-1 text-xs text-primary"><TrendingUp className="h-3 w-3" /> {p.estimated_results || "—"}</div>
                    </div>
                    <Button size="sm" className="w-full bg-primary text-primary-foreground" onClick={() => handleExecute(p)} disabled={executing === p.id}>
                      {executing === p.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Executing...</> : <><Play className="h-3 w-3 mr-1" /> Execute Playbook</>}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No playbooks yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">Growth playbooks with step-by-step strategies will appear here. They provide one-click execution of campaigns, landing pages, and messaging sequences.</p>
              </div>
            )}
          </div>
        )}

        {/* Execution Result Dialog */}
        <Dialog open={!!execResult} onOpenChange={() => setExecResult(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-400" /> Playbook Executed</DialogTitle></DialogHeader>
            {execResult && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{execResult.execution_summary}</p>
                {execResult.campaigns_to_create?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Campaigns Created</h4>
                    {execResult.campaigns_to_create.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                        <CheckCircle className="h-3 w-3 text-green-400" /> {c.campaign_name} ({c.channel})
                      </div>
                    ))}
                  </div>
                )}
                {execResult.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Recommendations</h4>
                    {execResult.recommendations.map((r: any, i: number) => (
                      <div key={i} className="text-sm text-muted-foreground py-1">
                        <span className="text-foreground">{r.title}</span> — {r.description}
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

export default Playbooks;
