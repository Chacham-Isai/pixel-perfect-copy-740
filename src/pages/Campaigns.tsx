import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, Plus, TrendingUp, DollarSign, MousePointer, Users } from "lucide-react";
import { useCampaigns } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const Campaigns = () => {
  const { data: campaigns, isLoading } = useCampaigns();
  const all = campaigns || [];
  const active = all.filter(c => c.status === "active");
  const totalSpend = active.reduce((s, c) => s + (c.spend || 0), 0);
  const totalClicks = active.reduce((s, c) => s + (c.clicks || 0), 0);
  const totalConversions = active.reduce((s, c) => s + (c.conversions || 0), 0);
  const avgCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "0";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Campaign Hub</h1>
          </div>
          <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, icon: DollarSign },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer },
            { label: "Conversions", value: String(totalConversions), icon: Users },
            { label: "Avg CPA", value: `$${avgCPA}`, icon: TrendingUp },
          ].map((k) => (
            <Card key={k.label} className="bg-card halevai-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</span>
                  <k.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="font-data text-xl font-bold text-foreground">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? <Skeleton className="h-64" /> : (
          <Card className="bg-card halevai-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Campaign</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((c) => (
                    <TableRow key={c.id} className="border-border hover:bg-secondary/30 cursor-pointer">
                      <TableCell className="font-medium text-foreground">{c.campaign_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.channel || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{c.state || "—"}</Badge></TableCell>
                      <TableCell>
                        <Badge className={c.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-data text-foreground">${(c.spend || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-data text-muted-foreground">{(c.clicks || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-data text-primary font-bold">{c.conversions || 0}</TableCell>
                      <TableCell className="text-right font-data text-foreground">${c.cost_per_conversion?.toFixed(2) || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {all.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No campaigns yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Campaigns;
