import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, TrendingUp, Star } from "lucide-react";
import { useCompetitors } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const Competitors = () => {
  const { data: competitors, isLoading } = useCompetitors();
  const all = competitors || [];
  const avgMarketPay = all.length > 0 ? (all.reduce((s, c) => s + ((c.pay_rate_min || 0) + (c.pay_rate_max || 0)) / 2, 0) / all.length).toFixed(2) : "0";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Competitor Intelligence</h1>
        </div>

        <Card className="bg-card halevai-border halevai-bg-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Pay Rate</p>
                <div className="font-data text-4xl font-bold text-primary">$22/hr</div>
                <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4" /> Highest in market
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Market Average</p>
                <div className="font-data text-2xl font-bold text-foreground">${avgMarketPay}/hr</div>
                <p className="text-xs text-muted-foreground mt-1">Based on {all.length} competitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? <Skeleton className="h-48" /> : (
          <Card className="bg-card halevai-border">
            <CardHeader><CardTitle className="text-lg">Competitor Tracker</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Competitor</TableHead><TableHead>State</TableHead><TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead><TableHead>Pay Range</TableHead><TableHead>Est. Spend</TableHead><TableHead>Threat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((c) => {
                    const threat = (c.pay_rate_max || 0) >= 19 ? "high" : (c.pay_rate_max || 0) >= 17 ? "medium" : "low";
                    return (
                      <TableRow key={c.id} className="border-border hover:bg-secondary/30">
                        <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{c.state || "—"}</Badge></TableCell>
                        <TableCell className="font-data"><span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> {c.avg_rating ?? "—"}</span></TableCell>
                        <TableCell className="font-data text-muted-foreground">{c.review_count ?? 0}</TableCell>
                        <TableCell className="font-data text-foreground">${c.pay_rate_min}-${c.pay_rate_max}/hr</TableCell>
                        <TableCell className="font-data text-muted-foreground">${(c.estimated_monthly_spend || 0).toLocaleString()}/mo</TableCell>
                        <TableCell>
                          <Badge className={threat === "high" ? "bg-red-500/20 text-red-400" : threat === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}>{threat}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {all.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No competitors tracked yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Competitors;
