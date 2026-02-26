import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Filter, Download, Plus, Phone, Mail, MapPin, Clock } from "lucide-react";
import { useCaregivers, type Caregiver } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

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

const Caregivers = () => {
  const { data: caregivers, isLoading } = useCaregivers();
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = (caregivers || []).filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.county || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const daysInStage = (c: Caregiver) => {
    const ref = c.enrollment_started_at || c.last_contacted_at || c.created_at;
    if (!ref) return 0;
    return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Caregiver Pipeline</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            <Button size="sm" className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Add Caregiver</Button>
          </div>
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
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((col) => {
              const cards = filtered.filter(c => c.status === col.key);
              return (
                <div key={col.key} className="min-w-[260px] flex-1">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`h-3 w-3 rounded-full ${col.color}`} />
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs font-data">{cards.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {cards.map((c) => (
                      <Card key={c.id} className="bg-card halevai-border hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setSelectedCaregiver(c)}>
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
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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
