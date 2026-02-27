import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Building2, Stethoscope, Target, Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/halevai-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

type TaskStatus = "pending" | "running" | "done" | "error";

interface GenerationTask {
  label: string;
  status: TaskStatus;
  error?: string;
}

interface GenerationResults {
  landingPages: number;
  contentPosts: number;
  briefingGenerated: boolean;
}

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
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [results, setResults] = useState<GenerationResults>({
    landingPages: 0,
    contentPosts: 0,
    briefingGenerated: false,
  });
  const generationStarted = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const next = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const updateTask = useCallback((index: number, update: Partial<GenerationTask>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  }, []);

  const getAgencyId = useCallback(async (): Promise<string | null> => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return null;
    const { data } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();
    return data?.agency_id || null;
  }, []);

  const saveAgencyData = useCallback(async (agencyId: string) => {
    // Update agencies table so edge functions have the latest data
    await supabase.from("agencies").update({
      name: form.agencyName || undefined,
      states: form.states,
      phone: form.phone || undefined,
      primary_state: form.states[0] ?? null,
      office_address: form.address || undefined,
    }).eq("id", agencyId);

    // Upsert business_config
    await supabase.from("business_config").upsert({
      agency_id: agencyId,
      business_name: form.agencyName || undefined,
      phone: form.phone || undefined,
      tagline: "We Handle All the Paperwork",
      industry: form.programTypes.join(", ") || "home_care",
      primary_color: "#00bfff",
    }, { onConflict: "agency_id" });
  }, [form]);

  const runGeneration = useCallback(async () => {
    if (generationStarted.current) return;
    generationStarted.current = true;
    setGenerating(true);

    const taskList: GenerationTask[] = [
      { label: "Saving agency configuration...", status: "pending" },
      ...form.states.slice(0, 3).map((st) => ({
        label: `Creating landing page for ${st}...`,
        status: "pending" as TaskStatus,
      })),
      { label: "Generating content calendar...", status: "pending" },
      { label: "Creating daily briefing...", status: "pending" },
    ];
    setTasks(taskList);

    let agencyId: string | null = null;
    let taskIdx = 0;

    // Step 1: Save agency data
    try {
      updateTask(taskIdx, { status: "running" });
      agencyId = await getAgencyId();
      if (!agencyId) throw new Error("No agency found");
      await saveAgencyData(agencyId);
      updateTask(taskIdx, { status: "done" });
    } catch (err) {
      updateTask(taskIdx, { status: "error", error: err instanceof Error ? err.message : "Failed" });
      setGenerating(false);
      setGenerationDone(true);
      return;
    }
    taskIdx++;

    // Step 2: Generate landing pages (up to 3 states)
    let landingPageCount = 0;
    for (const st of form.states.slice(0, 3)) {
      try {
        updateTask(taskIdx, { status: "running" });
        const { data, error } = await supabase.functions.invoke("generate-landing-content", {
          body: { agencyId, state: st },
        });

        if (error) throw error;
        if (data && !data.error) {
          // Save generated landing page to database
          const slug = `${st.toLowerCase()}-caregiver-${Date.now()}`;
          const { error: insertErr } = await supabase.from("landing_pages").insert({
            agency_id: agencyId,
            title: data.meta_title || `${st} Caregiver Recruitment`,
            slug,
            state: st,
            language: "english",
            hero_headline: data.hero_headline,
            hero_subheadline: data.hero_subheadline,
            hero_cta_text: data.hero_cta_text,
            pay_rate_highlight: data.pay_rate_highlight,
            benefits: data.benefits || [],
            testimonials: data.testimonials || [],
            faq: data.faq || [],
            published: false,
          });
          if (!insertErr) landingPageCount++;
          updateTask(taskIdx, { status: "done" });
        } else {
          throw new Error(data?.error || "Generation failed");
        }
      } catch (err) {
        updateTask(taskIdx, { status: "error", error: err instanceof Error ? err.message : "Failed" });
      }
      taskIdx++;
    }
    setResults((r) => ({ ...r, landingPages: landingPageCount }));

    // Step 3: Generate content posts
    let postCount = 0;
    try {
      updateTask(taskIdx, { status: "running" });
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          agencyId,
          platforms: ["Facebook", "Instagram"],
          topic: "caregiver recruitment",
          state: form.states[0] || "OR",
          count: 4,
        },
      });

      if (error) throw error;
      if (data?.posts?.length) {
        for (const post of data.posts) {
          const { error: postErr } = await supabase.from("content_posts").insert({
            agency_id: agencyId,
            title: post.title,
            body: post.body,
            platform: post.platform,
            hashtags: post.hashtags || [],
            status: "draft",
            ai_generated: true,
            state: form.states[0] || null,
          });
          if (!postErr) postCount++;
        }
      }
      updateTask(taskIdx, { status: "done" });
    } catch (err) {
      updateTask(taskIdx, { status: "error", error: err instanceof Error ? err.message : "Failed" });
    }
    setResults((r) => ({ ...r, contentPosts: postCount }));
    taskIdx++;

    // Step 4: Generate briefing
    try {
      updateTask(taskIdx, { status: "running" });
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("generate-briefing", {
        body: { agencyId, userId: currentUser?.id },
      });
      if (error) throw error;
      updateTask(taskIdx, { status: "done" });
      setResults((r) => ({ ...r, briefingGenerated: true }));
    } catch (err) {
      updateTask(taskIdx, { status: "error", error: err instanceof Error ? err.message : "Failed" });
    }

    setGenerating(false);
    setGenerationDone(true);
  }, [form, getAgencyId, saveAgencyData, updateTask]);

  // Trigger generation when step 4 is reached
  useEffect(() => {
    if (currentStep === 4 && !generationStarted.current) {
      runGeneration();
    }
  }, [currentStep, runGeneration]);

  // Auto-advance to summary when generation is complete
  useEffect(() => {
    if (generationDone && currentStep === 4) {
      const timer = setTimeout(() => next(), 1500);
      return () => clearTimeout(timer);
    }
  }, [generationDone, currentStep]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const agencyId = await getAgencyId();
      if (!agencyId) throw new Error("No agency found for user");

      // Insert onboarding row
      const { error: onboardingError } = await supabase.from("onboarding").insert({
        agency_id: agencyId,
        user_id: currentUser.id,
        agency_name: form.agencyName,
        states: form.states,
        program_types: form.programTypes,
        primary_goal: form.primaryGoal,
        budget_tier: form.budgetTier,
        monthly_caregiver_target: form.caregiverTarget,
        monthly_patient_target: form.patientTarget,
        unique_selling_points: form.usps,
        completed: true,
        completed_at: new Date().toISOString(),
        current_step: 6,
      });
      if (onboardingError) throw onboardingError;

      // Mark profile as onboarded
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarded: true })
        .eq("user_id", currentUser.id);
      if (profileError) throw profileError;

      toast.success("Setup complete! Welcome to Halevai.");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`Setup failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderTaskIcon = (status: TaskStatus) => {
    switch (status) {
      case "running": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "done": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />;
    }
  };

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
            <div className="space-y-4 py-6">
              <div className="text-center mb-6">
                {generating ? (
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                )}
                <h2 className="text-xl font-bold text-foreground mt-3">
                  {generating ? "Generating Your AI Strategy" : "Generation Complete!"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {generating
                    ? "Creating customized landing pages, content, and briefings from your inputs..."
                    : "Your content is ready. Proceeding to summary..."}
                </p>
              </div>
              <div className="space-y-3 max-w-sm mx-auto">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {renderTaskIcon(task.status)}
                    <span className={task.status === "error" ? "text-destructive" : task.status === "done" ? "text-foreground" : "text-muted-foreground"}>
                      {task.label}
                      {task.error && <span className="text-xs ml-1">({task.error})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4 text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-sm text-muted-foreground">Your agency is configured and AI-generated content is ready.</p>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[
                  { l: "Landing Pages", v: String(results.landingPages) },
                  { l: "Content Posts", v: String(results.contentPosts) },
                  { l: "Daily Briefing", v: results.briefingGenerated ? "✓" : "—" },
                ].map((s) => (
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
            {currentStep > 0 && currentStep !== 4 ? (
              <Button variant="outline" onClick={prev}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            ) : <div />}
            {currentStep < 4 ? (
              <Button className="bg-primary text-primary-foreground" onClick={next}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            ) : currentStep === 4 ? null : currentStep === 5 ? (
              <Button className="bg-primary text-primary-foreground" onClick={handleComplete} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : <>Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
