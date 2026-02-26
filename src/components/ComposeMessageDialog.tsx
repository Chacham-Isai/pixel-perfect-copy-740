import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Channel = "sms" | "email";

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
  caregiverId: string;
  caregiverName: string;
  agencyId: string;
  defaultTo: string; // phone or email
}

export function ComposeMessageDialog({
  open,
  onOpenChange,
  channel,
  caregiverId,
  caregiverName,
  agencyId,
  defaultTo,
}: ComposeMessageDialogProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }
    setSending(true);
    try {
      // Log the outreach activity
      const { error } = await supabase.from("caregiver_activities").insert({
        agency_id: agencyId,
        caregiver_id: caregiverId,
        action_type: channel === "sms" ? "sms_sent" : "email_sent",
        note: channel === "email" && subject
          ? `Subject: ${subject}\n\n${body}`
          : body,
      });
      if (error) throw error;

      // Update last_contacted_at on the caregiver
      await supabase
        .from("caregivers")
        .update({ last_contacted_at: new Date().toISOString() } as any)
        .eq("id", caregiverId);

      toast.success(`${channel === "sms" ? "SMS" : "Email"} logged for ${caregiverName}`);
      qc.invalidateQueries({ queryKey: ["caregivers"] });
      onOpenChange(false);
      setBody("");
      setSubject("");
    } catch (e: any) {
      toast.error(e.message || "Failed to log message");
    }
    setSending(false);
  };

  const isSms = channel === "sms";
  const title = isSms ? "Compose SMS" : "Compose Email";
  const toLabel = isSms ? "Phone" : "Email";
  const placeholder = isSms
    ? "Hi {{name}}, this is a reminder about your enrollment..."
    : "We wanted to follow up regarding your caregiver application...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title} — {caregiverName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{toLabel}</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-secondary border-border"
              placeholder={isSms ? "(555) 123-4567" : "email@example.com"}
            />
          </div>
          {!isSms && (
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Follow-up on enrollment"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-secondary border-border min-h-[120px]"
              placeholder={placeholder}
            />
            {isSms && (
              <p className="text-xs text-muted-foreground">{body.length}/160 characters</p>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="w-full bg-primary text-primary-foreground"
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Sending...</>
            ) : (
              <><Send className="h-4 w-4 mr-1" />Log & Send {isSms ? "SMS" : "Email"}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Messages are logged to the activity timeline. Actual delivery requires a connected messaging provider.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
