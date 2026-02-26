import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Plus, Sparkles } from "lucide-react";

const creatives = [
  { headline: "Get Paid $22/hr to Care for Mom", body: "Care at Home is hiring caregivers in Washington County. Highest pay, flexible schedule, we handle all paperwork.", campaign: "OR Recruitment Q1" },
  { headline: "Your Family. Your Schedule. Your Pay.", body: "Join Oregon's top-rated home care agency. Earn $22/hour caring for your loved one.", campaign: "WA County Facebook" },
  { headline: "¿Cuidas a un familiar? Te pagamos $22/hr", body: "Care at Home está contratando cuidadores en Oregon. La mejor paga del mercado.", campaign: "OR Spanish Campaign" },
  { headline: "Earn More Than FreedomCare", body: "Care at Home pays $22/hr — that's $4/hr more. Switch today and keep your schedule.", campaign: "Poaching Campaign" },
];

const AdCreatives = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Ad Creatives</h1>
        </div>
        <Button className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4 mr-1" /> Generate Creative</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {creatives.map((c, i) => (
          <Card key={i} className="bg-card halevai-border hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="h-32 bg-secondary/50 rounded-lg mb-4 flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{c.headline}</h3>
              <p className="text-sm text-muted-foreground mb-3">{c.body}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Campaign: {c.campaign}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">Download</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default AdCreatives;
