import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, TrendingUp, TrendingDown, DollarSign, Star } from "lucide-react";

const competitors = [
  { name: "FreedomCare", state: "OR", rating: 3.8, reviews: 142, payMin: 18, payMax: 20, spend: 8500, threat: "high" },
  { name: "Addus HomeCare", state: "OR", rating: 3.2, reviews: 89, payMin: 16, payMax: 17, spend: 5200, threat: "medium" },
  { name: "Home Instead", state: "OR", rating: 4.1, reviews: 234, payMin: 15, payMax: 18, spend: 12000, threat: "medium" },
  { name: "Comfort Keepers", state: "OR", rating: 3.5, reviews: 67, payMin: 15, payMax: 17, spend: 3800, threat: "low" },
];

const Competitors = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Competitor Intelligence</h1>
      </div>

      {/* Your Position */}
      <Card className="bg-card halevai-border halevai-bg-gradient">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Pay Rate</p>
              <div className="font-data text-4xl font-bold text-primary">$22/hr</div>
              <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" /> Highest in market (+$2/hr vs next)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Market Average</p>
              <div className="font-data text-2xl font-bold text-foreground">$16.75/hr</div>
              <p className="text-xs text-muted-foreground mt-1">Based on 4 competitors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card halevai-border">
        <CardHeader>
          <CardTitle className="text-lg">Competitor Tracker</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Competitor</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Pay Range</TableHead>
                <TableHead>Est. Spend</TableHead>
                <TableHead>Threat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((c) => (
                <TableRow key={c.name} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{c.state}</Badge></TableCell>
                  <TableCell className="font-data">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> {c.rating}
                    </span>
                  </TableCell>
                  <TableCell className="font-data text-muted-foreground">{c.reviews}</TableCell>
                  <TableCell className="font-data text-foreground">${c.payMin}-${c.payMax}/hr</TableCell>
                  <TableCell className="font-data text-muted-foreground">${c.spend.toLocaleString()}/mo</TableCell>
                  <TableCell>
                    <Badge className={
                      c.threat === "high" ? "bg-red-500/20 text-red-400" :
                      c.threat === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    }>{c.threat}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default Competitors;
