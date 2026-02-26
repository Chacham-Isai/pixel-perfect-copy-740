import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  MessageSquare, Mail, GitBranch, Zap, Clock, Plus, Sparkles, Save,
  Play, Pause, Trash2, Loader2, ArrowDown, ChevronRight, X,
  CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type StepType = "message" | "condition" | "wait" | "action";
type ConditionType = "replied" | "no_reply" | "keyword_match" | "status_changed" | "score_above" | "score_below" | "time_elapsed";
type ActionType = "update_status" | "add_tag" | "assign_to" | "create_notification" | "enroll_in_sequence" | "remove_from_sequence" | "update_score";

interface SequenceStep {
  id?: string;
  sequence_id: string;
  agency_id: string;
  step_number: number;
  step_type: StepType;
  channel: string;
  delay_hours: number;
  subject: string | null;
  body: string | null;
  active: boolean;
  ai_generated: boolean;
  condition_type: ConditionType | null;
  condition_value: string | null;
  true_next_step_id: string | null;
  false_next_step_id: string | null;
  action_type: ActionType | null;
  action_config: Record<string, any>;
}

const STEP_TYPE_CONFIG: Record<StepType, { label: string; icon: any; color: string; borderClass: string }> = {
  message: { label: "Message", icon: MessageSquare, color: "text-primary", borderClass: "border-primary/40" },
  condition: { label: "Condition", icon: GitBranch, color: "text-accent", borderClass: "border-accent/40" },
  action: { label: "Action", icon: Zap, color: "text-amber-400", borderClass: "border-amber-400/40" },
  wait: { label: "Wait", icon: Clock, color: "text-muted-foreground", borderClass: "border-border" },
};

const CONDITION_LABELS: Record<string, string> = {
  replied: "Contact replied",
  no_reply: "No reply received",
  keyword_match: "Keyword match in reply",
  status_changed: "Status changed to...",
  score_above: "Lead score above...",
  score_below: "Lead score below...",
  time_elapsed: "Time elapsed (hours)",
};

const ACTION_LABELS: Record<string, string> = {
  update_status: "Update caregiver status",
  create_notification: "Create notification",
  enroll_in_sequence: "Enroll in another sequence",
  remove_from_sequence: "Remove from sequence",
  update_score: "Adjust lead score",
  add_tag: "Add tag (future)",
  assign_to: "Assign to (future)",
};

const MERGE_FIELDS = ["{name}", "{pay_rate}", "{agency_name}", "{phone}", "{state}", "{county}"];

