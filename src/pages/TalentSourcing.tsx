import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus } from "lucide-react";
import { useSourcingCampaigns, useSourcedCandidates } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const TalentSourcing = () => {
  const { data: campaigns, isLoading: loadingCampaigns } = useSourcingCampaigns();
  const { data: candidates, isLoading: loadingCandidates } = useSourcedCandidates();
  const allCampaigns = campaigns || [];
  const allCandidates = candidates || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Talent Sourcing</h1>
          </div>
          <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="bg-secondary">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Campaigns</TabsTrigger>
            <TabsTrigger value="candidates" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Sourced Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4 space-y-4">
            {loadingCampaigns ? <Skeleton className="h-48" /> : allCampaigns.map((sc) => (
              <Card key={sc.id} className="bg-card halevai-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{sc.name}</h3>
                      <p className="text-xs text-muted-foreground">{sc.county || "Statewide"}, {sc.state} • {sc.schedule}</p>
                    </div>
                    <Badge className={sc.status === "active" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}>{sc.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="font-data text-lg font-bold text-foreground">{sc.candidates_found || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Found</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="font-data text-lg font-bold text-primary">{sc.candidates_enriched || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Enriched</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="font-data text-lg font-bold text-green-400">{sc.candidates_pushed || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Pushed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loadingCampaigns && allCampaigns.length === 0 && <p className="text-center text-muted-foreground py-8">No sourcing campaigns</p>}
          </TabsContent>

          <TabsContent value="candidates" className="mt-4">
            {loadingCandidates ? <Skeleton className="h-48" /> : (
              <Card className="bg-card halevai-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Candidate</TableHead><TableHead>Platform</TableHead><TableHead>Location</TableHead>
                        <TableHead>Match</TableHead><TableHead>Current Employer</TableHead><TableHead>Current Pay</TableHead><TableHead>Outreach</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCandidates.map((c) => (
                        <TableRow key={c.id} className="border-border hover:bg-secondary/30">
                          <TableCell className="font-medium text-foreground">{c.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{c.source_platform || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{c.county || "—"}, {c.state || "—"}</TableCell>
                          <TableCell><span className={`font-data font-bold ${(c.match_score || 0) >= 80 ? "text-green-400" : (c.match_score || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>{c.match_score ?? "—"}</span></TableCell>
                          <TableCell className="text-muted-foreground">{c.current_employer || "—"}</TableCell>
                          <TableCell className="font-data text-muted-foreground">{c.current_pay_rate ? `$${c.current_pay_rate}/hr` : "—"}</TableCell>
                          <TableCell>
                            <Badge className={
                              c.outreach_status === "responded" ? "bg-green-500/20 text-green-400" :
                              c.outreach_status === "sent" ? "bg-blue-500/20 text-blue-400" :
                              "bg-secondary text-muted-foreground"
                            }>{(c.outreach_status || "not started").replace("_", " ")}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {allCandidates.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No sourced candidates</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TalentSourcing;
