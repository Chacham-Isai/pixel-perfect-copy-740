import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PenTool, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const CampaignBuilder = () => {
  const [step, setStep] = useState(0);
  const steps = ["Campaign Type", "Targeting", "Content", "Review & Launch"];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <PenTool className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campaign Builder</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`text-sm ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Card className="bg-card halevai-border">
          <CardContent className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Select Campaign Type</h2>
                <div className="grid grid-cols-2 gap-3">
                  {["Recruitment", "Poaching", "Community Outreach", "Social Media"].map((t) => (
                    <Card key={t} className="bg-secondary/30 halevai-border hover:border-primary/40 cursor-pointer transition-colors p-4 text-center">
                      <span className="text-sm font-medium text-foreground">{t}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Targeting</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>State</Label><Input defaultValue="OR" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>County</Label><Input defaultValue="Washington" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Target Language</Label><Input defaultValue="English" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Budget</Label><Input defaultValue="$500" className="bg-secondary border-border" /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Content</h2>
                  <Button size="sm" variant="outline"><Sparkles className="h-3 w-3 mr-1" /> AI Generate</Button>
                </div>
                <div className="space-y-2"><Label>Headline</Label><Input defaultValue="Get Paid $22/hr to Care for Your Family" className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>Body Copy</Label><Input defaultValue="Care at Home is hiring caregivers in Washington County, OR..." className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>CTA</Label><Input defaultValue="Apply Now" className="bg-secondary border-border" /></div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-center py-6">
                <h2 className="text-lg font-semibold text-foreground">Ready to Launch!</h2>
                <p className="text-sm text-muted-foreground">Review your campaign settings and launch when ready.</p>
                <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
                  <div className="text-xs text-muted-foreground">Type:</div><div className="text-xs text-foreground">Recruitment</div>
                  <div className="text-xs text-muted-foreground">Target:</div><div className="text-xs text-foreground">Washington County, OR</div>
                  <div className="text-xs text-muted-foreground">Budget:</div><div className="text-xs text-foreground">$500</div>
                  <div className="text-xs text-muted-foreground">Language:</div><div className="text-xs text-foreground">English</div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step > 0 ? <Button variant="outline" onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button> : <div />}
              {step < 3 ? (
                <Button className="bg-primary text-primary-foreground" onClick={() => setStep(s => s + 1)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
              ) : (
                <Button className="bg-primary text-primary-foreground halevai-glow">🚀 Launch Campaign</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CampaignBuilder;
