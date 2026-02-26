import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, X, ArrowRight } from "lucide-react";

const recommendations = [
  { title: "Launch Washington County Poaching Campaign", desc: "FreedomCare raised rates to $20/hr. Your $22/hr gives you a clear advantage. Target their caregivers with comparison messaging.", priority: "high", category: "Campaign", impact: "+8 caregivers/mo", status: "pending" },
  { title: "Create Vietnamese Landing Page for Washington Co.", desc: "22% of your Washington County leads speak Vietnamese. A dedicated landing page could increase conversions by 35%.", priority: "high", category: "Landing Page", impact: "+12% CVR", status: "pending" },
  { title: "Enable Auto Follow-Up Sequences", desc: "34 caregivers haven't been contacted in 5+ days. Auto follow-up could recover 40% of these leads.", priority: "medium", category: "Automation", impact: "+14 contacts", status: "pending" },
  { title: "Add Marion County to Sourcing", desc: "Low competition in Marion County with growing Medicaid enrollment. Early mover advantage.", priority: "medium", category: "Sourcing", impact: "+5 leads/mo", status: "approved" },
  { title: "Request Reviews from Active Caregivers", desc: "You have 24 active caregivers but only 127 reviews. Automated review requests could boost your rating.", priority: "low", category: "Reviews", impact: "+0.3 rating", status: "pending" },
];

const priorityColor = (p: string) => p === "high" ? "bg-red-500/20 text-red-400" : p === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400";

const Recommendations = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Recommendations</h1>
        </div>
        <Badge className="bg-primary/20 text-primary font-data">{recommendations.filter(r => r.status === "pending").length} pending</Badge>
      </div>

      <div className="space-y-3">
        {recommendations.map((r, i) => (
          <Card key={i} className="bg-card halevai-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{r.category}</Badge>
                    {r.status === "approved" && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Approved</Badge>}
                  </div>
                  <h3 className="font-semibold text-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                  <p className="text-xs text-primary font-data mt-2">Estimated Impact: {r.impact}</p>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-primary text-primary-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                  <Button size="sm" variant="outline"><ArrowRight className="h-3 w-3 mr-1" /> Execute Now</Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground"><X className="h-3 w-3 mr-1" /> Dismiss</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Recommendations;
