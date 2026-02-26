import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Play, Loader2, MessageSquare, Search, ClipboardList, Star, Brain, CheckCircle2, AlertCircle, Clock, ExternalLink, Copy, Info } from "lucide-react";
import { useAutomations, useToggleAutomation, useAgentActivityLog } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const categoryConfig: Record<string, { label: string; icon: typeof Zap }> = {
  messaging: { label: "Messaging", icon: MessageSquare },
  recruitment: { label: "Recruitment Agents", icon: Search },
  enrollment: { label: "Enrollment", icon: ClipboardList },
  reviews: { label: "Reviews", icon: Star },
  intelligence: { label: "Intelligence", icon: Brain },
  general: { label: "General", icon: Zap },
};

const automationCategory: Record<string, string> = {
  auto_welcome_sms: "messaging",
  auto_followup_sms: "messaging",
  process_sequences: "messaging",
  follow_up_reminders: "messaging",
  auto_source_candidates: "recruitment",
  auto_outreach_high_match: "recruitment",
  auto_screen_responded: "recruitment",
  lead_scoring: "enrollment",
  stale_enrollment_alerts: "enrollment",
  background_check_reminder: "enrollment",
  auth_expiry_alert: "enrollment",
  auto_review_request: "reviews",
  competitor_monitoring: "intelligence",
  performance_alerts: "intelligence",
};

const scheduledJobs = [
  { key: "automations", label: "Run Automations", cadence: "Every 15 min", cron: "*/15 * * * *", desc: "Follow-ups, welcome SMS, enrollment alerts" },
  { key: "briefing", label: "Daily Briefing", cadence: "Daily 7 AM", cron: "0 7 * * *", desc: "Generate morning performance report" },
  { key: "scoring", label: "Lead Scoring", cadence: "Every 30 min", cron: "*/30 * * * *", desc: "Score unscored caregivers" },
  { key: "sequences", label: "Process Sequences", cadence: "Every 15 min", cron: "*/15 * * * *", desc: "Advance active sequence enrollments" },
];

const Automations = () => {
  usePageTitle("Automations");
  const { data: automations, isLoading } = useAutomations();
  const toggleMutation = useToggleAutomation();
  const { agencyId, isViewer } = useAuth();
  const qc = useQueryClient();
  const all = automations || [];
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<{ key: string; actions: number }[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { data: agentActivity } = useAgentActivityLog();

  // Get last run timestamps for cron jobs from agent_activity_log
  const cronLastRuns: Record<string, string | null> = {};
  scheduledJobs.forEach(j => {
    const match = (agentActivity || []).find((a: any) => a.action === `cron_${j.key}` && a.success);
    cronLastRuns[j.key] = match?.created_at || null;
  });

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cron-trigger`;

  const copyUrl = (job: string) => {
    const url = `${baseUrl}?job=${job}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleRunNow = async () => {
    if (!agencyId) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-automations", {
        body: { agencyId },
      });
      if (error) throw error;
      // Response is { results: [{ agency, results: [{key, actions}] }] }
      const agencyResults = (data?.results || []).flatMap((r: any) => r.results || []);
      const totalActions = agencyResults.reduce((s: number, r: any) => s + (r.actions || 0), 0);
      setRunResults(agencyResults);
      setShowResults(true);
      // Refresh automations data to show updated last_run_at and actions_this_week
      qc.invalidateQueries({ queryKey: ["automations"] });
      if (totalActions > 0) {
        toast.success(`Automations complete: ${totalActions} actions taken`);
      } else {
        toast.info("Automations ran — no new actions needed right now");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to run automations");
    }
    setRunning(false);
  };

  // Group by category
  const grouped: Record<string, typeof all> = {};
  all.forEach((a) => {
    const cat = automationCategory[a.automation_key] || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });

  const categoryOrder = ["messaging", "recruitment", "enrollment", "reviews", "intelligence", "general"];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Automations</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary font-data">
                {all.filter(a => a.active).length} / {all.length} Active
              </Badge>
              {!isViewer && (
                <Button size="sm" onClick={handleRunNow} disabled={running} className="bg-primary text-primary-foreground">
                  {running ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Running...</> : <><Play className="h-4 w-4 mr-1" />Run Now</>}
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Toggle automations on/off to let Halevai AI handle repetitive tasks — lead scoring, follow-ups, alerts, and more.</p>
        </div>

        {/* Automation Schedule Card */}
        <Card className="bg-card halevai-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Scheduled Jobs
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowSetup(true)}>
                <Info className="h-3.5 w-3.5 mr-1" /> Setup Guide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {scheduledJobs.map(j => (
                <div key={j.key} className="bg-secondary/30 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{j.label}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyUrl(j.key)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy cron URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{j.desc}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-data">{j.cadence}</Badge>
                    {cronLastRuns[j.key] ? (
                      <span className="text-[10px] text-green-400 font-data">
                        {new Date(cronLastRuns[j.key]!).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">Never run</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {isLoading ? <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div> : (
          <div className="space-y-6">
            {categoryOrder.filter(cat => grouped[cat]?.length).map((cat) => {
              const cfg = categoryConfig[cat] || categoryConfig.general;
              const Icon = cfg.icon;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cfg.label}</h2>
                  </div>
                  <div className="grid gap-3">
                    {grouped[cat].map((a) => (
                      <Card key={a.id} className={`bg-card halevai-border transition-colors ${a.active ? "border-primary/20" : ""}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{a.label}</span>
                              {a.active && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Active</Badge>}
                              {a.last_run_at && (
                                <span className="text-[10px] text-muted-foreground font-data ml-2">
                                  Last run: {new Date(a.last_run_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                            {(a.actions_this_week || 0) > 0 && (
                              <p className="text-[10px] text-primary font-data mt-1">{a.actions_this_week} actions this week</p>
                            )}
                          </div>
                          <Switch
                            checked={a.active ?? false}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: a.id, active: checked })}
                            disabled={isViewer}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
            {all.length === 0 && <p className="text-center text-muted-foreground py-8">No automations configured</p>}
          </div>
        )}


        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Automation Run Results
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {runResults?.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No active automations to run.</p>
              )}
              {runResults?.map((r, i) => {
                const matchedAuto = all.find(a => a.automation_key === r.key);
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                    <span className="text-sm text-foreground">{matchedAuto?.label || r.key}</span>
                    <div className="flex items-center gap-1.5">
                      {r.actions > 0 ? (
                        <Badge className="bg-primary/20 text-primary text-xs">{r.actions} action{r.actions !== 1 ? "s" : ""}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No action needed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {runResults?.reduce((s, r) => s + r.actions, 0) || 0} actions across {runResults?.length || 0} automations
            </p>
          </DialogContent>
        </Dialog>

        {/* Setup Guide Dialog */}
        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Cron Job Setup Guide
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                To run automations on a schedule, set up external cron triggers using a free service like{" "}
                <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  cron-job.org <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <div className="space-y-3">
                {scheduledJobs.map(j => (
                  <div key={j.key} className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{j.label}</span>
                      <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-data">{j.cron}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-muted-foreground flex-1 truncate font-data">
                        GET {baseUrl}?job={j.key}
                      </code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyUrl(j.key)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Required header:</strong>{" "}
                <code className="font-data">x-cron-secret: YOUR_SECRET</code>
                <p className="mt-1">Set your CRON_SECRET in Settings → Integrations, then add it as a header in your cron service.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Automations;
