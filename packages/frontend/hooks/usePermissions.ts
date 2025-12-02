import { useAppSelector } from '@packing-list/state';
import { useAuth } from '@packing-list/shared-components';

export function usePermissions(tripId?: string) {
  const { user } = useAuth();
  const tripUsers = useAppSelector((state) => state.tripUsers.tripUsers);
  const trip = useAppSelector((state) =>
    tripId ? state.trips.byId[tripId] : null
  );

  // If no tripId provided, return base permissions
  if (!tripId || !trip) {
    console.log('[usePermissions] No tripId provided or trip not found');
    return {
      canView: false,
      canEdit: false,
      canManageMembers: false,
      isOwner: false,
      role: null as 'owner' | 'editor' | null,
    };
  }

  // Check if user is the trip owner
  const isOwner = trip.trip.userId === user?.id;

  // Find user's role in trip_users
  const userTripRecord = Object.values(tripUsers).find(
    (tu) => tu.tripId === tripId && tu.userId === user?.id && !tu.isDeleted
  );

  console.log('[usePermissions] User trip record:', userTripRecord);

  const role = isOwner ? 'owner' : userTripRecord?.role || null;
  const permissions = {
    canView: isOwner || !!userTripRecord,
    canEdit: isOwner || userTripRecord?.role === 'editor',
    canManageMembers: isOwner,
    isOwner,
    role,
  };

  console.log('[usePermissions] Permissions:', permissions);
  return permissions;
}
