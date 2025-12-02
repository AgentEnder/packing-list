import { type ReactNode } from 'react';
import { usePermissions } from './usePermissions';

interface PermissionGuardProps {
  tripId: string;
  requiredRole?: 'owner' | 'editor';
  requireEdit?: boolean;
  requireOwner?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  tripId,
  requiredRole,
  requireEdit,
  requireOwner,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { canEditTrip, canEditItems, getUserRole } = usePermissions();

  // Check specific role requirement
  if (requiredRole) {
    const userRole = getUserRole(tripId);
    if (!userRole || (requiredRole === 'owner' && userRole !== 'owner')) {
      return <>{fallback}</>;
    }
  }

  // Check owner requirement
  if (requireOwner && !canEditTrip(tripId)) {
    return <>{fallback}</>;
  }

  // Check edit requirement (owner or editor)
  if (requireEdit && !canEditItems(tripId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
