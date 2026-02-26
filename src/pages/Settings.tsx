import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Building2, Key, MapPin, Users, Code, Bell, Palette } from "lucide-react";

const Settings = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="agency">
        <TabsList className="bg-secondary">
          {[
            { value: "agency", label: "Agency Profile", icon: Building2 },
            { value: "api", label: "API Keys", icon: Key },
            { value: "locations", label: "Locations", icon: MapPin },
            { value: "team", label: "Team", icon: Users },
            { value: "embed", label: "Embed", icon: Code },
            { value: "notifications", label: "Notifications", icon: Bell },
            { value: "branding", label: "Branding", icon: Palette },
          ].map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="agency" className="mt-4 space-y-4">
          <Card className="bg-card halevai-border">
            <CardHeader><CardTitle>Agency Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agency Name</Label>
                  <Input defaultValue="Care at Home" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="(503) 555-0100" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="info@careathome.com" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input defaultValue="https://careathome.com" className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Office Address</Label>
                <Input defaultValue="15405 SW 116th Ave STE 111, King City, OR 97224" className="bg-secondary border-border" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>States of Operation</Label>
                  <div className="flex gap-2">
                    <Badge className="bg-primary/20 text-primary">OR</Badge>
                    <Badge className="bg-primary/20 text-primary">MI</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Badge className="bg-accent/20 text-accent">Enterprise</Badge>
                </div>
              </div>
              <Button className="bg-primary text-primary-foreground">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4 space-y-4">
          <Card className="bg-card halevai-border">
            <CardHeader><CardTitle>API Key Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: "Anthropic Claude", key: "claudehalevai", desc: "Powers Halevai AI chat (fallback to Gemini)", connected: false },
                { name: "Clay", key: "clay_api_key", desc: "Candidate sourcing & enrichment (~$149/mo)", connected: false },
                { name: "GoHighLevel", key: "ghl_api_key", desc: "Multi-channel outreach automation (~$97/mo)", connected: false },
                { name: "Bland AI", key: "bland_api_key", desc: "AI phone screening (~$0.09/min)", connected: false },
                { name: "Twilio", key: "twilio_*", desc: "SMS messaging", connected: false },
                { name: "SendGrid", key: "sendgrid_api_key", desc: "Email messaging", connected: false },
              ].map((api) => (
                <div key={api.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{api.name}</p>
                      <p className="text-xs text-muted-foreground">{api.desc}</p>
                    </div>
                    <Badge className={api.connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {api.connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder={`Enter ${api.name} API key...`} type="password" className="bg-secondary border-border" />
                    <Button variant="outline" size="sm">Test</Button>
                    <Button size="sm" className="bg-primary text-primary-foreground">Save</Button>
                  </div>
                  <Separator className="mt-4 bg-border" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card halevai-border">
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                "New hot caregiver scored",
                "Caregiver stuck >7 days",
                "Caregiver enrolled & active",
                "Start of care date reached",
                "Competitor pay rate alert",
                "Negative review received",
                "Daily briefing ready",
              ].map((pref) => (
                <div key={pref} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{pref}</span>
                  <Switch />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </AppLayout>
);

export default Settings;
