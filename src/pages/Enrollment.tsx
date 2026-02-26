import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, ArrowRight, CheckCircle, Shield, Edit2, Loader2 } from "lucide-react";
import { useCaregivers } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ENROLLMENT_STAGES = [
  { value: "intake_started", label: "Intake Started", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "enrollment_pending", label: "Enrollment Pending", color: "bg-orange-500/20 text-orange-400" },
  { value: "authorized", label: "Authorized", color: "bg-purple-500/20 text-purple-400" },
  { value: "active", label: "Active", color: "bg-green-500/20 text-green-400" },
];

const BG_STATUSES = [
  { value: "not_started", label: "Not Started" },
  { value: "submitted", label: "Submitted" },
  { value: "cleared", label: "Cleared" },
  { value: "failed", label: "Failed" },
];

const dayColor = (days: number) => {
  if (days <= 14) return "text-green-400";
  if (days <= 30) return "text-yellow-400";
  return "text-red-400";
};

const Enrollment = () => {
  const { data: caregivers, isLoading, refetch } = useCaregivers();
  const { agencyId } = useAuth();
  const enrolling = (caregivers || []).filter(c =>
    ["intake_started", "enrollment_pending", "authorized"].includes(c.status || "")
  );
  const states = [...new Set(enrolling.map(e => e.state || "Unknown"))];

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ county_rep_name: "", case_manager_name: "", patient_medicaid_id: "", patient_name: "" });
  const [saving, setSaving] = useState(false);

  const daysIn = (c: any) => {
    const ref = c.enrollment_started_at || c.created_at;
    if (!ref) return 0;
    return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  };

  const advanceStage = async (id: string, currentStatus: string) => {
    const order = ["intake_started", "enrollment_pending", "authorized", "active"];
    const idx = order.indexOf(currentStatus);
    if (idx < 0 || idx >= order.length - 1) return;
    const next = order[idx + 1];
    const updates: any = { status: next };
    if (next === "authorized") updates.authorization_date = new Date().toISOString().split("T")[0];
    if (next === "active") updates.start_of_care_date = new Date().toISOString().split("T")[0];
    
    const { error } = await supabase.from("caregivers").update(updates).eq("id", id);
    if (error) toast.error("Failed to advance");
    else { toast.success(`Advanced to ${next.replace("_", " ")}`); refetch(); }
  };

  const updateBgCheck = async (id: string, status: string) => {
    const { error } = await supabase.from("caregivers").update({ background_check_status: status } as any).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success("Background check updated"); refetch(); }
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setEditForm({
      county_rep_name: c.county_rep_name || "",
      case_manager_name: c.case_manager_name || "",
      patient_medicaid_id: c.patient_medicaid_id || "",
      patient_name: c.patient_name || "",
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const { error } = await supabase.from("caregivers").update({
      county_rep_name: editForm.county_rep_name || null,
      case_manager_name: editForm.case_manager_name || null,
      patient_medicaid_id: editForm.patient_medicaid_id || null,
      patient_name: editForm.patient_name || null,
    } as any).eq("id", editId);
    if (error) toast.error("Failed to save");
    else { toast.success("Updated!"); setEditId(null); refetch(); }
    setSaving(false);
  };

  // Summary stats
  const totalEnrolling = enrolling.length;
  const avgDays = totalEnrolling > 0 ? Math.round(enrolling.reduce((s, c) => s + daysIn(c), 0) / totalEnrolling) : 0;
  const bgCleared = enrolling.filter(c => c.background_check_status === "cleared").length;
  const stuck = enrolling.filter(c => daysIn(c) > 30).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Enrollment Tracker</h1>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "In Enrollment", value: totalEnrolling, color: "text-foreground" },
            { label: "Avg Days", value: `${avgDays}d`, color: dayColor(avgDays) },
            { label: "BG Cleared", value: bgCleared, color: "text-green-400" },
            { label: "Stuck (30d+)", value: stuck, color: stuck > 0 ? "text-red-400" : "text-foreground" },
          ].map(s => (
            <Card key={s.label} className="bg-card halevai-border">
              <CardContent className="p-4 text-center">
                <div className={`font-data text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? <Skeleton className="h-48" /> : states.map((st) => (
          <Card key={st} className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">{st}</Badge>
                Enrollments ({enrolling.filter(e => (e.state || "Unknown") === st).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Caregiver</TableHead><TableHead>Patient</TableHead><TableHead>County</TableHead>
                    <TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>BG Check</TableHead>
                    <TableHead>County Rep</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolling.filter(e => (e.state || "Unknown") === st).map((e) => {
                    const d = daysIn(e);
                    const stageInfo = ENROLLMENT_STAGES.find(s => s.value === e.status);
                    return (
                      <TableRow key={e.id} className={`border-border hover:bg-secondary/30 ${d > 30 ? "bg-red-500/5" : ""}`}>
                        <TableCell className="font-medium text-foreground">{e.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{e.patient_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{e.county || "—"}</TableCell>
                        <TableCell className={`font-data font-bold ${dayColor(d)}`}>{d}d</TableCell>
                        <TableCell>
                          <Badge className={stageInfo?.color || "bg-muted text-muted-foreground"}>
                            {stageInfo?.label || e.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={e.background_check_status || "not_started"} onValueChange={v => updateBgCheck(e.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-28 bg-secondary border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BG_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{e.county_rep_name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => advanceStage(e.id, e.status || "")}>
                              <ArrowRight className="h-3 w-3 mr-1" />Advance
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(e)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
        {!isLoading && enrolling.length === 0 && (
          <Card className="bg-card halevai-border">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No Active Enrollments</h3>
              <p className="text-sm text-muted-foreground">All caregivers have been processed. New leads will appear here when they enter intake.</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Edit Enrollment Details</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Patient Name</Label><Input value={editForm.patient_name} onChange={e => setEditForm(f => ({ ...f, patient_name: e.target.value }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Medicaid ID</Label><Input value={editForm.patient_medicaid_id} onChange={e => setEditForm(f => ({ ...f, patient_medicaid_id: e.target.value }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>County Rep Name</Label><Input value={editForm.county_rep_name} onChange={e => setEditForm(f => ({ ...f, county_rep_name: e.target.value }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Case Manager Name</Label><Input value={editForm.case_manager_name} onChange={e => setEditForm(f => ({ ...f, case_manager_name: e.target.value }))} className="bg-secondary border-border" /></div>
              <Button onClick={saveEdit} disabled={saving} className="w-full bg-primary text-primary-foreground">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Enrollment;