import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Send } from "lucide-react";
import { useReviews } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Reviews = () => {
  const { data: reviews, isLoading } = useReviews();
  const all = reviews || [];
  const avgRating = all.length > 0 ? (all.reduce((s, r) => s + (r.rating || 0), 0) / all.length).toFixed(1) : "0";
  const unresponded = all.filter(r => !r.responded).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          </div>
          <Button className="bg-primary text-primary-foreground"><Send className="h-4 w-4 mr-1" /> Request Reviews</Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center">
            <div className="font-data text-3xl font-bold text-primary">{avgRating}</div>
            <div className="flex justify-center gap-0.5 my-1">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />)}</div>
            <div className="text-xs text-muted-foreground">Average Rating</div>
          </CardContent></Card>
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-foreground">{all.length}</div><div className="text-xs text-muted-foreground">Total Reviews</div></CardContent></Card>
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-red-400">{unresponded}</div><div className="text-xs text-muted-foreground">Unresponded</div></CardContent></Card>
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-foreground">{all.filter(r => r.responded).length}</div><div className="text-xs text-muted-foreground">Responded</div></CardContent></Card>
        </div>

        {isLoading ? <Skeleton className="h-48" /> : (
          <div className="space-y-3">
            {all.map((r) => (
              <Card key={r.id} className={`bg-card halevai-border ${!r.responded && (r.rating || 5) <= 3 ? "border-red-500/20" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-foreground">{r.reviewer_name || "Anonymous"}</span>
                      <span className="text-xs text-muted-foreground ml-2">• {r.created_at ? format(new Date(r.created_at), "MMM d") : "—"} • {r.source || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{Array(5).fill(0).map((_, j) => <Star key={j} className={`h-3 w-3 ${j < (r.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />)}</div>
                      {r.responded ? (
                        <Badge className="bg-green-500/20 text-green-400 text-[10px]">Responded</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 text-[10px]">Needs Response</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.review_text}</p>
                  {!r.responded && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline"><MessageSquare className="h-3 w-3 mr-1" /> AI Draft Response</Button>
                      <Button size="sm" variant="outline">Reply Manually</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {all.length === 0 && <p className="text-center text-muted-foreground py-8">No reviews yet</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;
