import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Building2, Stethoscope, Target, Sparkles, Loader2, CheckCircle } from "lucide-react";
import logo from "@/assets/halevai-logo.png";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const USP_OPTIONS = [
  "Highest pay rate in market",
  "We handle all paperwork",
  "Family caregiver program",
  "Multilingual support",
  "Sign-on bonus",
  "Flexible schedules",
  "Local company",
  "Fast enrollment",
];

const steps = [
  { label: "Agency Setup", icon: Building2 },
  { label: "Service Config", icon: Stethoscope },
  { label: "Goals", icon: Target },
  { label: "USPs", icon: Sparkles },
  { label: "AI Strategy", icon: Loader2 },
  { label: "Summary", icon: CheckCircle },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    agencyName: "",
    states: ["OR", "MI"],
    address: "",
    phone: "",
    programTypes: [] as string[],
    primaryGoal: "both",
    budgetTier: "moderate",
    caregiverTarget: 20,
    patientTarget: 20,
    usps: [] as string[],
  });
  const navigate = useNavigate();

  const next = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <img src={logo} alt="Halevai.ai" className="h-12 mb-8" />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i <= currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-xl bg-card halevai-border">
        <CardContent className="p-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Agency Setup</h2>
              <div className="space-y-2">
                <Label>Agency Name</Label>
                <Input value={form.agencyName} onChange={(e) => setForm({...form, agencyName: e.target.value})} placeholder="Care at Home" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>States of Operation</Label>
                <div className="flex flex-wrap gap-2">
                  {US_STATES.map((st) => (
                    <Badge
                      key={st}
                      className={`cursor-pointer transition-colors ${
                        form.states.includes(st) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                      onClick={() => setForm({...form, states: form.states.includes(st) ? form.states.filter(s => s !== st) : [...form.states, st]})}
                    >
                      {st}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Office Address</Label>
                <Input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="bg-secondary border-border" />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Service Configuration</h2>
              <div className="space-y-3">
                <Label>Program Types</Label>
                {["Consumer-Directed", "Traditional Home Care", "Both"].map((pt) => (
                  <div key={pt} className="flex items-center gap-2">
                    <Checkbox checked={form.programTypes.includes(pt)} onCheckedChange={(checked) => {
                      setForm({...form, programTypes: checked ? [...form.programTypes, pt] : form.programTypes.filter(p => p !== pt)});
                    }} />
                    <span className="text-sm text-foreground">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Growth Goals</h2>
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[{k:"grow_census",l:"Grow Census"},{k:"recruit",l:"Recruit Caregivers"},{k:"both",l:"Both"}].map((g) => (
                    <Button key={g.k} variant={form.primaryGoal === g.k ? "default" : "outline"} onClick={() => setForm({...form, primaryGoal: g.k})} className={form.primaryGoal === g.k ? "bg-primary text-primary-foreground" : ""}>{g.l}</Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Caregiver Target</Label>
                  <Input type="number" value={form.caregiverTarget} onChange={(e) => setForm({...form, caregiverTarget: +e.target.value})} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Patient Target</Label>
                  <Input type="number" value={form.patientTarget} onChange={(e) => setForm({...form, patientTarget: +e.target.value})} className="bg-secondary border-border" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Unique Selling Points</h2>
              <p className="text-sm text-muted-foreground">Select what makes your agency stand out:</p>
              <div className="space-y-3">
                {USP_OPTIONS.map((usp) => (
                  <div key={usp} className="flex items-center gap-2">
                    <Checkbox checked={form.usps.includes(usp)} onCheckedChange={(checked) => {
                      setForm({...form, usps: checked ? [...form.usps, usp] : form.usps.filter(u => u !== usp)});
                    }} />
                    <span className="text-sm text-foreground">{usp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Generating Your AI Strategy</h2>
              <p className="text-sm text-muted-foreground">Creating customized landing pages, content, and outreach sequences...</p>
              <div className="space-y-2 text-left max-w-sm mx-auto">
                {["Analyzing market data...", "Creating landing page templates...", "Generating content calendar...", "Building outreach sequences..."].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4 text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-sm text-muted-foreground">Your agency is configured and ready to grow.</p>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[{l:"Landing Pages",v:"3"},{l:"Content Posts",v:"12"},{l:"Outreach Sequences",v:"4"}].map((s) => (
                  <div key={s.l} className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="font-data text-xl font-bold text-primary">{s.v}</div>
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {currentStep > 0 ? (
              <Button variant="outline" onClick={prev}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            ) : <div />}
            {currentStep < 5 ? (
              <Button className="bg-primary text-primary-foreground" onClick={next}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button className="bg-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" /></Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
