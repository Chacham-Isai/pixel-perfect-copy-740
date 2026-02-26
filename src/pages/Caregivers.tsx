import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Filter, Download, Plus, Phone, Mail, MapPin, Clock } from "lucide-react";

type LeadStatus = "new" | "contacted" | "intake_started" | "enrollment_pending" | "authorized" | "active";

interface Caregiver {
  id: string;
  full_name: string;
  state: string;
  county: string;
  status: LeadStatus;
  lead_score: number;
  lead_tier: string;
  patient_name: string;
  source: string;
  phone: string;
  email: string;
  days_in_stage: number;
  language_primary: string;
}

const columns: { key: LeadStatus; label: string; color: string }[] = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-cyan-500" },
  { key: "intake_started", label: "Intake Started", color: "bg-yellow-500" },
  { key: "enrollment_pending", label: "Enrollment Pending", color: "bg-orange-500" },
  { key: "authorized", label: "Authorized", color: "bg-purple-500" },
  { key: "active", label: "Active", color: "bg-green-500" },
];

const mockCaregivers: Caregiver[] = [
  { id: "1", full_name: "Maria Gonzales", state: "OR", county: "Washington", status: "new", lead_score: 92, lead_tier: "HOT", patient_name: "Rosa Gonzales", source: "indeed", phone: "(503) 555-0101", email: "maria@email.com", days_in_stage: 1, language_primary: "spanish" },
  { id: "2", full_name: "Jose Rivera", state: "OR", county: "Multnomah", status: "new", lead_score: 87, lead_tier: "HOT", patient_name: "Ana Rivera", source: "facebook", phone: "(503) 555-0102", email: "jose@email.com", days_in_stage: 2, language_primary: "spanish" },
  { id: "3", full_name: "David Kim", state: "OR", county: "Clackamas", status: "intake_started", lead_score: 68, lead_tier: "WARM", patient_name: "Soo-Yeon Kim", source: "referral", phone: "(503) 555-0103", email: "david@email.com", days_in_stage: 9, language_primary: "korean" },
  { id: "4", full_name: "Patricia Chen", state: "OR", county: "Multnomah", status: "authorized", lead_score: 95, lead_tier: "HOT", patient_name: "Wei Chen", source: "community", phone: "(503) 555-0104", email: "patricia@email.com", days_in_stage: 3, language_primary: "mandarin" },
  { id: "5", full_name: "Sarah Johnson", state: "MI", county: "Wayne", status: "contacted", lead_score: 55, lead_tier: "WARM", patient_name: "Dorothy Johnson", source: "care_com", phone: "(313) 555-0201", email: "sarah@email.com", days_in_stage: 4, language_primary: "english" },
  { id: "6", full_name: "Ahmed Hassan", state: "OR", county: "Washington", status: "new", lead_score: 78, lead_tier: "HOT", patient_name: "Fatima Hassan", source: "community", phone: "(503) 555-0105", email: "ahmed@email.com", days_in_stage: 0, language_primary: "arabic" },
  { id: "7", full_name: "Lisa Thompson", state: "MI", county: "Oakland", status: "enrollment_pending", lead_score: 72, lead_tier: "WARM", patient_name: "Robert Thompson", source: "organic", phone: "(248) 555-0301", email: "lisa@email.com", days_in_stage: 12, language_primary: "english" },
  { id: "8", full_name: "Nguyen Thi Mai", state: "OR", county: "Washington", status: "active", lead_score: 98, lead_tier: "HOT", patient_name: "Nguyen Van Duc", source: "referral", phone: "(503) 555-0106", email: "mai@email.com", days_in_stage: 0, language_primary: "vietnamese" },
  { id: "9", full_name: "Carlos Martinez", state: "OR", county: "Marion", status: "contacted", lead_score: 45, lead_tier: "WARM", patient_name: "Elena Martinez", source: "craigslist", phone: "(503) 555-0107", email: "carlos@email.com", days_in_stage: 5, language_primary: "spanish" },
  { id: "10", full_name: "Rachel Williams", state: "MI", county: "Wayne", status: "new", lead_score: 33, lead_tier: "NURTURE", patient_name: "", source: "ziprecruiter", phone: "(313) 555-0202", email: "rachel@email.com", days_in_stage: 7, language_primary: "english" },
];

const tierColor = (tier: string) => {
  switch (tier) {
    case "HOT": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "WARM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
};

const Caregivers = () => {
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = mockCaregivers.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Caregiver Pipeline</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            <Button size="sm" className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Add Caregiver</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, county..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
        </div>

        {/* Kanban */}
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
                    <Card
                      key={c.id}
                      className="bg-card halevai-border hover:border-primary/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedCaregiver(c)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-sm text-foreground">{c.full_name}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${tierColor(c.lead_tier)}`}>{c.lead_tier}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {c.county}, {c.state}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-data text-primary font-bold">{c.lead_score}/100</span>
                          {c.patient_name && <span className="text-muted-foreground truncate ml-2">Patient: {c.patient_name}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {c.days_in_stage}d in stage
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Slide-over */}
      <Sheet open={!!selectedCaregiver} onOpenChange={() => setSelectedCaregiver(null)}>
        <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
          {selectedCaregiver && (
            <>
              <SheetHeader>
                <SheetTitle className="text-foreground">{selectedCaregiver.full_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Score */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-data text-3xl font-bold text-primary">{selectedCaregiver.lead_score}</div>
                    <Badge className={tierColor(selectedCaregiver.lead_tier)}>{selectedCaregiver.lead_tier}</Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedCaregiver.phone}</div>
                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedCaregiver.email}</div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {selectedCaregiver.county}, {selectedCaregiver.state}</div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Source", value: selectedCaregiver.source },
                    { label: "Language", value: selectedCaregiver.language_primary },
                    { label: "Status", value: selectedCaregiver.status.replace("_", " ") },
                    { label: "Days in Stage", value: `${selectedCaregiver.days_in_stage} days` },
                  ].map((item) => (
                    <div key={item.label} className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-medium text-foreground capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Patient Section */}
                {selectedCaregiver.patient_name && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Patient Information</h3>
                    <Card className="bg-secondary/30 border-border">
                      <CardContent className="p-3 space-y-1">
                        <div className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{selectedCaregiver.patient_name}</span></div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Actions */}
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
