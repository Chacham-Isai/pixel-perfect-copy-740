import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, X, ArrowRight } from "lucide-react";
import { useRecommendations } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const priorityColor = (p: string | null) => p === "high" ? "bg-red-500/20 text-red-400" : p === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400";

const Recommendations = () => {
  const { data: recs, isLoading } = useRecommendations();
  const all = recs || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Recommendations</h1>
          </div>
          <Badge className="bg-primary/20 text-primary font-data">{all.filter(r => r.status === "pending").length} pending</Badge>
        </div>

        {isLoading ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}</div> : (
          <div className="space-y-3">
            {all.map((r) => (
              <Card key={r.id} className="bg-card halevai-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
                        <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{r.category}</Badge>
                        {r.status === "approved" && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Approved</Badge>}
                      </div>
                      <h3 className="font-semibold text-foreground">{r.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      <p className="text-xs text-primary font-data mt-2">Estimated Impact: {r.impact_estimate}</p>
                    </div>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="bg-primary text-primary-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline"><ArrowRight className="h-3 w-3 mr-1" /> Execute Now</Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground"><X className="h-3 w-3 mr-1" /> Dismiss</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {all.length === 0 && <p className="text-center text-muted-foreground py-8">No recommendations yet</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Recommendations;