// Pre-built smart sequence templates
const SMART_TEMPLATES = [
  {
    id: "smart_nurture",
    name: "Smart Nurture (7 steps)",
    description: "Escalating outreach with reply-based branching over 14 days",
    steps: [
      { step_number: 1, step_type: "message" as StepType, channel: "sms", delay_hours: 0, subject: "Welcome", body: "Hi {name}, welcome to {agency_name}! We'd love to help you earn {pay_rate}/hr as a caregiver. Reply YES to get started or call {phone}.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 2, step_type: "condition" as StepType, channel: "sms", delay_hours: 24, subject: "Check reply", body: null, condition_type: "replied" as ConditionType, condition_value: null, action_type: null, action_config: {} },
      { step_number: 3, step_type: "action" as StepType, channel: "sms", delay_hours: 0, subject: "Update status", body: null, condition_type: null, condition_value: null, action_type: "update_status" as ActionType, action_config: { status: "contacted" } },
      { step_number: 4, step_type: "message" as StepType, channel: "sms", delay_hours: 0, subject: "Great news", body: "Great to hear from you, {name}! Let's schedule your intake call. What time works best? Call us at {phone}.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 5, step_type: "message" as StepType, channel: "sms", delay_hours: 72, subject: "Follow-up", body: "Hi {name}, just checking in from {agency_name}. Still interested in earning {pay_rate}/hr? We handle all the paperwork. Reply or call {phone}.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 6, step_type: "message" as StepType, channel: "email", delay_hours: 168, subject: "Benefits of Caregiving with {agency_name}", body: "Hi {name},\n\nHere's what our caregivers love about working with us:\n• Competitive pay at {pay_rate}/hr\n• Flexible scheduling\n• We handle all Medicaid paperwork\n• Ongoing support and training\n\nReady to get started? Reply to this email or call {phone}.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 7, step_type: "message" as StepType, channel: "sms", delay_hours: 336, subject: "Final", body: "Hi {name}, this is our last message. We're here whenever you're ready to earn {pay_rate}/hr with {agency_name}. {phone}", condition_type: null, condition_value: null, action_type: null, action_config: {} },
    ],
  },
  {
    id: "hot_lead",
    name: "Hot Lead Fast Track (5 steps)",
    description: "Rapid outreach for high-scoring leads with notification triggers",
    steps: [
      { step_number: 1, step_type: "message" as StepType, channel: "sms", delay_hours: 0, subject: "Immediate", body: "Hi {name}, your application looks great! {agency_name} would love to get you started at {pay_rate}/hr. Can we call you today? {phone}", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 2, step_type: "condition" as StepType, channel: "sms", delay_hours: 2, subject: "Check reply", body: null, condition_type: "replied" as ConditionType, condition_value: null, action_type: null, action_config: {} },
      { step_number: 3, step_type: "action" as StepType, channel: "sms", delay_hours: 0, subject: "Notify team", body: null, condition_type: null, condition_value: null, action_type: "create_notification" as ActionType, action_config: { title: "Hot lead replied!", body: "Call them now." } },
      { step_number: 4, step_type: "message" as StepType, channel: "sms", delay_hours: 6, subject: "Follow-up", body: "Hi {name}, following up from {agency_name}. {pay_rate}/hr, flexible hours, we handle everything. Call us: {phone}", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 5, step_type: "message" as StepType, channel: "email", delay_hours: 24, subject: "Your Caregiving Opportunity with {agency_name}", body: "Hi {name},\n\nWe'd love to have you on our team. Here's what we offer:\n• {pay_rate}/hr pay rate\n• Full Medicaid paperwork support\n• Flexible scheduling\n\nCall {phone} or reply to get started.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
    ],
  },
  {
    id: "competitor_poach",
    name: "Competitor Poach (6 steps)",
    description: "Pay comparison messaging to attract caregivers from other agencies",
    steps: [
      { step_number: 1, step_type: "message" as StepType, channel: "sms", delay_hours: 0, subject: "Pay comparison", body: "Hi {name}, {agency_name} pays {pay_rate}/hr — that's more than most agencies in {state}. Interested? Reply YES.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 2, step_type: "condition" as StepType, channel: "sms", delay_hours: 48, subject: "Check reply", body: null, condition_type: "replied" as ConditionType, condition_value: null, action_type: null, action_config: {} },
      { step_number: 3, step_type: "action" as StepType, channel: "sms", delay_hours: 0, subject: "Boost score", body: null, condition_type: null, condition_value: null, action_type: "update_score" as ActionType, action_config: { score_delta: 20 } },
      { step_number: 4, step_type: "message" as StepType, channel: "email", delay_hours: 96, subject: "What Your Current Agency Isn't Telling You", body: "Hi {name},\n\nMany caregivers don't realize they could be earning significantly more. At {agency_name}, we offer {pay_rate}/hr with full support.\n\nSwitching is easy — most caregivers transition in under a week.\n\nCall {phone} to learn more.", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 5, step_type: "message" as StepType, channel: "sms", delay_hours: 168, subject: "Math", body: "Quick math, {name}: {pay_rate}/hr × 40hrs = significantly more per week than most agencies. {agency_name} — {phone}", condition_type: null, condition_value: null, action_type: null, action_config: {} },
      { step_number: 6, step_type: "message" as StepType, channel: "sms", delay_hours: 504, subject: "Final", body: "Door's always open, {name}. When you want the raise, text us or call {phone}. — {agency_name}", condition_type: null, condition_value: null, action_type: null, action_config: {} },
    ],
  },
];

// --- Node Card Component ---
const StepNode = ({
  step, index, isSelected, onClick, stepsMap,
}: {
  step: SequenceStep; index: number; isSelected: boolean; onClick: () => void; stepsMap: Map<string, SequenceStep>;
}) => {
  const config = STEP_TYPE_CONFIG[step.step_type];
  const Icon = config.icon;

  const getPreview = () => {
    switch (step.step_type) {
      case "message":
        return step.body ? step.body.slice(0, 60) + (step.body.length > 60 ? "..." : "") : "No message body";
      case "condition":
        return CONDITION_LABELS[step.condition_type || ""] || "No condition set";
      case "action":
        return ACTION_LABELS[step.action_type || ""] || "No action set";
      case "wait":
        return `Wait ${step.delay_hours}h${step.condition_type ? ` or ${CONDITION_LABELS[step.condition_type]}` : ""}`;
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={onClick}
        className={`w-full max-w-md cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${config.borderClass} ${
          isSelected ? "ring-2 ring-primary shadow-lg" : ""
        } bg-card`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`text-[10px] ${config.color} border-current`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">#{step.step_number}</span>
          {step.step_type === "message" && (
            step.channel === "email"
              ? <Mail className="h-3 w-3 text-blue-400" />
              : <MessageSquare className="h-3 w-3 text-green-400" />
          )}
          {step.delay_hours > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{step.delay_hours}h
            </span>
          )}
          {!step.active && <Badge variant="outline" className="text-[8px] text-destructive border-destructive/30">Paused</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{getPreview()}</p>
      </div>

      {/* Branch arrows for condition nodes */}
      {step.step_type === "condition" && (
        <div className="flex gap-8 mt-2 w-full max-w-md justify-center">
          <div className="flex flex-col items-center text-[10px]">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Yes
            </div>
            {step.true_next_step_id && stepsMap.has(step.true_next_step_id) && (
              <span className="text-muted-foreground">→ Step {stepsMap.get(step.true_next_step_id)!.step_number}</span>
            )}
          </div>
          <div className="flex flex-col items-center text-[10px]">
            <div className="flex items-center gap-1 text-red-400">
              <XCircle className="h-3 w-3" /> No
            </div>
            {step.false_next_step_id && stepsMap.has(step.false_next_step_id) && (
              <span className="text-muted-foreground">→ Step {stepsMap.get(step.false_next_step_id)!.step_number}</span>
            )}
          </div>
        </div>
      )}

      {/* Connector arrow */}
      {step.step_type !== "condition" && (
        <ArrowDown className="h-4 w-4 text-border my-1" />
      )}
      {step.step_type === "condition" && (
        <ArrowDown className="h-4 w-4 text-border my-1" />
      )}
    </div>
  );
};

// --- Step Editor Panel ---
const StepEditor = ({
  step, allSteps, onChange, onDelete,
}: {
  step: SequenceStep; allSteps: SequenceStep[]; onChange: (updates: Partial<SequenceStep>) => void; onDelete: () => void;
}) => {
  const otherSteps = allSteps.filter(s => s.id !== step.id && s.id);

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Step {step.step_number}</h3>
        <div className="flex items-center gap-2">
          <Switch checked={step.active} onCheckedChange={(v) => onChange({ active: v })} />
          <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Step Type */}
      <div className="space-y-1">
        <Label className="text-xs">Step Type</Label>
        <Select value={step.step_type} onValueChange={(v) => onChange({ step_type: v as StepType })}>
          <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="message">💬 Message</SelectItem>
            <SelectItem value="condition">🔀 Condition</SelectItem>
            <SelectItem value="action">⚡ Action</SelectItem>
            <SelectItem value="wait">⏳ Wait</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delay */}
      <div className="space-y-1">
        <Label className="text-xs">Delay (hours from previous step)</Label>
        <Input type="number" value={step.delay_hours} onChange={(e) => onChange({ delay_hours: Number(e.target.value) })} className="bg-secondary border-border h-8 text-xs" />
      </div>

      {/* Message fields */}
      {step.step_type === "message" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Channel</Label>
            <Select value={step.channel} onValueChange={(v) => onChange({ channel: v })}>
              <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {step.channel === "email" && (
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input value={step.subject || ""} onChange={(e) => onChange({ subject: e.target.value })} className="bg-secondary border-border h-8 text-xs" placeholder="Email subject..." />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Message Body</Label>
            <Textarea value={step.body || ""} onChange={(e) => onChange({ body: e.target.value })} className="bg-secondary border-border text-xs min-h-[100px]" placeholder="Message body..." />
            <div className="flex flex-wrap gap-1 mt-1">
              {MERGE_FIELDS.map((f) => (
                <Badge key={f} variant="outline" className="text-[9px] cursor-pointer hover:bg-primary/10" onClick={() => onChange({ body: (step.body || "") + " " + f })}>
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Condition fields */}
      {step.step_type === "condition" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Condition Type</Label>
            <Select value={step.condition_type || ""} onValueChange={(v) => onChange({ condition_type: v as ConditionType })}>
              <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue placeholder="Select condition..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {step.condition_type && !["replied", "no_reply"].includes(step.condition_type) && (
            <div className="space-y-1">
              <Label className="text-xs">Condition Value</Label>
              <Input value={step.condition_value || ""} onChange={(e) => onChange({ condition_value: e.target.value })} className="bg-secondary border-border h-8 text-xs" placeholder={step.condition_type === "keyword_match" ? "e.g. YES" : step.condition_type === "score_above" ? "e.g. 70" : "Value..."} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-emerald-400">If TRUE → go to step</Label>
            <Select value={step.true_next_step_id || "__next__"} onValueChange={(v) => onChange({ true_next_step_id: v === "__next__" ? null : v })}>
              <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__next__">Next step (default)</SelectItem>
                {otherSteps.map((s) => (
                  <SelectItem key={s.id} value={s.id!}>Step {s.step_number}: {STEP_TYPE_CONFIG[s.step_type].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-red-400">If FALSE → go to step</Label>
            <Select value={step.false_next_step_id || "__next__"} onValueChange={(v) => onChange({ false_next_step_id: v === "__next__" ? null : v })}>
              <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__next__">Next step (default)</SelectItem>
                {otherSteps.map((s) => (
                  <SelectItem key={s.id} value={s.id!}>Step {s.step_number}: {STEP_TYPE_CONFIG[s.step_type].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Action fields */}
      {step.step_type === "action" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Action Type</Label>
            <Select value={step.action_type || ""} onValueChange={(v) => onChange({ action_type: v as ActionType })}>
              <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue placeholder="Select action..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {step.action_type === "update_status" && (
            <div className="space-y-1">
              <Label className="text-xs">New Status</Label>
              <Select value={(step.action_config as any)?.status || ""} onValueChange={(v) => onChange({ action_config: { ...step.action_config, status: v } })}>
                <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {["new", "contacted", "intake_started", "enrollment_pending", "active"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {step.action_type === "create_notification" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Notification Title</Label>
                <Input value={(step.action_config as any)?.title || ""} onChange={(e) => onChange({ action_config: { ...step.action_config, title: e.target.value } })} className="bg-secondary border-border h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notification Body</Label>
                <Input value={(step.action_config as any)?.body || ""} onChange={(e) => onChange({ action_config: { ...step.action_config, body: e.target.value } })} className="bg-secondary border-border h-8 text-xs" />
              </div>
            </>
          )}
          {step.action_type === "update_score" && (
            <div className="space-y-1">
              <Label className="text-xs">Score Delta (positive or negative)</Label>
              <Input type="number" value={(step.action_config as any)?.score_delta || 0} onChange={(e) => onChange({ action_config: { ...step.action_config, score_delta: Number(e.target.value) } })} className="bg-secondary border-border h-8 text-xs" />
            </div>
          )}
        </>
      )}

      {/* Wait fields */}
      {step.step_type === "wait" && (
        <div className="space-y-1">
          <Label className="text-xs">Optional condition to check during wait</Label>
          <Select value={step.condition_type || "__none__"} onValueChange={(v) => onChange({ condition_type: v === "__none__" ? null : v as ConditionType })}>
            <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No condition (just wait)</SelectItem>
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

// --- Main SequenceBuilder Component ---
export const SequenceBuilder = ({
  sequenceId,
  sequenceName,
  onBack,
}: {
  sequenceId: string;
  sequenceName: string;
  onBack: () => void;
}) => {
  const { agencyId } = useAuth();
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const stepsMap = new Map(steps.filter(s => s.id).map(s => [s.id!, s]));

  const loadSteps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sequence_steps" as any)
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("step_number");
    if (!error) {
      setSteps((data || []).map((d: any) => ({
        ...d,
        step_type: d.step_type || "message",
        condition_type: d.condition_type || null,
        condition_value: d.condition_value || null,
        true_next_step_id: d.true_next_step_id || null,
        false_next_step_id: d.false_next_step_id || null,
        action_type: d.action_type || null,
        action_config: d.action_config || {},
        active: d.active ?? true,
        ai_generated: d.ai_generated ?? false,
      })));
    }
    setLoading(false);
  }, [sequenceId]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  const addStep = (type: StepType) => {
    if (!agencyId) return;
    const newStep: SequenceStep = {
      sequence_id: sequenceId,
      agency_id: agencyId,
      step_number: steps.length + 1,
      step_type: type,
      channel: "sms",
      delay_hours: steps.length === 0 ? 0 : 24,
      subject: null,
      body: type === "message" ? "" : null,
      active: true,
      ai_generated: false,
      condition_type: type === "condition" ? "replied" : null,
      condition_value: null,
      true_next_step_id: null,
      false_next_step_id: null,
      action_type: type === "action" ? "update_status" : null,
      action_config: {},
    };
    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
  };

  const updateStep = (index: number, updates: Partial<SequenceStep>) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const deleteStep = (index: number) => {
    setSteps(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
    setSelectedStepIndex(null);
  };

  const saveAll = async () => {
    if (!agencyId) return;
    setSaving(true);
    try {
      // Delete existing steps
      await supabase.from("sequence_steps" as any).delete().eq("sequence_id", sequenceId);
      // Insert all steps (without ids to get new ones, then update branch refs)
      const insertData = steps.map((s, i) => ({
        agency_id: agencyId,
        sequence_id: sequenceId,
        step_number: i + 1,
        step_type: s.step_type,
        channel: s.channel,
        delay_hours: s.delay_hours,
        subject: s.subject,
        body: s.body,
        active: s.active,
        ai_generated: s.ai_generated,
        condition_type: s.condition_type,
        condition_value: s.condition_value,
        action_type: s.action_type,
        action_config: s.action_config,
      }));

      const { data: inserted, error } = await supabase
        .from("sequence_steps" as any)
        .insert(insertData)
        .select("id, step_number");

      if (error) throw error;

      // Map old indices to new IDs for branch references
      if (inserted && inserted.length > 0) {
        const idByNumber = new Map((inserted as any[]).map((r: any) => [r.step_number, r.id]));

        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          if (s.step_type === "condition") {
            const trueId = s.true_next_step_id ? idByNumber.get(stepsMap.get(s.true_next_step_id)?.step_number) : null;
            const falseId = s.false_next_step_id ? idByNumber.get(stepsMap.get(s.false_next_step_id)?.step_number) : null;
            const newId = idByNumber.get(i + 1);
            if (newId && (trueId || falseId)) {
              await supabase.from("sequence_steps" as any).update({
                true_next_step_id: trueId || null,
                false_next_step_id: falseId || null,
              }).eq("id", newId);
            }
          }
        }
      }

      toast.success("Sequence saved!");
      await loadSteps();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const applyTemplate = async (template: typeof SMART_TEMPLATES[0]) => {
    if (!agencyId) return;
    setSteps(template.steps.map((s) => ({
      ...s,
      sequence_id: sequenceId,
      agency_id: agencyId,
      active: true,
      ai_generated: false,
      subject: s.subject || null,
      body: s.body || null,
      true_next_step_id: null,
      false_next_step_id: null,
    })));
    setTemplateDialogOpen(false);
    setSelectedStepIndex(null);
    toast.success(`Template "${template.name}" applied. Click Save to persist.`);
  };

  const generateAISequence = async () => {
    if (!agencyId) return;
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("campaign-optimizer", {
        body: { mode: "template", agencyId, context: "Generate a 5-step smart outreach sequence for caregivers with a mix of SMS and email. Include at least one condition step that checks if the contact replied. Return JSON with steps array where each step has: step_type (message/condition/action), channel (sms/email), delay_hours, subject, body, condition_type, action_type, action_config." },
      });
      if (error) throw error;
      const aiSteps = data?.result?.steps || [];
      if (aiSteps.length > 0) {
        setSteps(aiSteps.map((s: any, i: number) => ({
          sequence_id: sequenceId,
          agency_id: agencyId,
          step_number: i + 1,
          step_type: s.step_type || "message",
          channel: s.channel || "sms",
          delay_hours: s.delay_hours || (i * 24),
          subject: s.subject || null,
          body: s.body || null,
          active: true,
          ai_generated: true,
          condition_type: s.condition_type || null,
          condition_value: s.condition_value || null,
          true_next_step_id: null,
          false_next_step_id: null,
          action_type: s.action_type || null,
          action_config: s.action_config || {},
        })));
        toast.success("AI sequence generated! Click Save to persist.");
      } else {
        toast.info("AI didn't return steps. Try a template instead.");
      }
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    }
    setGeneratingAI(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowRight className="h-4 w-4 rotate-180 mr-1" />Back</Button>
          <h2 className="text-lg font-semibold text-foreground">{sequenceName}</h2>
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary/30 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowRight className="h-4 w-4 rotate-180 mr-1" />Back</Button>
          <h2 className="text-lg font-semibold text-foreground">{sequenceName}</h2>
          <Badge variant="outline" className="text-xs">{steps.length} steps</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            <FileIcon className="h-3 w-3 mr-1" />Templates
          </Button>
          <Button size="sm" variant="outline" onClick={generateAISequence} disabled={generatingAI}>
            {generatingAI ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            AI Generate
          </Button>
          <Button size="sm" onClick={saveAll} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => addStep("message")} className="border-primary/30 text-primary hover:bg-primary/10">
          <MessageSquare className="h-3 w-3 mr-1" />+ Message
        </Button>
        <Button size="sm" variant="outline" onClick={() => addStep("condition")} className="border-accent/30 text-accent hover:bg-accent/10">
          <GitBranch className="h-3 w-3 mr-1" />+ Condition
        </Button>
        <Button size="sm" variant="outline" onClick={() => addStep("action")} className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10">
          <Zap className="h-3 w-3 mr-1" />+ Action
        </Button>
        <Button size="sm" variant="outline" onClick={() => addStep("wait")} className="border-border text-muted-foreground hover:bg-secondary">
          <Clock className="h-3 w-3 mr-1" />+ Wait
        </Button>
      </div>

      {/* Canvas + Editor layout */}
      <div className="flex gap-4">
        {/* Flow canvas */}
        <div className={`flex-1 ${selectedStepIndex !== null ? "w-[60%]" : "w-full"}`}>
          <ScrollArea className="h-[500px] rounded-lg border border-border bg-secondary/10 p-4">
            <div className="flex flex-col items-center gap-1 py-4">
              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No steps yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Add steps above or use a template to get started.</p>
                </div>
              ) : (
                steps.map((step, i) => (
                  <StepNode
                    key={step.id || `new-${i}`}
                    step={step}
                    index={i}
                    isSelected={selectedStepIndex === i}
                    onClick={() => setSelectedStepIndex(i)}
                    stepsMap={stepsMap}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor panel */}
        {selectedStepIndex !== null && steps[selectedStepIndex] && (
          <div className="w-[40%] min-w-[280px]">
            <Card className="bg-card halevai-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit Step</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedStepIndex(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <ScrollArea className="h-[440px]">
                  <StepEditor
                    step={steps[selectedStepIndex]}
                    allSteps={steps}
                    onChange={(updates) => updateStep(selectedStepIndex, updates)}
                    onDelete={() => deleteStep(selectedStepIndex)}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Template dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="text-foreground">Smart Sequence Templates</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {SMART_TEMPLATES.map((t) => (
              <Card key={t.id} className="bg-secondary/30 halevai-border hover:border-primary/30 cursor-pointer transition-colors" onClick={() => applyTemplate(t)}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground text-sm">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {t.steps.map((s, i) => (
                      <Badge key={i} variant="outline" className={`text-[9px] ${STEP_TYPE_CONFIG[s.step_type].color} border-current`}>
                        {i + 1}. {STEP_TYPE_CONFIG[s.step_type].label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple file icon (avoiding extra import)
const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

export default SequenceBuilder;
