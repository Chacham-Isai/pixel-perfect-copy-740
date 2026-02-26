import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Plus, Eye, FileText } from "lucide-react";

const pages = [
  { title: "Oregon Caregiver - Washington County", slug: "or-washington-caregiver", state: "OR", county: "Washington", lang: "EN", published: true, views: 1240, submissions: 42, cvr: 3.4 },
  { title: "Oregon Vietnamese Caregiver", slug: "or-vietnamese-caregiver", state: "OR", county: "Washington", lang: "VI", published: true, views: 380, submissions: 18, cvr: 4.7 },
  { title: "Oregon Spanish Caregiver", slug: "or-spanish-caregiver", state: "OR", county: "Multnomah", lang: "ES", published: true, views: 520, submissions: 22, cvr: 4.2 },
  { title: "Michigan Statewide", slug: "mi-statewide-caregiver", state: "MI", county: "Statewide", lang: "EN", published: false, views: 0, submissions: 0, cvr: 0 },
];

const LandingPages = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
        </div>
        <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Create Page</Button>
      </div>

      <Card className="bg-card halevai-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Page</TableHead>
                <TableHead>State</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Lang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead className="text-right">CVR</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.slug} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-medium text-foreground">{p.title}</TableCell>
                  <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{p.state}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.county}</TableCell>
                  <TableCell><Badge variant="outline" className="border-border text-muted-foreground">{p.lang}</Badge></TableCell>
                  <TableCell>
                    <Badge className={p.published ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}>
                      {p.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-data text-muted-foreground">{p.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-data text-primary font-bold">{p.submissions}</TableCell>
                  <TableCell className="text-right font-data text-foreground">{p.cvr > 0 ? `${p.cvr}%` : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
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

export default LandingPages;
