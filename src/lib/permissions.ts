export type AgencyRole = "owner" | "admin" | "operations_manager" | "intake_coordinator" | "viewer";

export type PermissionAction =
  | "view_dashboard"
  | "edit_caregivers"
  | "send_messages"
  | "manage_campaigns"
  | "post_to_ads"
  | "run_automations"
  | "manage_api_keys"
  | "edit_branding"
  | "manage_team"
  | "invite_members"
  | "change_roles"
  | "delete_agency"
  | "transfer_ownership";

const PERMISSION_MATRIX: Record<PermissionAction, AgencyRole[]> = {
  view_dashboard: ["owner", "admin", "operations_manager", "intake_coordinator", "viewer"],
  edit_caregivers: ["owner", "admin", "operations_manager", "intake_coordinator"],
  send_messages: ["owner", "admin", "operations_manager", "intake_coordinator"],
  manage_campaigns: ["owner", "admin", "operations_manager"],
  post_to_ads: ["owner", "admin", "operations_manager"],
  run_automations: ["owner", "admin", "operations_manager"],
  manage_api_keys: ["owner", "admin"],
  edit_branding: ["owner", "admin"],
  manage_team: ["owner", "admin"],
  invite_members: ["owner", "admin"],
  change_roles: ["owner"],
  delete_agency: ["owner"],
  transfer_ownership: ["owner"],
};

export function hasPermission(role: string | null | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const allowed = PERMISSION_MATRIX[action];
  return allowed ? allowed.includes(role as AgencyRole) : false;
}

export function isWriteRole(role: string | null | undefined): boolean {
  return hasPermission(role, "edit_caregivers");
}

export const ROLE_LABELS: Record<AgencyRole, string> = {
  owner: "Owner",
  admin: "Admin",
  operations_manager: "Ops Manager",
  intake_coordinator: "Intake Coordinator",
  viewer: "Viewer",
};

export const ROLE_COLORS: Record<AgencyRole, string> = {
  owner: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  operations_manager: "bg-accent/20 text-accent border-accent/30",
  intake_coordinator: "bg-green-500/20 text-green-400 border-green-500/30",
  viewer: "bg-muted text-muted-foreground border-border",
};
