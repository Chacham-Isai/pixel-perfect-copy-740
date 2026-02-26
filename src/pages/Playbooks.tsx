import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, DollarSign, TrendingUp, Play } from "lucide-react";
import { usePlaybooks } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const Playbooks = () => {
  const { data: playbooks, isLoading } = usePlaybooks();
  const all = playbooks || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Growth Playbooks</h1>
        </div>

        {isLoading ? <div className="grid md:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}</div> : (
          <div className="grid md:grid-cols-2 gap-4">
            {all.map((p) => {
              const stepsArr = Array.isArray(p.steps) ? p.steps : [];
              return (
                <Card key={p.id} className="bg-card halevai-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="border-primary/30 text-primary">{p.category}</Badge>
                      <span className="text-xs text-muted-foreground font-data">{stepsArr.length} steps</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {p.estimated_time}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" /> {p.estimated_cost}</div>
                      <div className="flex items-center gap-1 text-xs text-primary"><TrendingUp className="h-3 w-3" /> {p.estimated_results}</div>
                    </div>
                    <Button size="sm" className="w-full bg-primary text-primary-foreground">
                      <Play className="h-3 w-3 mr-1" /> Execute Playbook
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {all.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">No playbooks yet</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Playbooks;
