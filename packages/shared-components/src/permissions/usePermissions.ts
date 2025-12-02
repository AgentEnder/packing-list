import { useSelector } from 'react-redux';
import { useAuth } from '@packing-list/auth-state';
import { selectSelectedTripData, type StoreType } from '@packing-list/state';
import {
  selectUserRoleInTrip,
  selectCanEditTrip,
  selectCanEditItems,
} from '@packing-list/state';

export function usePermissions() {
  const { user } = useAuth();
  const userId = user?.id || '';
  const selectedTrip = useSelector(selectSelectedTripData);

  // Get all trip permissions at once
  const selectedTripId = selectedTrip?.trip.id || '';
  const canEditSelectedTrip = useSelector((state: StoreType) =>
    selectCanEditTrip(selectedTripId, userId)(state)
  );
  const canEditSelectedItems = useSelector((state: StoreType) =>
    selectCanEditItems(selectedTripId, userId)(state)
  );
  const selectedTripRole = useSelector((state: StoreType) =>
    selectUserRoleInTrip(selectedTripId, userId)(state)
  );

  const canEditTrip = (tripId: string) => {
    if (!userId) return false;

    // Check if user owns the trip directly
    if (
      selectedTrip?.trip.id === tripId &&
      selectedTrip.trip.userId === userId
    ) {
      return true;
    }

    // For selected trip, use pre-fetched value
    if (tripId === selectedTripId) {
      return canEditSelectedTrip;
    }

    // For other trips, would need to check separately
    return false;
  };

  const canEditItems = (tripId: string) => {
    if (!userId) return false;

    // Check if user owns the trip directly
    if (
      selectedTrip?.trip.id === tripId &&
      selectedTrip.trip.userId === userId
    ) {
      return true;
    }

    // For selected trip, use pre-fetched value
    if (tripId === selectedTripId) {
      return canEditSelectedItems;
    }

    // For other trips, would need to check separately
    return false;
  };

  const canInviteUsers = (tripId: string) => {
    return canEditTrip(tripId);
  };

  const getUserRole = (tripId: string): 'owner' | 'editor' | null => {
    if (!userId) return null;

    // Check if user owns the trip directly
    if (
      selectedTrip?.trip.id === tripId &&
      selectedTrip.trip.userId === userId
    ) {
      return 'owner';
    }

    // For selected trip, use pre-fetched value
    if (tripId === selectedTripId) {
      return selectedTripRole;
    }

    // For other trips, would need to check separately
    return null;
  };

  return {
    canEditTrip,
    canEditItems,
    canInviteUsers,
    getUserRole,
  };
}
