import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Download, Plus, Phone, Mail, MapPin, Clock, Loader2 } from "lucide-react";
import { useCaregivers, type Caregiver } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

type LeadStatus = "new" | "contacted" | "intake_started" | "enrollment_pending" | "authorized" | "active";

const columns: { key: LeadStatus; label: string; color: string }[] = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-cyan-500" },
  { key: "intake_started", label: "Intake Started", color: "bg-yellow-500" },
  { key: "enrollment_pending", label: "Enrollment Pending", color: "bg-orange-500" },
  { key: "authorized", label: "Authorized", color: "bg-purple-500" },
  { key: "active", label: "Active", color: "bg-green-500" },
];

const tierColor = (tier: string | null) => {
  switch (tier) {
    case "HOT": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "WARM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
};

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

const daysInStage = (c: Caregiver) => {
  const ref = c.enrollment_started_at || c.last_contacted_at || c.created_at;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
};

// Droppable column wrapper
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] flex-1 rounded-lg transition-colors ${isOver ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
    >
      {children}
    </div>
  );
}

// Draggable card wrapper
function DraggableCard({ caregiver, onClick }: { caregiver: Caregiver; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: caregiver.id,
    data: { caregiver },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
    >
      <CaregiverCard caregiver={caregiver} onClick={onClick} />
    </div>
  );
}

// Extracted card component for reuse in overlay
function CaregiverCard({ caregiver: c, onClick }: { caregiver: Caregiver; onClick?: () => void }) {
  return (
    <Card
      className="bg-card halevai-border hover:border-primary/30 cursor-grab active:cursor-grabbing transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <span className="font-medium text-sm text-foreground">{c.full_name}</span>
          <Badge className={`text-[10px] px-1.5 py-0 ${tierColor(c.lead_tier)}`}>{c.lead_tier || "—"}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {c.county || "—"}, {c.state || "—"}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-data text-primary font-bold">{c.lead_score ?? "—"}/100</span>
          {c.patient_name && <span className="text-muted-foreground truncate ml-2">Patient: {c.patient_name}</span>}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {daysInStage(c)}d in stage
        </div>
      </CardContent>
    </Card>
  );
}

