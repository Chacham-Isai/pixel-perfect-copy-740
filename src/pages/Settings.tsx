import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Building2, Bell, Palette, Loader2, Save, Plus, X } from "lucide-react";
import { useAgency, useBusinessConfig } from "@/hooks/useAgencyData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Settings = () => {
  const { data: agency, isLoading, refetch: refetchAgency } = useAgency();
  const { data: config, refetch: refetchConfig } = useBusinessConfig();
  const { agencyId } = useAuth();

  // Agency form
  const [agencyForm, setAgencyForm] = useState({ name: "", phone: "", email: "", website_url: "", office_address: "", states: [] as string[] });
  const [savingAgency, setSavingAgency] = useState(false);
  const [newState, setNewState] = useState("");

  // Branding form
  const [brandForm, setBrandForm] = useState({
    business_name: "", tagline: "", phone: "", email: "", website_url: "",
    primary_color: "", secondary_color: "", accent_color: "", logo_url: "",
    facebook_url: "", instagram_url: "", linkedin_url: "",
  });
  const [savingBrand, setSavingBrand] = useState(false);

  useEffect(() => {
    if (agency) {
      setAgencyForm({
        name: agency.name || "", phone: agency.phone || "", email: agency.email || "",
        website_url: agency.website_url || "", office_address: agency.office_address || "",
        states: agency.states || [],
      });
    }
  }, [agency]);

  useEffect(() => {
    if (config) {
      setBrandForm({
        business_name: config.business_name || "", tagline: config.tagline || "",
        phone: config.phone || "", email: config.email || "", website_url: config.website_url || "",
        primary_color: config.primary_color || "", secondary_color: config.secondary_color || "",
        accent_color: config.accent_color || "", logo_url: config.logo_url || "",
        facebook_url: config.facebook_url || "", instagram_url: config.instagram_url || "",
        linkedin_url: config.linkedin_url || "",
      });
    }
  }, [config]);

  const saveAgency = async () => {
    if (!agencyId) return;
    setSavingAgency(true);
    const { error } = await supabase.from("agencies").update({
      name: agencyForm.name, phone: agencyForm.phone || null, email: agencyForm.email || null,
      website_url: agencyForm.website_url || null, office_address: agencyForm.office_address || null,
      states: agencyForm.states,
    }).eq("id", agencyId);
    if (error) toast.error("Failed to save");
    else { toast.success("Agency profile saved!"); refetchAgency(); }
    setSavingAgency(false);
  };

  const saveBranding = async () => {
    if (!agencyId) return;
    setSavingBrand(true);
    if (config) {
      const { error } = await supabase.from("business_config").update(brandForm as any).eq("agency_id", agencyId);
      if (error) toast.error("Failed to save");
      else { toast.success("Branding saved!"); refetchConfig(); }
    } else {
      const { error } = await supabase.from("business_config").insert({ agency_id: agencyId, ...brandForm } as any);
      if (error) toast.error("Failed to create");
      else { toast.success("Branding config created!"); refetchConfig(); }
    }
    setSavingBrand(false);
  };

  const addState = () => {
    if (newState.trim() && !agencyForm.states.includes(newState.trim().toUpperCase())) {
      setAgencyForm(f => ({ ...f, states: [...f.states, newState.trim().toUpperCase()] }));
      setNewState("");
    }
  };

  const removeState = (st: string) => setAgencyForm(f => ({ ...f, states: f.states.filter(s => s !== st) }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>

        <Tabs defaultValue="agency">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="agency"><Building2 className="h-3 w-3 mr-1" />Agency Profile</TabsTrigger>
            <TabsTrigger value="branding"><Palette className="h-3 w-3 mr-1" />Branding</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-3 w-3 mr-1" />Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="agency" className="mt-4 space-y-4">
            {isLoading ? <Skeleton className="h-48" /> : (
              <Card className="bg-card halevai-border">
                <CardHeader><CardTitle>Agency Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Agency Name</Label><Input value={agencyForm.name} onChange={e => setAgencyForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={agencyForm.phone} onChange={e => setAgencyForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Email</Label><Input value={agencyForm.email} onChange={e => setAgencyForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Website</Label><Input value={agencyForm.website_url} onChange={e => setAgencyForm(f => ({ ...f, website_url: e.target.value }))} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="space-y-2"><Label>Office Address</Label><Input value={agencyForm.office_address} onChange={e => setAgencyForm(f => ({ ...f, office_address: e.target.value }))} className="bg-secondary border-border" /></div>
                  <div className="space-y-2">
                    <Label>States of Operation</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {agencyForm.states.map(st => (
                        <Badge key={st} className="bg-primary/20 text-primary cursor-pointer" onClick={() => removeState(st)}>{st} <X className="h-3 w-3 ml-1" /></Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newState} onChange={e => setNewState(e.target.value)} placeholder="Add state (e.g. OR)" className="bg-secondary border-border w-40" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addState())} />
                      <Button size="sm" variant="outline" onClick={addState}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Plan</Label>
                    <Badge className="bg-accent/20 text-accent capitalize">{agency?.plan || "starter"}</Badge>
                  </div>
                  <Button className="bg-primary text-primary-foreground" onClick={saveAgency} disabled={savingAgency}>
                    {savingAgency ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save Changes
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="branding" className="mt-4 space-y-4">
            <Card className="bg-card halevai-border">
              <CardHeader><CardTitle>Business Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">These settings are used by AI to generate branded content, ad copy, and landing pages.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Business Name</Label><Input value={brandForm.business_name} onChange={e => setBrandForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Care at Home LLC" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Tagline</Label><Input value={brandForm.tagline} onChange={e => setBrandForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Caring for families..." className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={brandForm.phone} onChange={e => setBrandForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={brandForm.email} onChange={e => setBrandForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Website</Label><Input value={brandForm.website_url} onChange={e => setBrandForm(f => ({ ...f, website_url: e.target.value }))} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Logo URL</Label><Input value={brandForm.logo_url} onChange={e => setBrandForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." className="bg-secondary border-border" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="color" value={brandForm.primary_color || "#00bfff"} onChange={e => setBrandForm(f => ({ ...f, primary_color: e.target.value }))} className="w-10 h-10 p-1 bg-secondary border-border" />
                      <Input value={brandForm.primary_color} onChange={e => setBrandForm(f => ({ ...f, primary_color: e.target.value }))} placeholder="#00bfff" className="bg-secondary border-border flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="color" value={brandForm.secondary_color || "#8b5cf6"} onChange={e => setBrandForm(f => ({ ...f, secondary_color: e.target.value }))} className="w-10 h-10 p-1 bg-secondary border-border" />
                      <Input value={brandForm.secondary_color} onChange={e => setBrandForm(f => ({ ...f, secondary_color: e.target.value }))} placeholder="#8b5cf6" className="bg-secondary border-border flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="color" value={brandForm.accent_color || "#10b981"} onChange={e => setBrandForm(f => ({ ...f, accent_color: e.target.value }))} className="w-10 h-10 p-1 bg-secondary border-border" />
                      <Input value={brandForm.accent_color} onChange={e => setBrandForm(f => ({ ...f, accent_color: e.target.value }))} placeholder="#10b981" className="bg-secondary border-border flex-1" />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Facebook URL</Label><Input value={brandForm.facebook_url} onChange={e => setBrandForm(f => ({ ...f, facebook_url: e.target.value }))} placeholder="https://facebook.com/..." className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Instagram URL</Label><Input value={brandForm.instagram_url} onChange={e => setBrandForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/..." className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={brandForm.linkedin_url} onChange={e => setBrandForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/..." className="bg-secondary border-border" /></div>
                </div>
                <Button className="bg-primary text-primary-foreground" onClick={saveBranding} disabled={savingBrand}>
                  {savingBrand ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save Branding
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="bg-card halevai-border">
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "New hot caregiver scored", desc: "Get notified when a lead scores 80+" },
                  { label: "Caregiver stuck >7 days", desc: "Alert when a caregiver hasn't progressed" },
                  { label: "Caregiver enrolled & active", desc: "Celebrate when a caregiver starts earning" },
                  { label: "Start of care date reached", desc: "Reminder when SOC date arrives" },
                  { label: "Competitor pay rate alert", desc: "Know when competitors change rates" },
                  { label: "Negative review received", desc: "Respond quickly to bad reviews" },
                  { label: "Daily briefing ready", desc: "Morning performance summary" },
                  { label: "Campaign auto-paused", desc: "When spend exceeds threshold" },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm text-foreground">{pref.label}</span>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;