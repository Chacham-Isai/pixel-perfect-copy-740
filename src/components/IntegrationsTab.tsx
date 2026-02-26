import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CheckCircle2, XCircle, Eye, EyeOff, Plug, AlertTriangle } from "lucide-react";
import { useApiKeys, useSaveApiKey } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface IntegrationField {
  keyName: string;
  label: string;
  placeholder: string;
}

interface IntegrationSection {
  name: string;
  description: string;
  fields: IntegrationField[];
  enabled: boolean; // whether this is Phase 1 (enabled) or placeholder
}

const INTEGRATIONS: IntegrationSection[] = [
  {
    name: "Twilio (SMS)",
    description: "Send SMS messages to caregivers for follow-ups, welcome messages, and enrollment reminders.",
    fields: [
      { keyName: "twilio_account_sid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { keyName: "twilio_auth_token", label: "Auth Token", placeholder: "Your Twilio Auth Token" },
      { keyName: "twilio_phone_number", label: "Phone Number", placeholder: "+1234567890" },
    ],
    enabled: true,
  },
  {
    name: "SendGrid (Email)",
    description: "Send branded emails for sequences, enrollment updates, and review requests.",
    fields: [
      { keyName: "sendgrid_api_key", label: "API Key", placeholder: "SG.xxxxxxxxxxxxxxxxxxxx" },
    ],
    enabled: true,
  },
  {
    name: "Clay (Candidate Sourcing)",
    description: "Source and enrich caregiver candidates from professional databases.",
    fields: [
      { keyName: "clay_api_key", label: "API Key", placeholder: "Your Clay API Key" },
    ],
    enabled: true,
  },
  {
    name: "GoHighLevel (CRM & Outreach)",
    description: "Push candidates into GHL workflows for automated outreach sequences.",
    fields: [
      { keyName: "ghl_api_key", label: "API Key", placeholder: "Your GHL API Key" },
      { keyName: "ghl_subaccount_id", label: "Sub-Account ID", placeholder: "Location ID" },
    ],
    enabled: true,
  },
  {
    name: "Bland AI (Phone Screening)",
    description: "AI-powered phone screening calls for sourced candidates.",
    fields: [
      { keyName: "bland_ai_api_key", label: "API Key", placeholder: "Your Bland AI API Key" },
    ],
    enabled: true,
  },
];

export default function IntegrationsTab() {
  const { agencyId, isViewer } = useAuth();
  const { data: apiKeys, isLoading } = useApiKeys();
  const saveKey = useSaveApiKey();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (apiKeys) {
      const vals: Record<string, string> = {};
      apiKeys.forEach((k: any) => { vals[k.key_name] = k.key_value; });
      setFormValues(vals);
    }
  }, [apiKeys]);

  const getKeyStatus = (keyName: string) => {
    const key = apiKeys?.find((k: any) => k.key_name === keyName);
    if (!key) return "not_configured";
    if (key.connected) return "connected";
    return "saved";
  };

  const handleSave = async (keyName: string) => {
    if (!agencyId || !formValues[keyName]) return;
    setSavingKey(keyName);
    try {
      await saveKey.mutateAsync({ agencyId, keyName, keyValue: formValues[keyName] });
      toast.success(`${keyName} saved successfully`);
    } catch {
      toast.error("Failed to save key");
    }
    setSavingKey(null);
  };

  const toggleVisibility = (keyName: string) => {
    setVisibleFields(v => ({ ...v, [keyName]: !v[keyName] }));
  };

  const StatusBadge = ({ keyName }: { keyName: string }) => {
    const status = getKeyStatus(keyName);
    if (status === "connected") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
    if (status === "saved") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Saved (untested)</Badge>;
    return <Badge className="bg-muted text-muted-foreground border-border"><XCircle className="h-3 w-3 mr-1" />Not configured</Badge>;
  };

  if (isLoading) return <div className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading integrations...</div>;

  return (
    <div className="space-y-4">
      {INTEGRATIONS.map((section) => {
        const allConfigured = section.fields.every(f => getKeyStatus(f.keyName) !== "not_configured");
        const anyConnected = section.fields.some(f => getKeyStatus(f.keyName) === "connected");

        return (
          <Card key={section.name} className="bg-card halevai-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plug className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{section.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  </div>
                </div>
                {anyConnected ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
                ) : allConfigured ? (
                  <Badge className="bg-amber-500/20 text-amber-400">Keys Saved</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.keyName} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{field.label}</Label>
                    <StatusBadge keyName={field.keyName} />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={visibleFields[field.keyName] ? "text" : "password"}
                        value={formValues[field.keyName] || ""}
                        onChange={e => setFormValues(v => ({ ...v, [field.keyName]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="bg-secondary border-border pr-10 font-mono text-xs"
                        disabled={isViewer}
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(field.keyName)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {visibleFields[field.keyName] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {!isViewer && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(field.keyName)}
                        disabled={savingKey === field.keyName || !formValues[field.keyName]}
                      >
                        {savingKey === field.keyName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {!allConfigured && (
                <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                  <p className="text-xs text-primary">
                    {section.name.includes("Twilio") && "Connect Twilio to enable SMS sending for follow-ups, welcome messages, and sequences."}
                    {section.name.includes("SendGrid") && "Connect SendGrid to enable branded email sending."}
                    {section.name.includes("Clay") && "Connect Clay to enable AI-powered candidate sourcing and enrichment."}
                    {section.name.includes("GoHighLevel") && "Connect GoHighLevel to push candidates into automated outreach workflows."}
                    {section.name.includes("Bland") && "Connect Bland AI to enable automated phone screening calls."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
