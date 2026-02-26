import { useAuth } from "@/hooks/useAuth";
import { hasPermission, type PermissionAction } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface PermissionGateProps {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showBadge?: boolean;
}

/**
 * Wraps children that require a specific permission.
 * If user lacks permission, renders fallback or nothing.
 * If showBadge is true, shows a "View Only" badge instead.
 */
export function PermissionGate({ action, children, fallback, showBadge }: PermissionGateProps) {
  const { agencyRole } = useAuth();
  const allowed = hasPermission(agencyRole, action);

  if (allowed) return <>{children}</>;

  if (showBadge) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Shield className="h-3 w-3" /> View Only
      </Badge>
    );
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Hook version for conditional logic in components.
 */
export function usePermission(action: PermissionAction): boolean {
  const { agencyRole } = useAuth();
  return hasPermission(agencyRole, action);
}
