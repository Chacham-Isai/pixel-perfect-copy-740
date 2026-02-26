import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Facebook, Instagram, Linkedin } from "lucide-react";
import { useContentPosts } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const platformIcon = (p: string | null) => {
  switch (p) {
    case "facebook": return <Facebook className="h-3 w-3" />;
    case "instagram": return <Instagram className="h-3 w-3" />;
    case "linkedin": return <Linkedin className="h-3 w-3" />;
    default: return null;
  }
};

const ContentCalendar = () => {
  const { data: posts, isLoading } = useContentPosts();
  const all = posts || [];

  // Group posts by day of week from scheduled_date
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday

  const postsByDay = days.map((_, i) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    const dateStr = dayDate.toISOString().split("T")[0];
    return all.filter(p => p.scheduled_date === dateStr);
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
          </div>
          <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Generate Content</Button>
        </div>

        {isLoading ? <Skeleton className="h-64" /> : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => (
              <div key={d}>
                <div className="text-center text-xs text-muted-foreground font-medium mb-2">{d}</div>
                <div className="space-y-2 min-h-[200px]">
                  {postsByDay[i].map((p) => (
                    <Card key={p.id} className="bg-card halevai-border hover:border-primary/30 cursor-pointer transition-colors">
                      <CardContent className="p-2">
                        <div className="flex items-center gap-1 mb-1">
                          {platformIcon(p.platform)}
                          <Badge className={`text-[8px] px-1 py-0 ${
                            p.status === "published" ? "bg-green-500/20 text-green-400" :
                            p.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                            "bg-secondary text-muted-foreground"
                          }`}>{p.status}</Badge>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-border">{(p.language || "en").toUpperCase().slice(0, 2)}</Badge>
                        </div>
                        <p className="text-[11px] text-foreground leading-tight">{p.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ContentCalendar;
