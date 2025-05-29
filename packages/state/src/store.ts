import { configureStore } from '@reduxjs/toolkit';
import { Mutations, AllActions } from './actions.js';
import {
  Item,
  DefaultItemRule,
  Trip,
  Person,
  ItemOverride,
} from '@packing-list/model';
import { RuleEditingState } from './rule-editing/types.js';
import { DEMO_DATA } from './data.js';
import ruleEditingReducer from './rule-editing/slice.js';

export type StoreType = {
  people: Person[];
  itemOverrides: ItemOverride[];
  defaultItemRules: DefaultItemRule[];
  trip: Trip;
  calculated: {
    defaultItems: Item[];
  };
  ruleEditing: RuleEditingState;
};

export const initialState: StoreType = DEMO_DATA || {
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
  ruleEditing: {
    editingRuleId: null,
    editingConditions: {},
    editingConditionIndex: {},
  },
};

type ActionType = keyof typeof Mutations;

const createReducer = <T>(
  key: keyof StoreType,
  initialValue: T
): ((state: T | undefined, action: { type: string }) => T) => {
  return (state = initialValue, action) => {
    const mutation = Mutations[action.type as ActionType];
    if (mutation) {
      const fullState = { ...initialState, [key]: state };
      const result = mutation(fullState, action as any);
      return result[key] as T;
    }
    return state;
  };
};

export function createStore(pageContext: any) {
  const preloadedState =
    DEMO_DATA ||
    ('isClient' in pageContext && pageContext.isClient
      ? pageContext.redux?.ssrState ?? initialState
      : initialState);

  return configureStore({
    reducer: {
      defaultItemRules: createReducer(
        'defaultItemRules',
        preloadedState.defaultItemRules
      ),
      ruleEditing: ruleEditingReducer,
      people: createReducer('people', preloadedState.people),
      itemOverrides: createReducer(
        'itemOverrides',
        preloadedState.itemOverrides
      ),
      trip: createReducer('trip', preloadedState.trip),
      calculated: createReducer('calculated', preloadedState.calculated),
    },
  });
}