const Caregivers = () => {
  const { data: caregivers, isLoading } = useCaregivers();
  const { agencyId } = useAuth();
  const qc = useQueryClient();
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", state: "", county: "", city: "", language_primary: "english", source: "direct", notes: "" });
  const [activeCaregiver, setActiveCaregiver] = useState<Caregiver | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filtered = (caregivers || []).filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.county || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const cg = (event.active.data.current as any)?.caregiver as Caregiver;
    setActiveCaregiver(cg || null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveCaregiver(null);
    const { active, over } = event;
    if (!over) return;

    const caregiver = (active.data.current as any)?.caregiver as Caregiver;
    const newStatus = over.id as LeadStatus;

    if (!caregiver || caregiver.status === newStatus) return;

    // Optimistic update
    qc.setQueryData(["caregivers", agencyId], (old: Caregiver[] | undefined) =>
      old?.map(c => c.id === caregiver.id ? { ...c, status: newStatus } : c)
    );

    try {
      const { error } = await supabase
        .from("caregivers")
        .update({ status: newStatus } as any)
        .eq("id", caregiver.id);
      if (error) throw error;
      toast.success(`${caregiver.full_name} moved to ${columns.find(col => col.key === newStatus)?.label}`);
      qc.invalidateQueries({ queryKey: ["caregivers"] });
    } catch (e: any) {
      toast.error("Failed to update status");
      qc.invalidateQueries({ queryKey: ["caregivers"] });
    }
  }, [agencyId, qc]);

  const handleAddCaregiver = async () => {
    if (!form.full_name.trim() || !agencyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("caregivers").insert({
        agency_id: agencyId,
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        state: form.state || null,
        county: form.county || null,
        city: form.city || null,
        language_primary: form.language_primary,
        source: form.source as any,
        notes: form.notes || null,
        status: "new" as any,
      } as any);
      if (error) throw error;
      toast.success("Caregiver added!");
      setAddOpen(false);
      setForm({ full_name: "", phone: "", email: "", state: "", county: "", city: "", language_primary: "english", source: "direct", notes: "" });
      qc.invalidateQueries({ queryKey: ["caregivers"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to add caregiver");
    }
    setSaving(false);
  };

  const handleExportCSV = () => {
    const data = filtered.length > 0 ? filtered : (caregivers || []);
    if (data.length === 0) { toast.error("No data to export"); return; }
    const headers = ["full_name","phone","email","state","county","city","status","lead_tier","lead_score","source","language_primary","patient_name","created_at"];
    const csvRows = [headers.join(",")];
    data.forEach(c => {
      csvRows.push(headers.map(h => {
        const val = (c as any)[h];
        const str = val == null ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `caregivers-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} caregivers`);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Caregiver Pipeline</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Add Caregiver</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="text-foreground">Add New Caregiver</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Maria Garcia" className="bg-secondary border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@email.com" className="bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                          <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>County</Label>
                        <Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Primary Language</Label>
                        <Select value={form.language_primary} onValueChange={v => setForm(f => ({ ...f, language_primary: v }))}>
                          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="creole">Creole</SelectItem>
                            <SelectItem value="mandarin">Mandarin</SelectItem>
                            <SelectItem value="russian">Russian</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Lead Source</Label>
                        <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct">Direct</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="indeed">Indeed</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional info..." className="bg-secondary border-border" />
                    </div>
                    <Button onClick={handleAddCaregiver} disabled={saving || !form.full_name.trim()} className="w-full bg-primary text-primary-foreground">
                      {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving...</> : <><Plus className="h-4 w-4 mr-1" />Add Caregiver</>}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Track every caregiver from first contact to active enrollment. Drag cards between columns to update status.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, county..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-secondary border-border" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
        </div>

        {isLoading ? (
          <div className="flex gap-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[260px] flex-1 h-48" />)}</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 overflow-x-auto pb-4">
              {columns.map((col) => {
                const cards = filtered.filter(c => c.status === col.key);
                return (
                  <DroppableColumn key={col.key} id={col.key}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`h-3 w-3 rounded-full ${col.color}`} />
                      <span className="text-sm font-medium text-foreground">{col.label}</span>
                      <Badge variant="secondary" className="ml-auto text-xs font-data">{cards.length}</Badge>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {cards.map((c) => (
                        <DraggableCard
                          key={c.id}
                          caregiver={c}
                          onClick={() => setSelectedCaregiver(c)}
                        />
                      ))}
                    </div>
                  </DroppableColumn>
                );
              })}
            </div>
            <DragOverlay>
              {activeCaregiver ? (
                <div className="w-[260px] opacity-90 rotate-2 scale-105">
                  <CaregiverCard caregiver={activeCaregiver} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Sheet open={!!selectedCaregiver} onOpenChange={() => setSelectedCaregiver(null)}>
        <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
          {selectedCaregiver && (
            <>
              <SheetHeader><SheetTitle className="text-foreground">{selectedCaregiver.full_name}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-data text-3xl font-bold text-primary">{selectedCaregiver.lead_score ?? "—"}</div>
                    <Badge className={tierColor(selectedCaregiver.lead_tier)}>{selectedCaregiver.lead_tier || "—"}</Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedCaregiver.phone || "—"}</div>
                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedCaregiver.email || "—"}</div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {selectedCaregiver.county}, {selectedCaregiver.state}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Source", value: selectedCaregiver.source || "—" },
                    { label: "Language", value: selectedCaregiver.language_primary || "—" },
                    { label: "Status", value: (selectedCaregiver.status || "").replace("_", " ") },
                    { label: "Days in Stage", value: `${daysInStage(selectedCaregiver)} days` },
                  ].map((item) => (
                    <div key={item.label} className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-medium text-foreground capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>
                {selectedCaregiver.patient_name && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Patient Information</h3>
                    <Card className="bg-secondary/30 border-border">
                      <CardContent className="p-3 space-y-1">
                        <div className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{selectedCaregiver.patient_name}</span></div>
                        {selectedCaregiver.patient_county && <div className="text-sm"><span className="text-muted-foreground">County:</span> <span className="text-foreground">{selectedCaregiver.patient_county}</span></div>}
                        {selectedCaregiver.patient_medicaid_status && <div className="text-sm"><span className="text-muted-foreground">Medicaid:</span> <span className="text-foreground capitalize">{selectedCaregiver.patient_medicaid_status}</span></div>}
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary text-primary-foreground flex-1">Send SMS</Button>
                  <Button size="sm" variant="outline" className="flex-1">Send Email</Button>
                  <Button size="sm" variant="outline" className="flex-1">Schedule Screen</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default Caregivers;
