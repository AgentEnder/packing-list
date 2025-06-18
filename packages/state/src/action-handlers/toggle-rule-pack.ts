import {
  DefaultItemRule,
  RulePack,
  PackRuleRef,
  TripRule,
} from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { ActionHandler } from '../actions.js';
import { uuid } from '@packing-list/shared-utils';

export type ToggleRulePackAction = {
  type: 'TOGGLE_RULE_PACK';
  pack: RulePack;
  active: boolean;
};

// Helper function to create pack reference
function createPackReference(packId: string, ruleId: string): PackRuleRef {
  return { packId, ruleId };
}

export const toggleRulePackHandler: ActionHandler<ToggleRulePackAction> = (
  state: StoreType,
  action: ToggleRulePackAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;
  const userId = state.auth.user?.id;

  // Early return if no trip is selected or no user
  if (!selectedTripId || !state.trips.byId[selectedTripId] || !userId) {
    console.warn(
      'Cannot toggle rule pack: no trip selected or no user authenticated'
    );
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];
  const { pack, active } = action;

  if (active) {
    // Activating rule pack - add pack associations to existing rules or create new instances
    const defaultItemRules = [...selectedTripData.trip.defaultItemRules];
    const newRuleIds: string[] = [];

    // Process each rule in the pack
    for (const packRule of pack.rules) {
      // Look for existing rule with same original ID
      const existingRuleIndex = defaultItemRules.findIndex(
        (rule) => rule.originalRuleId === packRule.id || rule.id === packRule.id
      );

      if (existingRuleIndex >= 0) {
        // Rule already exists, add pack association
        const existingRule = defaultItemRules[existingRuleIndex];
        const existingPackRefs = existingRule.packIds || [];
        const hasPackRef = existingPackRefs.some(
          (ref) => ref.packId === pack.id && ref.ruleId === packRule.id
        );

        if (!hasPackRef) {
          const newPackRef = createPackReference(pack.id, packRule.id);
          defaultItemRules[existingRuleIndex] = {
            ...existingRule,
            packIds: [...existingPackRefs, newPackRef],
          };

          // Save updated rule to storage
          // rule updated
        }
      } else {
        // Create new user instance of the rule
        const packRef = createPackReference(pack.id, packRule.id);
        const userRuleInstance: DefaultItemRule = {
          ...packRule,
          id: uuid(), // New unique ID for user instance
          originalRuleId: packRule.id, // Track original source
          packIds: [packRef],
        };
        defaultItemRules.push(userRuleInstance);
        newRuleIds.push(userRuleInstance.id);

        // Save new rule to storage
        // rule created
      }
    }

    // Save trip rule associations for new rules
    const now = new Date().toISOString();
    for (const ruleId of newRuleIds) {
      const tripRule: TripRule = {
        id: `${selectedTripId}-${ruleId}`,
        tripId: selectedTripId,
        ruleId,
        createdAt: now,
        updatedAt: now,
        version: 1,
        isDeleted: false,
      };
    }

    // Update the state with new rules
    const updatedState = {
      ...state,
      trips: {
        ...state.trips,
        byId: {
          ...state.trips.byId,
          [selectedTripId]: {
            ...selectedTripData,
            trip: {
              ...selectedTripData.trip,
              defaultItemRules,
            },
          },
        },
      },
    };

    // Recalculate items and packing list
    const stateWithItems = calculateDefaultItems(updatedState);
    return calculatePackingListHandler(stateWithItems);
  } else {
    // Deactivating rule pack - remove pack associations or rules
    const removedRuleIds: string[] = [];
    const defaultItemRules = selectedTripData.trip.defaultItemRules.reduce(
      (result, rule) => {
        if (!rule.packIds || rule.packIds?.length === 0) {
          // Rule never belonged to this pack
          result.push(rule);
          return result;
        }

        const updatedPackIds = rule.packIds.filter(
          (ref) => ref.packId !== pack.id
        );

        if (updatedPackIds.length === 0) {
          // Rule only belonged to this pack, remove it entirely
          removedRuleIds.push(rule.id);
          return result;
        }

        // Rule belongs to other packs too, just remove this pack association
        const updatedRule = { ...rule, packIds: updatedPackIds };
        result.push(updatedRule);

        // Save updated rule to storage
        // updated rule after removing pack association
        return result;
      },
      [] as typeof selectedTripData.trip.defaultItemRules
    );

    // Remove trip rule associations for removed rules
    for (const ruleId of removedRuleIds) {
      // trip rule association removed
    }

    // Update the state with modified rules
    const updatedState = {
      ...state,
      trips: {
        ...state.trips,
        byId: {
          ...state.trips.byId,
          [selectedTripId]: {
            ...selectedTripData,
            trip: {
              ...selectedTripData.trip,
              defaultItemRules,
            },
          },
        },
      },
    };

    // Recalculate items and packing list
    const stateWithItems = calculateDefaultItems(updatedState);
    return calculatePackingListHandler(stateWithItems);
  }
};
