import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";
import { useAutomations, useToggleAutomation } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const Automations = () => {
  const { data: automations, isLoading } = useAutomations();
  const toggleMutation = useToggleAutomation();
  const all = automations || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Automations</h1>
          </div>
          <Badge className="bg-primary/20 text-primary font-data">
            {all.filter(a => a.active).length} / {all.length} Active
          </Badge>
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
                    </div>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <Switch
                    checked={a.active ?? false}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: a.id, active: checked })}
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
