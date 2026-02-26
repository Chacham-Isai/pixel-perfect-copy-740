import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Building2, Key, MapPin, Users, Code, Bell, Palette } from "lucide-react";
import { useAgency } from "@/hooks/useAgencyData";
import { Skeleton } from "@/components/ui/skeleton";

const Settings = () => {
  const { data: agency, isLoading } = useAgency();

  return (
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
              { value: "notifications", label: "Notifications", icon: Bell },
            ].map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="agency" className="mt-4 space-y-4">
            {isLoading ? <Skeleton className="h-48" /> : (
              <Card className="bg-card halevai-border">
                <CardHeader><CardTitle>Agency Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Agency Name</Label>
                      <Input defaultValue={agency?.name || ""} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue={agency?.phone || ""} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input defaultValue={agency?.email || ""} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input defaultValue={agency?.website_url || ""} className="bg-secondary border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Office Address</Label>
                    <Input defaultValue={agency?.office_address || ""} className="bg-secondary border-border" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>States of Operation</Label>
                      <div className="flex gap-2">
                        {(agency?.states || []).map((st) => (
                          <Badge key={st} className="bg-primary/20 text-primary">{st}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Badge className="bg-accent/20 text-accent capitalize">{agency?.plan || "starter"}</Badge>
                    </div>
                  </div>
                  <Button className="bg-primary text-primary-foreground">Save Changes</Button>
                </CardContent>
              </Card>
            )}
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
};

export default Settings;
