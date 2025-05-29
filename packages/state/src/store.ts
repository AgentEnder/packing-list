import { configureStore } from '@reduxjs/toolkit';
import { Mutations } from './actions.js';
import {
  Item,
  DefaultItemRule,
  Trip,
  Person,
  ItemOverride,
} from '@packing-list/model';
import { DEMO_DATA } from './data.js';

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

// Vike's PageContext is not accurately typed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createStore(pageContext: any) {
  const preloadedState =
    DEMO_DATA ||
    ('isClient' in pageContext && pageContext.isClient
      ? pageContext.redux?.ssrState ?? initialState
      : initialState);
  return configureStore<StoreType>({
    reducer: (state = initialState, action) => {
      if (action) {
        const mutation = Mutations[action.type as keyof typeof Mutations];
        if (mutation) {
          // A naughty as-any here enables really good type safety elsewhere
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return mutation(state, action as any);
        }
      }
      return state;
    },
    preloadedState: preloadedState as StoreType,
  });
}
