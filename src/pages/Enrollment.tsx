import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList } from "lucide-react";

const enrollments = [
  { caregiver: "David Kim", patient: "Soo-Yeon Kim", state: "OR", county: "Clackamas", days: 9, countyRep: "Janet S.", caseManager: "—", bgCheck: "Cleared", authDate: "—", estSOC: "—" },
  { caregiver: "Lisa Thompson", patient: "Robert Thompson", state: "MI", county: "Oakland", days: 12, countyRep: "Mike R.", caseManager: "—", bgCheck: "Submitted", authDate: "—", estSOC: "—" },
  { caregiver: "Carlos Martinez", patient: "Elena Martinez", state: "OR", county: "Marion", days: 18, countyRep: "Susan L.", caseManager: "Amy T.", bgCheck: "Cleared", authDate: "Pending", estSOC: "—" },
  { caregiver: "Patricia Chen", patient: "Wei Chen", state: "OR", county: "Multnomah", days: 3, countyRep: "Janet S.", caseManager: "Tom R.", bgCheck: "Cleared", authDate: "03/15", estSOC: "03/22" },
  { caregiver: "Ahmed Hassan", patient: "Fatima Hassan", state: "OR", county: "Washington", days: 22, countyRep: "—", caseManager: "—", bgCheck: "Not Started", authDate: "—", estSOC: "—" },
];

const dayColor = (days: number) => {
  if (days <= 14) return "text-green-400";
  if (days <= 30) return "text-yellow-400";
  return "text-red-400";
};

const Enrollment = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Enrollment Tracker</h1>
      </div>

      {/* State Sections */}
      {["OR", "MI"].map((st) => (
        <Card key={st} className="bg-card halevai-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary">{st}</Badge>
              {st === "OR" ? "Oregon" : "Michigan"} Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Caregiver</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>County Rep</TableHead>
                  <TableHead>Case Manager</TableHead>
                  <TableHead>BG Check</TableHead>
                  <TableHead>Auth Date</TableHead>
                  <TableHead>Est. SOC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.filter(e => e.state === st).map((e) => (
                  <TableRow key={e.caregiver} className="border-border hover:bg-secondary/30">
                    <TableCell className="font-medium text-foreground">{e.caregiver}</TableCell>
                    <TableCell className="text-muted-foreground">{e.patient}</TableCell>
                    <TableCell className="text-muted-foreground">{e.county}</TableCell>
                    <TableCell className={`font-data font-bold ${dayColor(e.days)}`}>{e.days}d</TableCell>
                    <TableCell className="text-muted-foreground">{e.countyRep}</TableCell>
                    <TableCell className="text-muted-foreground">{e.caseManager}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        e.bgCheck === "Cleared" ? "border-green-500/30 text-green-400" :
                        e.bgCheck === "Submitted" ? "border-yellow-500/30 text-yellow-400" :
                        "border-red-500/30 text-red-400"
                      }>{e.bgCheck}</Badge>
                    </TableCell>
                    <TableCell className="font-data text-muted-foreground">{e.authDate}</TableCell>
                    <TableCell className="font-data text-muted-foreground">{e.estSOC}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  </AppLayout>
);

export default Enrollment;
