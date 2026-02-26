import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Facebook, Instagram, Linkedin } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const posts = [
  { day: 0, title: "Caregiver Spotlight: Maria", platform: "facebook", status: "published", lang: "EN" },
  { day: 0, title: "Vietnamese Community Outreach", platform: "facebook", status: "scheduled", lang: "VI" },
  { day: 1, title: "Get Paid $22/hr — Apply Today", platform: "instagram", status: "scheduled", lang: "EN" },
  { day: 2, title: "Why Families Choose Care at Home", platform: "linkedin", status: "draft", lang: "EN" },
  { day: 3, title: "Caregiver FAQ: Medicaid Paperwork", platform: "facebook", status: "draft", lang: "EN" },
  { day: 3, title: "Preguntas Frecuentes", platform: "facebook", status: "draft", lang: "ES" },
  { day: 4, title: "Weekend Availability — Hiring Now", platform: "instagram", status: "scheduled", lang: "EN" },
];

const platformIcon = (p: string) => {
  switch (p) {
    case "facebook": return <Facebook className="h-3 w-3" />;
    case "instagram": return <Instagram className="h-3 w-3" />;
    case "linkedin": return <Linkedin className="h-3 w-3" />;
    default: return null;
  }
};

const ContentCalendar = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
        </div>
        <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Generate Content</Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <div key={d}>
            <div className="text-center text-xs text-muted-foreground font-medium mb-2">{d}</div>
            <div className="space-y-2 min-h-[200px]">
              {posts.filter(p => p.day === i).map((p, j) => (
                <Card key={j} className="bg-card halevai-border hover:border-primary/30 cursor-pointer transition-colors">
                  <CardContent className="p-2">
                    <div className="flex items-center gap-1 mb-1">
                      {platformIcon(p.platform)}
                      <Badge className={`text-[8px] px-1 py-0 ${
                        p.status === "published" ? "bg-green-500/20 text-green-400" :
                        p.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                        "bg-secondary text-muted-foreground"
                      }`}>{p.status}</Badge>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-border">{p.lang}</Badge>
                    </div>
                    <p className="text-[11px] text-foreground leading-tight">{p.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default ContentCalendar;
