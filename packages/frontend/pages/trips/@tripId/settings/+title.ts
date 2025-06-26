import { PageContext } from 'vike/types';
import { Store } from '@reduxjs/toolkit';
import { StoreType } from '@packing-list/state';

export function title(pg: PageContext) {
  const store: Store<StoreType> = pg.store;
  const tripId = pg.routeParams.tripId as string;
  const trip = store.getState().trips.byId[tripId];
  return `Trip Settings - ${trip?.trip.title}`;
}
