import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";

const automations = [
  { key: "auto_score_caregivers", label: "Auto-Score New Caregivers", desc: "AI scores 0-100, assigns tier (HOT/WARM/NURTURE)", active: true },
  { key: "auto_sms_hot_caregivers", label: "Auto-SMS Hot Caregivers", desc: "Welcome SMS for leads scoring ≥75", active: true },
  { key: "auto_followup_sequence", label: "Auto Follow-Up", desc: "4-stage progressive messaging over 14 days", active: false },
  { key: "stuck_caregiver_detection", label: "Stuck Caregiver Detection", desc: "7-day warning, 14-day auto-close", active: true },
  { key: "enrollment_stale_alert", label: "Enrollment Stale Alert", desc: "Flags stale enrollments by state-specific rules", active: true },
  { key: "background_check_reminder", label: "Background Check Reminder", desc: "Alerts for pending background checks", active: false },
  { key: "authorization_expiry_alert", label: "Auth Expiry Alert", desc: "30-day warning before authorization expires", active: false },
  { key: "negative_review_alert", label: "Negative Review Alert", desc: "HIPAA-safe AI drafts for ≤3-star reviews", active: true },
  { key: "daily_briefing", label: "Daily Briefing", desc: "AI executive report every morning at 6am ET", active: true },
  { key: "review_request_on_active", label: "Review Request on Active", desc: "Auto-request review when caregiver goes active", active: false },
  { key: "poach_detector", label: "Competitor Poach Alert", desc: "Flags competitor pay rate changes in your market", active: true },
  { key: "auto_source_candidates", label: "Auto-Source Candidates", desc: "Run sourcing campaigns on schedule (Clay)", active: false },
  { key: "auto_outreach_high_match", label: "Auto-Outreach High Match", desc: "Queue ≥80 match score for GHL outreach", active: false },
  { key: "auto_screen_responded", label: "Auto-Screen Responded", desc: "AI phone screen when outreach gets response (Bland)", active: false },
];

const Automations = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Automations</h1>
        </div>
        <Badge className="bg-primary/20 text-primary font-data">
          {automations.filter(a => a.active).length} / {automations.length} Active
        </Badge>
      </div>

      <div className="grid gap-3">
        {automations.map((a) => (
          <Card key={a.key} className={`bg-card halevai-border transition-colors ${a.active ? "border-primary/20" : ""}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{a.label}</span>
                  {a.active && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <Switch checked={a.active} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Automations;
