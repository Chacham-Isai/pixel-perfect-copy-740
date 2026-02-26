import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Phone, Users, Zap, Settings } from "lucide-react";

const sourcingCampaigns = [
  { name: "Caregivers - Washington County, OR", state: "OR", county: "Washington", status: "active", found: 45, enriched: 38, pushed: 12, schedule: "daily" },
  { name: "Caregivers - Multnomah County, OR", state: "OR", county: "Multnomah", status: "active", found: 32, enriched: 28, pushed: 8, schedule: "weekly" },
  { name: "MI Statewide Sourcing", state: "MI", county: "Statewide", status: "draft", found: 0, enriched: 0, pushed: 0, schedule: "manual" },
];

const sourcedCandidates = [
  { name: "Sophia Tran", platform: "LinkedIn", state: "OR", county: "Washington", matchScore: 92, outreach: "sent", employer: "FreedomCare", payRate: "$18/hr" },
  { name: "James Wilson", platform: "Indeed", state: "OR", county: "Multnomah", matchScore: 85, outreach: "responded", employer: "Home Instead", payRate: "$16/hr" },
  { name: "Anna Petrov", platform: "ZipRecruiter", state: "OR", county: "Washington", matchScore: 78, outreach: "not_started", employer: "Independent", payRate: "—" },
  { name: "Michael Brown", platform: "Care.com", state: "MI", county: "Wayne", matchScore: 71, outreach: "sent", employer: "Addus", payRate: "$17/hr" },
];

const TalentSourcing = () => (
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
          <TabsTrigger value="outreach" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Outreach</TabsTrigger>
          <TabsTrigger value="screening" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Phone Screening</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Agent Activity</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          {sourcingCampaigns.map((sc) => (
            <Card key={sc.name} className="bg-card halevai-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-foreground">{sc.name}</h3>
                    <p className="text-xs text-muted-foreground">{sc.county}, {sc.state} • {sc.schedule}</p>
                  </div>
                  <Badge className={sc.status === "active" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}>{sc.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/50 rounded p-2 text-center">
                    <div className="font-data text-lg font-bold text-foreground">{sc.found}</div>
                    <div className="text-[10px] text-muted-foreground">Found</div>
                  </div>
                  <div className="bg-secondary/50 rounded p-2 text-center">
                    <div className="font-data text-lg font-bold text-primary">{sc.enriched}</div>
                    <div className="text-[10px] text-muted-foreground">Enriched</div>
                  </div>
                  <div className="bg-secondary/50 rounded p-2 text-center">
                    <div className="font-data text-lg font-bold text-green-400">{sc.pushed}</div>
                    <div className="text-[10px] text-muted-foreground">Pushed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="candidates" className="mt-4">
          <Card className="bg-card halevai-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Candidate</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Current Employer</TableHead>
                    <TableHead>Current Pay</TableHead>
                    <TableHead>Outreach</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourcedCandidates.map((c) => (
                    <TableRow key={c.name} className="border-border hover:bg-secondary/30">
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.platform}</TableCell>
                      <TableCell className="text-muted-foreground">{c.county}, {c.state}</TableCell>
                      <TableCell><span className={`font-data font-bold ${c.matchScore >= 80 ? "text-green-400" : c.matchScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>{c.matchScore}</span></TableCell>
                      <TableCell className="text-muted-foreground">{c.employer}</TableCell>
                      <TableCell className="font-data text-muted-foreground">{c.payRate}</TableCell>
                      <TableCell>
                        <Badge className={
                          c.outreach === "responded" ? "bg-green-500/20 text-green-400" :
                          c.outreach === "sent" ? "bg-blue-500/20 text-blue-400" :
                          "bg-secondary text-muted-foreground"
                        }>{c.outreach.replace("_", " ")}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </AppLayout>
);

export default TalentSourcing;
