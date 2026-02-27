import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Send, Loader2, BarChart3 } from "lucide-react";
import { useReviews, useReviewRequests, useCaregivers } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Reviews = () => {
  
  const { data: reviews, isLoading, refetch } = useReviews();
  const { data: requests } = useReviewRequests();
  const { data: caregivers } = useCaregivers();
  const { agencyId } = useAuth();
  const all = reviews || [];
  const avgRating = all.length > 0 ? (all.reduce((s, r) => s + (r.rating || 0), 0) / all.length).toFixed(1) : "0";
  const unresponded = all.filter(r => !r.responded).length;
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [solicitOpen, setSolicitOpen] = useState(false);

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map(r => ({ rating: `${r}★`, count: all.filter(x => x.rating === r).length }));

  const handleDraft = async (review: any) => {
    setDraftingId(review.id);
    setDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke("halevai-chat", {
        body: {
          messages: [{ role: "user", content: `Draft a professional, HIPAA-safe response to this Google review. Never mention specific patient details. Review: "${review.review_text}" (${review.rating} stars from ${review.reviewer_name}). Keep it warm, professional, and under 100 words.` }],
          agencyId,
        },
      });
      // For non-streaming, parse the response
      if (data) {
        const text = typeof data === "string" ? data : JSON.stringify(data);
        setDraftText(text);
      }
    } catch (e: any) {
      toast.error("Failed to generate draft");
    }
    setDrafting(false);
  };

  const handleSaveResponse = async (reviewId: string) => {
    try {
      await supabase.from("reviews").update({ responded: true, response_text: draftText } as any).eq("id", reviewId);
      toast.success("Response saved!");
      setDraftingId(null);
      setDraftText("");
      refetch();
    } catch (e: any) {
      toast.error("Failed to save");
    }
  };

  const handleSolicit = async () => {
    const activeCaregivers = (caregivers || []).filter(c => c.status === "active").slice(0, 5);
    if (activeCaregivers.length === 0) { toast.error("No active caregivers"); return; }
    try {
      for (const c of activeCaregivers) {
        await supabase.from("review_requests" as any).insert({
          agency_id: agencyId!,
          caregiver_id: c.id,
          status: "sent",
          review_link: "https://g.page/careathome/review",
        });
      }
      toast.success(`Review requests sent to ${activeCaregivers.length} caregivers!`);
      setSolicitOpen(false);
    } catch (e: any) {
      toast.error("Failed to send requests");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          </div>
          <Dialog open={solicitOpen} onOpenChange={setSolicitOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground"><Send className="h-4 w-4 mr-1" /> Request Reviews</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Send Review Requests</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Send review requests to active caregivers via SMS/email with a link to leave a Google review.</p>
              <p className="text-sm text-foreground">{(caregivers || []).filter(c => c.status === "active").length} active caregivers will receive requests.</p>
              <Button onClick={handleSolicit} className="bg-primary text-primary-foreground"><Send className="h-4 w-4 mr-1" /> Send to All Active</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center">
            <div className="font-data text-3xl font-bold text-primary">{avgRating}</div>
            <div className="flex justify-center gap-0.5 my-1">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />)}</div>
            <div className="text-xs text-muted-foreground">Average Rating</div>
          </CardContent></Card>
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-foreground">{all.length}</div><div className="text-xs text-muted-foreground">Total Reviews</div></CardContent></Card>
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-red-400">{unresponded}</div><div className="text-xs text-muted-foreground">Unresponded</div></CardContent></Card>
          <Card className="bg-card halevai-border"><CardContent className="p-4 text-center"><div className="font-data text-2xl font-bold text-foreground">{(requests || []).length}</div><div className="text-xs text-muted-foreground">Requests Sent</div></CardContent></Card>
        </div>

        <Tabs defaultValue="reviews">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="dashboard"><BarChart3 className="h-3 w-3 mr-1" />Dashboard</TabsTrigger>
            <TabsTrigger value="requests">Requests ({(requests || []).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            {isLoading ? <Skeleton className="h-48" /> : (
              <div className="space-y-3">
                {all.map((r) => (
                  <Card key={r.id} className={`bg-card halevai-border ${!r.responded && (r.rating || 5) <= 3 ? "border-destructive/20" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-foreground">{r.reviewer_name || "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground ml-2">• {r.created_at ? format(new Date(r.created_at), "MMM d") : "—"} • {r.source || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">{Array(5).fill(0).map((_, j) => <Star key={j} className={`h-3 w-3 ${j < (r.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />)}</div>
                          <Badge className={r.responded ? "bg-green-500/20 text-green-400 text-[10px]" : "bg-red-500/20 text-red-400 text-[10px]"}>{r.responded ? "Responded" : "Needs Response"}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.review_text}</p>
                      {r.response_text && <div className="mt-2 p-2 bg-secondary/30 rounded text-xs text-muted-foreground"><strong>Response:</strong> {r.response_text}</div>}
                      {!r.responded && draftingId !== r.id && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDraft(r)} disabled={drafting}>
                            <MessageSquare className="h-3 w-3 mr-1" /> AI Draft Response
                          </Button>
                        </div>
                      )}
                      {draftingId === r.id && (
                        <div className="mt-3 space-y-2">
                          {drafting ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Drafting response...</div> : (
                            <>
                              <Textarea value={draftText} onChange={e => setDraftText(e.target.value)} className="bg-secondary border-border" />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveResponse(r.id)}>Save Response</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setDraftingId(null); setDraftText(""); }}>Cancel</Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {all.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No reviews yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4">Request reviews from active caregivers to build your online reputation.</p>
                    <Button onClick={() => setSolicitOpen(true)} className="bg-primary text-primary-foreground"><Send className="h-4 w-4 mr-1" /> Request Reviews</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card halevai-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Rating Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ratingDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,20%,16%)" />
                      <XAxis dataKey="rating" tick={{ fill: "hsl(225,15%,55%)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(225,15%,55%)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(225,25%,9%)", border: "1px solid hsl(195,100%,50%,0.2)" }} />
                      <Bar dataKey="count" fill="hsl(195,100%,50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-card halevai-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Response Rate</h3>
                  <div className="text-center py-8">
                    <div className="font-data text-4xl font-bold text-primary">{all.length > 0 ? Math.round((all.filter(r => r.responded).length / all.length) * 100) : 0}%</div>
                    <p className="text-sm text-muted-foreground mt-2">{all.filter(r => r.responded).length} of {all.length} reviews responded</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-3">
              {(requests || []).map((req: any) => (
                <Card key={req.id} className="bg-card halevai-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <Badge className={req.status === "completed" ? "bg-green-500/20 text-green-400" : req.status === "clicked" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}>{req.status}</Badge>
                      <span className="text-sm text-muted-foreground ml-2">Sent {req.sent_at ? format(new Date(req.sent_at), "MMM d") : "—"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Reminders: {req.reminder_count}/{req.max_reminders}</span>
                  </CardContent>
                </Card>
              ))}
              {(requests || []).length === 0 && <p className="text-center text-muted-foreground py-8">No review requests sent yet</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reviews;
