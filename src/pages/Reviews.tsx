import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Send } from "lucide-react";

const reviewsList = [
  { name: "Jennifer M.", rating: 5, text: "Care at Home has been wonderful. They helped us get my mother enrolled and everything was so smooth.", source: "Google", responded: true, date: "Feb 20" },
  { name: "Robert K.", rating: 4, text: "Good experience overall. The onboarding was quick and the staff is helpful.", source: "Google", responded: true, date: "Feb 18" },
  { name: "Anonymous", rating: 2, text: "Took too long to get started. Communication could be better.", source: "Yelp", responded: false, date: "Feb 15" },
  { name: "Maria S.", rating: 5, text: "I love working for Care at Home! Best pay rate in Oregon and they truly care about caregivers.", source: "Indeed", responded: false, date: "Feb 12" },
  { name: "David L.", rating: 3, text: "Decent company but paperwork process is slow.", source: "Google", responded: false, date: "Feb 10" },
];

const Reviews = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        </div>
        <Button className="bg-primary text-primary-foreground"><Send className="h-4 w-4 mr-1" /> Request Reviews</Button>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-card halevai-border">
          <CardContent className="p-4 text-center">
            <div className="font-data text-3xl font-bold text-primary">4.2</div>
            <div className="flex justify-center gap-0.5 my-1">{[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}<Star className="h-4 w-4 text-yellow-400" /></div>
            <div className="text-xs text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
        <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-foreground">127</div><div className="text-xs text-muted-foreground">Total Reviews</div></CardContent></Card>
        <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-red-400">3</div><div className="text-xs text-muted-foreground">Unresponded</div></CardContent></Card>
        <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-foreground">12</div><div className="text-xs text-muted-foreground">Pending Requests</div></CardContent></Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviewsList.map((r, i) => (
          <Card key={i} className={`bg-card halevai-border ${!r.responded && r.rating <= 3 ? "border-red-500/20" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">• {r.date} • {r.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">{Array(5).fill(0).map((_, j) => <Star key={j} className={`h-3 w-3 ${j < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />)}</div>
                  {r.responded ? (
                    <Badge className="bg-green-500/20 text-green-400 text-[10px]">Responded</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 text-[10px]">Needs Response</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.text}</p>
              {!r.responded && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline"><MessageSquare className="h-3 w-3 mr-1" /> AI Draft Response</Button>
                  <Button size="sm" variant="outline">Reply Manually</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Reviews;
