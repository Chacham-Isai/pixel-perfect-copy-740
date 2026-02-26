import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Shield, Loader2, Plus, Trash2, Crown, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyMembers } from "@/hooks/useAgencyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROLE_LABELS, ROLE_COLORS, hasPermission, type AgencyRole } from "@/lib/permissions";

const ASSIGNABLE_ROLES: AgencyRole[] = ["admin", "operations_manager", "intake_coordinator", "viewer"];

export default function TeamMembers() {
  const { agencyId, agencyRole, user } = useAuth();
  const { data: members, isLoading, refetch } = useAgencyMembers();
  const [updating, setUpdating] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AgencyRole>("viewer");
  const [inviting, setInviting] = useState(false);

  const canChangeRoles = hasPermission(agencyRole, "change_roles");
  const canInvite = hasPermission(agencyRole, "invite_members");
  const canManageTeam = hasPermission(agencyRole, "manage_team");

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!canChangeRoles) return;
    setUpdating(memberId);
    const { error } = await supabase
      .from("agency_members")
      .update({ role: newRole as any })
      .eq("id", memberId);
    if (error) toast.error("Failed to update role");
    else { toast.success("Role updated"); refetch(); }
    setUpdating(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!canManageTeam) return;
    const { error } = await supabase
      .from("agency_members")
      .delete()
      .eq("id", memberId);
    if (error) toast.error("Failed to remove member");
    else { toast.success("Member removed"); refetch(); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !agencyId) return;
    setInviting(true);
    // For now, show a message that invite emails require email integration
    toast.info(`Invite for ${inviteEmail} with role "${ROLE_LABELS[inviteRole]}" noted. Email invites require messaging integration to be configured.`);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("viewer");
    setInviting(false);
  };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card className="bg-card halevai-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Team Members
          </CardTitle>
          {canInvite && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="text-foreground">Invite Team Member</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="team@agency.com" className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AgencyRole)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map(r => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {inviteRole === "admin" && "Full access to all features except ownership actions."}
                      {inviteRole === "operations_manager" && "Can manage campaigns, caregivers, and automations."}
                      {inviteRole === "intake_coordinator" && "Can manage caregivers and send messages."}
                      {inviteRole === "viewer" && "Read-only access to dashboard and data."}
                    </p>
                  </div>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="w-full bg-primary text-primary-foreground">
                    {inviting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Send Invite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!canManageTeam && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> Only owners and admins can manage the team.
          </p>
        )}
        {(members || []).map((m) => {
          const isCurrentUser = m.user_id === user?.id;
          const isOwnerMember = m.role === "owner";
          const roleColor = ROLE_COLORS[m.role as AgencyRole] || ROLE_COLORS.viewer;
          return (
            <div key={m.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {isCurrentUser ? "You" : (m.user_id.slice(0, 2).toUpperCase())}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    {isCurrentUser ? "You" : m.user_id.slice(0, 8) + "..."}
                    {isOwnerMember && <Crown className="h-3 w-3 text-yellow-400" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canChangeRoles && !isCurrentUser && !isOwnerMember ? (
                  <>
                    {updating === m.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleRoleChange(m.id, v)}
                      disabled={updating === m.id}
                    >
                      <SelectTrigger className="w-36 h-8 bg-secondary border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map(r => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {canManageTeam && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>This will revoke their access to the agency. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(m.id)} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                ) : (
                  <Badge className={`${roleColor} text-xs`}>
                    {ROLE_LABELS[m.role as AgencyRole] || m.role}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        {(members || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>
        )}
      </CardContent>
    </Card>
  );
}
