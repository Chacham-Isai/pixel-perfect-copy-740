import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Plus, Eye } from "lucide-react";
import { useLandingPages } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const LandingPages = () => {
  const { data: pages, isLoading } = useLandingPages();
  const all = pages || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
          </div>
          <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Create Page</Button>
        </div>

        {isLoading ? <Skeleton className="h-48" /> : (
          <Card className="bg-card halevai-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Page</TableHead><TableHead>State</TableHead><TableHead>County</TableHead>
                    <TableHead>Lang</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Views</TableHead><TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">CVR</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((p) => (
                    <TableRow key={p.id} className="border-border hover:bg-secondary/30">
                      <TableCell className="font-medium text-foreground">{p.title}</TableCell>
                      <TableCell><Badge variant="outline" className="border-primary/30 text-primary">{p.state || "—"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.county || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="border-border text-muted-foreground">{(p.language || "en").toUpperCase().slice(0, 2)}</Badge></TableCell>
                      <TableCell>
                        <Badge className={p.published ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}>
                          {p.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-data text-muted-foreground">{(p.views || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-data text-primary font-bold">{p.form_submissions || 0}</TableCell>
                      <TableCell className="text-right font-data text-foreground">{(p.conversion_rate || 0) > 0 ? `${p.conversion_rate}%` : "—"}</TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {all.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No landing pages yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default LandingPages;
