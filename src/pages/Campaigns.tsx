import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, Plus, TrendingUp, DollarSign, MousePointer, Users } from "lucide-react";

const campaigns = [
  { name: "OR Recruitment Q1", type: "recruitment", channel: "Indeed", state: "OR", status: "active", spend: 2150, clicks: 342, conversions: 18, cpa: 18.50, caregivers: 18 },
  { name: "WA County Facebook", type: "recruitment", channel: "Facebook", state: "OR", status: "active", spend: 890, clicks: 1240, conversions: 8, cpa: 22.10, caregivers: 8 },
  { name: "MI ZipRecruiter Push", type: "recruitment", channel: "ZipRecruiter", state: "MI", status: "active", spend: 640, clicks: 186, conversions: 5, cpa: 28.00, caregivers: 5 },
  { name: "Vietnamese Community OR", type: "community", channel: "Community", state: "OR", status: "active", spend: 200, clicks: 0, conversions: 4, cpa: 50.00, caregivers: 4 },
  { name: "Poaching Campaign - Portland", type: "recruitment", channel: "SMS/Email", state: "OR", status: "paused", spend: 150, clicks: 0, conversions: 2, cpa: 75.00, caregivers: 2 },
];

const Campaigns = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campaign Hub</h1>
        </div>
        <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Spend", value: "$4,030", icon: DollarSign },
          { label: "Total Clicks", value: "1,768", icon: MousePointer },
          { label: "Conversions", value: "37", icon: Users },
          { label: "Avg CPA", value: "$21.40", icon: TrendingUp },
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

      <Tabs defaultValue="recruitment">
        <TabsList className="bg-secondary">
          {["Recruitment", "Marketing", "Social", "Community", "Sources", "Performance", "Templates", "Sequences"].map((t) => (
            <TabsTrigger key={t} value={t.toLowerCase()} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="recruitment" className="mt-4">
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
                  {campaigns.map((c) => (
                    <TableRow key={c.name} className="border-border hover:bg-secondary/30 cursor-pointer">
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.channel}</TableCell>
                      <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{c.state}</Badge></TableCell>
                      <TableCell>
                        <Badge className={c.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-data text-foreground">${c.spend.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-data text-muted-foreground">{c.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-data text-primary font-bold">{c.conversions}</TableCell>
                      <TableCell className="text-right font-data text-foreground">${c.cpa.toFixed(2)}</TableCell>
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

export default Campaigns;
