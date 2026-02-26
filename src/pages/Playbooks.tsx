import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, DollarSign, TrendingUp, Play } from "lucide-react";

const playbooks = [
  { name: "New Market Entry", desc: "Launch recruitment in a new county with landing pages, sourcing, and outreach.", category: "Growth", time: "2 weeks", cost: "$500-1000", results: "15-25 caregivers", steps: 8 },
  { name: "Competitor Poaching Blitz", desc: "Target caregivers at lower-paying competitors with comparison messaging.", category: "Recruitment", time: "1 week", cost: "$200-500", results: "5-10 caregivers", steps: 6 },
  { name: "Community Grassroots", desc: "Build referral networks through churches, community centers, and ethnic organizations.", category: "Community", time: "4 weeks", cost: "$100-300", results: "8-15 referrals/mo", steps: 10 },
  { name: "Review Boost Campaign", desc: "Systematic review solicitation from active caregivers and families.", category: "Reviews", time: "2 weeks", cost: "$0", results: "+20 reviews", steps: 5 },
  { name: "Multilingual Expansion", desc: "Create language-specific landing pages and outreach for non-English communities.", category: "Growth", time: "1 week", cost: "$100-200", results: "+30% reach", steps: 7 },
];

const Playbooks = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Growth Playbooks</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {playbooks.map((p) => (
          <Card key={p.name} className="bg-card halevai-border hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="border-primary/30 text-primary">{p.category}</Badge>
                <span className="text-xs text-muted-foreground font-data">{p.steps} steps</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {p.time}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" /> {p.cost}</div>
                <div className="flex items-center gap-1 text-xs text-primary"><TrendingUp className="h-3 w-3" /> {p.results}</div>
              </div>
              <Button size="sm" className="w-full bg-primary text-primary-foreground">
                <Play className="h-3 w-3 mr-1" /> Execute Playbook
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Playbooks;
