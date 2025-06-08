import type { StoreType, TripData } from '../store.js';
import { createEmptyTripData } from '../store.js';
import type { TripSummary } from '@packing-list/model';

// Action types
export interface CreateTripAction {
  type: 'CREATE_TRIP';
  payload: {
    tripId: string;
    title: string;
    description?: string;
  };
}

export interface SelectTripAction {
  type: 'SELECT_TRIP';
  payload: {
    tripId: string;
  };
}

export interface ToggleTripSelectorAction {
  type: 'TOGGLE_TRIP_SELECTOR';
}

export interface DeleteTripAction {
  type: 'DELETE_TRIP';
  payload: {
    tripId: string;
  };
}

export interface LoadTripsAction {
  type: 'LOAD_TRIPS';
  payload: {
    trips: TripSummary[];
  };
}

export interface LoadTripDataAction {
  type: 'LOAD_TRIP_DATA';
  payload: {
    tripId: string;
    tripData: TripData;
  };
}

export interface OpenTripSelectorAction {
  type: 'OPEN_TRIP_SELECTOR';
}

export interface CloseTripSelectorAction {
  type: 'CLOSE_TRIP_SELECTOR';
}

// Action handlers
export function createTripHandler(
  state: StoreType,
  action: CreateTripAction
): StoreType {
  const { tripId, title, description } = action.payload;

  // Create new trip summary
  const newTripSummary: TripSummary = {
    tripId,
    title,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalItems: 0,
    packedItems: 0,
    totalPeople: 0,
  };

  // Create empty trip data
  const newTripData: TripData = {
    ...createEmptyTripData(tripId),
    trip: {
      id: tripId,
      days: [],
    },
  };

  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: [...state.trips.summaries, newTripSummary],
      selectedTripId: tripId, // Auto-select new trip
      byId: {
        ...state.trips.byId,
        [tripId]: newTripData,
      },
    },
  };
}

export function selectTripHandler(
  state: StoreType,
  action: SelectTripAction
): StoreType {
  const { tripId } = action.payload;

  return {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: tripId,
    },
    ui: {
      ...state.ui,
      tripSelector: {
        ...state.ui.tripSelector,
        isOpen: false, // Close selector when trip is selected
      },
    },
  };
}

export function toggleTripSelectorHandler(
  state: StoreType,
  action: ToggleTripSelectorAction
): StoreType {
  void action; // Explicitly void unused parameter
  return {
    ...state,
    ui: {
      ...state.ui,
      tripSelector: {
        ...state.ui.tripSelector,
        isOpen: !state.ui.tripSelector.isOpen,
      },
    },
  };
}

export function deleteTripHandler(
  state: StoreType,
  action: DeleteTripAction
): StoreType {
  const { tripId } = action.payload;
  // Create a copy without the deleted trip
  const remainingTrips = { ...state.trips.byId };
  delete remainingTrips[tripId];

  const updatedSummaries = state.trips.summaries.filter(
    (trip) => trip.tripId !== tripId
  );

  // If we're deleting the selected trip, select another or none
  const newSelectedTripId =
    state.trips.selectedTripId === tripId
      ? updatedSummaries[0]?.tripId || null
      : state.trips.selectedTripId;

  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: updatedSummaries,
      selectedTripId: newSelectedTripId,
      byId: remainingTrips,
    },
  };
}

export function loadTripsHandler(
  state: StoreType,
  action: LoadTripsAction
): StoreType {
  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: action.payload.trips,
    },
  };
}

export function loadTripDataHandler(
  state: StoreType,
  action: LoadTripDataAction
): StoreType {
  const { tripId, tripData } = action.payload;

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [tripId]: tripData,
      },
    },
  };
}

export function openTripSelectorHandler(
  state: StoreType,
  action: OpenTripSelectorAction
): StoreType {
  void action; // Explicitly void unused parameter
  return {
    ...state,
    ui: {
      ...state.ui,
      tripSelector: {
        ...state.ui.tripSelector,
        isOpen: true,
      },
    },
  };
}

export function closeTripSelectorHandler(
  state: StoreType,
  action: CloseTripSelectorAction
): StoreType {
  void action; // Explicitly void unused parameter
  return {
    ...state,
    ui: {
      ...state.ui,
      tripSelector: {
        ...state.ui.tripSelector,
        isOpen: false,
      },
    },
  };
}
