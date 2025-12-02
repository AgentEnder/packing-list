import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { TripUser, TripInvitation } from '@packing-list/model';
// Removed unused imports for linting

interface TripUsersState {
  tripUsers: Record<string, TripUser>; // Indexed by ID
  tripMemberships: Record<string, string[]>; // tripId -> userIds
  userTrips: Record<string, string[]>; // userId -> tripIds
  pendingInvitations: TripInvitation[];
  loading: boolean;
  error: string | null;
}

const initialState: TripUsersState = {
  tripUsers: {},
  tripMemberships: {},
  userTrips: {},
  pendingInvitations: [],
  loading: false,
  error: null,
};

const tripUsersSlice = createSlice({
  name: 'tripUsers',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTripUsers: (state, action: PayloadAction<TripUser[]>) => {
      state.tripUsers = {};
      state.tripMemberships = {};
      state.userTrips = {};

      action.payload.forEach((tripUser) => {
        if (!tripUser.isDeleted) {
          state.tripUsers[tripUser.id] = tripUser;

          // Update trip memberships
          if (!state.tripMemberships[tripUser.tripId]) {
            state.tripMemberships[tripUser.tripId] = [];
          }
          if (tripUser.userId && tripUser.status === 'accepted') {
            state.tripMemberships[tripUser.tripId].push(tripUser.userId);
          }

          // Update user trips
          if (tripUser.userId && tripUser.status === 'accepted') {
            if (!state.userTrips[tripUser.userId]) {
              state.userTrips[tripUser.userId] = [];
            }
            state.userTrips[tripUser.userId].push(tripUser.tripId);
          }
        }
      });
    },
    addTripUser: (state, action: PayloadAction<TripUser>) => {
      const tripUser = action.payload;
      if (!tripUser.isDeleted) {
        state.tripUsers[tripUser.id] = tripUser;

        // Update trip memberships
        if (!state.tripMemberships[tripUser.tripId]) {
          state.tripMemberships[tripUser.tripId] = [];
        }
        if (
          tripUser.userId &&
          tripUser.status === 'accepted' &&
          !state.tripMemberships[tripUser.tripId].includes(tripUser.userId)
        ) {
          state.tripMemberships[tripUser.tripId].push(tripUser.userId);
        }

        // Update user trips
        if (tripUser.userId && tripUser.status === 'accepted') {
          if (!state.userTrips[tripUser.userId]) {
            state.userTrips[tripUser.userId] = [];
          }
          if (!state.userTrips[tripUser.userId].includes(tripUser.tripId)) {
            state.userTrips[tripUser.userId].push(tripUser.tripId);
          }
        }
      }
    },
    updateTripUser: (
      state,
      action: PayloadAction<Partial<TripUser> & { id: string }>
    ) => {
      const { id, ...updates } = action.payload;
      if (state.tripUsers[id]) {
        const oldTripUser = state.tripUsers[id];
        const newTripUser = { ...oldTripUser, ...updates };
        state.tripUsers[id] = newTripUser;

        // Update indexes if status changed
        if (oldTripUser.status !== newTripUser.status && newTripUser.userId) {
          const tripId = newTripUser.tripId;
          const userId = newTripUser.userId;

          if (newTripUser.status === 'accepted') {
            // Add to indexes
            if (!state.tripMemberships[tripId]) {
              state.tripMemberships[tripId] = [];
            }
            if (!state.tripMemberships[tripId].includes(userId)) {
              state.tripMemberships[tripId].push(userId);
            }

            if (!state.userTrips[userId]) {
              state.userTrips[userId] = [];
            }
            if (!state.userTrips[userId].includes(tripId)) {
              state.userTrips[userId].push(tripId);
            }
          } else {
            // Remove from indexes
            if (state.tripMemberships[tripId]) {
              state.tripMemberships[tripId] = state.tripMemberships[
                tripId
              ].filter((uid) => uid !== userId);
            }
            if (state.userTrips[userId]) {
              state.userTrips[userId] = state.userTrips[userId].filter(
                (tid) => tid !== tripId
              );
            }
          }
        }
      }
    },
    removeTripUser: (state, action: PayloadAction<string>) => {
      const tripUser = state.tripUsers[action.payload];
      if (tripUser) {
        delete state.tripUsers[action.payload];

        // Remove from indexes
        if (tripUser.userId && tripUser.status === 'accepted') {
          if (state.tripMemberships[tripUser.tripId]) {
            state.tripMemberships[tripUser.tripId] = state.tripMemberships[
              tripUser.tripId
            ].filter((uid) => uid !== tripUser.userId);
          }
          if (state.userTrips[tripUser.userId]) {
            state.userTrips[tripUser.userId] = state.userTrips[
              tripUser.userId
            ].filter((tid) => tid !== tripUser.tripId);
          }
        }
      }
    },
    setPendingInvitations: (state, action: PayloadAction<TripInvitation[]>) => {
      state.pendingInvitations = action.payload;
    },
    clearTripUsersState: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setTripUsers,
  addTripUser,
  updateTripUser,
  removeTripUser,
  setPendingInvitations,
  clearTripUsersState,
} = tripUsersSlice.actions;

export type TripUsersActions = ReturnType<
  (typeof tripUsersSlice.actions)[keyof typeof tripUsersSlice.actions]
>;

export type { TripUsersState };

export default tripUsersSlice.reducer;

// Selectors
export const selectTripUsers = (state: { tripUsers: TripUsersState }) =>
  state.tripUsers.tripUsers;

export const selectTripMembers =
  (tripId: string) => (state: { tripUsers: TripUsersState }) => {
    const memberIds = state.tripUsers.tripMemberships[tripId] || [];
    return memberIds
      .map((userId) =>
        Object.values(state.tripUsers.tripUsers).find(
          (tu) => tu.userId === userId && tu.tripId === tripId
        )
      )
      .filter(Boolean) as TripUser[];
  };

export const selectAllTripUsers = createSelector(
  [
    (state: { tripUsers: TripUsersState }) => state.tripUsers.tripUsers,
    (_state: { tripUsers: TripUsersState }, tripId: string) => tripId,
  ],
  (tripUsers, tripId) => {
    return Object.values(tripUsers)
      .filter((tu) => tu.tripId === tripId && !tu.isDeleted)
      .sort((a, b) => {
        // Sort by status: accepted first, then pending, then declined
        const statusOrder = { accepted: 0, pending: 1, declined: 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Sort by role: owner first, then editor
        const roleOrder = { owner: 0, editor: 1 };
        return roleOrder[a.role] - roleOrder[b.role];
      });
  }
);

export const selectUserTrips =
  (userId: string) => (state: { tripUsers: TripUsersState }) =>
    state.tripUsers.userTrips[userId] || [];

export const selectPendingInvitations = (state: {
  tripUsers: TripUsersState;
}) => state.tripUsers.pendingInvitations;

export const selectUserRoleInTrip =
  (tripId: string, userId: string) =>
  (state: { tripUsers: TripUsersState }) => {
    const tripUser = Object.values(state.tripUsers.tripUsers).find(
      (tu) =>
        tu.tripId === tripId && tu.userId === userId && tu.status === 'accepted'
    );
    return tripUser?.role || null;
  };

export const selectCanEditTrip =
  (tripId: string, userId: string) =>
  (state: { tripUsers: TripUsersState }) => {
    const role = selectUserRoleInTrip(tripId, userId)(state);
    return role === 'owner';
  };

export const selectCanEditItems =
  (tripId: string, userId: string) =>
  (state: { tripUsers: TripUsersState }) => {
    const role = selectUserRoleInTrip(tripId, userId)(state);
    return role === 'owner' || role === 'editor';
  };
