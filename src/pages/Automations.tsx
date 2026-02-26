import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Play, Loader2 } from "lucide-react";
import { useAutomations, useToggleAutomation } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Automations = () => {
  const { data: automations, isLoading } = useAutomations();
  const toggleMutation = useToggleAutomation();
  const { agencyId, isViewer } = useAuth();
  const all = automations || [];
  const [running, setRunning] = useState(false);

  const handleRunNow = async () => {
    if (!agencyId) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-automations", {
        body: { agencyId },
      });
      if (error) throw error;
      const totalActions = (data?.results || []).reduce((s: number, r: any) => s + r.actions, 0);
      toast.success(`Automations complete: ${totalActions} actions taken`);
    } catch (e: any) {
      toast.error(e.message || "Failed to run automations");
    }
    setRunning(false);
  };

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

        {isLoading ? <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div> : (
          <div className="grid gap-3">
            {all.map((a) => (
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
            {all.length === 0 && <p className="text-center text-muted-foreground py-8">No automations configured</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Automations;
