import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList } from "lucide-react";
import { useCaregivers } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const dayColor = (days: number) => {
  if (days <= 14) return "text-green-400";
  if (days <= 30) return "text-yellow-400";
  return "text-red-400";
};

const Enrollment = () => {
  const { data: caregivers, isLoading } = useCaregivers();
  const enrolling = (caregivers || []).filter(c =>
    ["intake_started", "enrollment_pending", "authorized"].includes(c.status || "")
  );

  const states = [...new Set(enrolling.map(e => e.state || "—"))];

  const daysIn = (c: any) => {
    const ref = c.enrollment_started_at || c.created_at;
    if (!ref) return 0;
    return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Enrollment Tracker</h1>
        </div>

        {isLoading ? <Skeleton className="h-48" /> : states.map((st) => (
          <Card key={st} className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">{st}</Badge>
                {st === "OR" ? "Oregon" : st === "MI" ? "Michigan" : st} Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Caregiver</TableHead><TableHead>Patient</TableHead><TableHead>County</TableHead>
                    <TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>BG Check</TableHead>
                    <TableHead>County Rep</TableHead><TableHead>Case Manager</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolling.filter(e => e.state === st).map((e) => {
                    const d = daysIn(e);
                    return (
                      <TableRow key={e.id} className="border-border hover:bg-secondary/30">
                        <TableCell className="font-medium text-foreground">{e.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{e.patient_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{e.county || "—"}</TableCell>
                        <TableCell className={`font-data font-bold ${dayColor(d)}`}>{d}d</TableCell>
                        <TableCell><Badge variant="outline" className="border-border text-muted-foreground capitalize">{(e.status || "").replace("_", " ")}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            e.background_check_status === "cleared" ? "border-green-500/30 text-green-400" :
                            e.background_check_status === "submitted" ? "border-yellow-500/30 text-yellow-400" :
                            "border-red-500/30 text-red-400"
                          }>{e.background_check_status || "Not Started"}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{e.county_rep_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{e.case_manager_name || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
        {!isLoading && enrolling.length === 0 && <p className="text-center text-muted-foreground py-8">No active enrollments</p>}
      </div>
    </AppLayout>
  );
};

export default Enrollment;
