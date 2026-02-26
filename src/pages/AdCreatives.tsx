import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Sparkles } from "lucide-react";
import { useAdCreatives } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const AdCreatives = () => {
  const { data: creatives, isLoading } = useAdCreatives();
  const all = creatives || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Ad Creatives</h1>
          </div>
          <Button className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4 mr-1" /> Generate Creative</Button>
        </div>

        {isLoading ? <div className="grid md:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}</div> : (
          <div className="grid md:grid-cols-2 gap-4">
            {all.map((c) => (
              <Card key={c.id} className="bg-card halevai-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="h-32 bg-secondary/50 rounded-lg mb-4 flex items-center justify-center">
                    {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover rounded-lg" /> : <Image className="h-8 w-8 text-muted-foreground/30" />}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{c.headline}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.body_copy}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.prompt ? `Prompt: ${c.prompt}` : ""}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {all.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">No ad creatives yet</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdCreatives;
