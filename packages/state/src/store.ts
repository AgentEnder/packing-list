import { configureStore } from '@reduxjs/toolkit';
import { Mutations } from './actions.js';
import {
  Item,
  DefaultItemRule,
  Trip,
  Person,
  ItemOverride,
} from '@packing-list/model';

export type StoreType = {
  people: Person[];
  itemOverrides: ItemOverride[];
  defaultItemRules: DefaultItemRule[];
  trip: Trip;
  calculated: {
    defaultItems: Item[];
  };
};

export const initialState: StoreType = {
  people: [],
  itemOverrides: [],
  defaultItemRules: [],
  trip: {
    days: [],
    tripEvents: [],
  },
  calculated: {
    defaultItems: [],
  },
};

export function createStore(pageContext: any) {
  const preloadedState =
    'isClient' in pageContext && pageContext.isClient
      ? pageContext.redux?.ssrState ?? initialState
      : initialState;
  return configureStore<StoreType>({
    reducer: (state = initialState, action) => {
      if (action) {
        const mutation = Mutations[action.type as keyof typeof Mutations];
        if (mutation) {
          return mutation(state, action as any);
        }
      }
      return state;
    },
    preloadedState: preloadedState as StoreType,
  });
}
