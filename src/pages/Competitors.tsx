import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, TrendingUp, Star, Loader2, Brain, RefreshCw, DollarSign, ArrowUpRight } from "lucide-react";
import { useCompetitors, usePayRateIntel } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Competitors = () => {
  const { data: competitors, isLoading } = useCompetitors();
  const { data: rateIntel, isLoading: loadingIntel } = usePayRateIntel();
  const { agencyId } = useAuth();
  const qc = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  const all = competitors || [];
  const avgMarketPay = all.length > 0
    ? (all.reduce((s, c) => s + ((c.pay_rate_min || 0) + (c.pay_rate_max || 0)) / 2, 0) / all.length).toFixed(2)
    : "0";

  const handleAnalyze = async () => {
    if (!agencyId) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-pay-rates", {
        body: { agency_id: agencyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Pay rate analysis complete!");
      qc.invalidateQueries({ queryKey: ["pay_rate_intel"] });
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    }
    setAnalyzing(false);
  };

  const recommendedRate = rateIntel?.recommended_rate;
  const medicaidRate = rateIntel?.medicaid_reimbursement_rate;
  const marketAvg = rateIntel?.market_avg_rate;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Competitor Intelligence</h1>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-primary text-primary-foreground"
          >
            {analyzing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing Market...</>
            ) : (
              <><Brain className="h-4 w-4 mr-2" />{rateIntel ? "Re-analyze Rates" : "Analyze Pay Rates"}</>
            )}
          </Button>
        </div>

        {/* Pay Rate Intelligence Card */}
        <Card className="bg-card halevai-border halevai-bg-gradient">
          <CardContent className="p-6">
            {loadingIntel ? (
              <Skeleton className="h-24" />
            ) : rateIntel ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">AI Recommended Rate</p>
                  <div className="font-data text-4xl font-bold text-primary">
                    ${Number(recommendedRate).toFixed(0)}<span className="text-lg">/hr</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">
                      ${(Number(recommendedRate) - Number(marketAvg || 0)).toFixed(0)} above market avg
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Medicaid Reimbursement</p>
                  <div className="font-data text-2xl font-bold text-foreground">
                    ${Number(medicaidRate).toFixed(0)}<span className="text-sm">/hr</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Max sustainable ceiling</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market Average</p>
                  <div className="font-data text-2xl font-bold text-foreground">
                    ${Number(marketAvg).toFixed(0)}<span className="text-sm">/hr</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: ${Number(rateIntel.market_min_rate).toFixed(0)}-${Number(rateIntel.market_max_rate).toFixed(0)}/hr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Margin</p>
                  <div className="font-data text-2xl font-bold text-foreground">
                    ${(Number(medicaidRate) - Number(recommendedRate)).toFixed(0)}<span className="text-sm">/hr</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((1 - Number(recommendedRate) / Number(medicaidRate)) * 100).toFixed(0)}% of reimbursement
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Pay Rate Analysis Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Click "Analyze Pay Rates" to use AI + web scraping to discover what competitors pay caregivers
                  and calculate your optimal rate based on Medicaid reimbursement.
                </p>
              </div>
            )}

            {rateIntel?.analysis_summary && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{rateIntel.analysis_summary}</p>
                </div>
                {rateIntel.updated_at && (
                  <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Last analyzed: {new Date(rateIntel.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
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
                    const maxRate = c.pay_rate_max || 0;
                    const threat = maxRate >= (recommendedRate ? Number(recommendedRate) - 1 : 19)
                      ? "high"
                      : maxRate >= (recommendedRate ? Number(recommendedRate) - 4 : 17)
                        ? "medium" : "low";
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
