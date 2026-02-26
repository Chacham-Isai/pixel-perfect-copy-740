import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyMembers } from "@/hooks/useAgencyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roleBadgeClass: Record<string, string> = {
  owner: "bg-primary/20 text-primary",
  admin: "bg-accent/20 text-accent",
  viewer: "bg-muted text-muted-foreground",
};

export default function TeamMembers() {
  const { agencyId, agencyRole, user } = useAuth();
  const { data: members, isLoading, refetch } = useAgencyMembers();
  const [updating, setUpdating] = useState<string | null>(null);
  const isOwner = agencyRole === "owner";

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!isOwner) return;
    setUpdating(memberId);
    const { error } = await supabase
      .from("agency_members")
      .update({ role: newRole as any })
      .eq("id", memberId);
    if (error) toast.error("Failed to update role");
    else { toast.success("Role updated"); refetch(); }
    setUpdating(null);
  };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card className="bg-card halevai-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isOwner && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> Only agency owners can manage roles.
          </p>
        )}
        {(members || []).map((m) => (
          <div key={m.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">
                {m.user_id === user?.id ? "You" : m.user_id.slice(0, 8) + "..."}
              </p>
              <p className="text-xs text-muted-foreground">
                Joined {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
              </p>
            </div>
            {isOwner && m.user_id !== user?.id ? (
              <div className="flex items-center gap-2">
                {updating === m.id && <Loader2 className="h-3 w-3 animate-spin" />}
                <Select
                  value={m.role}
                  onValueChange={(v) => handleRoleChange(m.id, v)}
                  disabled={updating === m.id}
                >
                  <SelectTrigger className="w-28 h-8 bg-secondary border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge className={roleBadgeClass[m.role] || roleBadgeClass.viewer}>
                {m.role}
              </Badge>
            )}
          </div>
        ))}
        {(members || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>
        )}
      </CardContent>
    </Card>
  );
}
