import { RulePack, DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { ActionHandler } from '../actions.js';

export type ToggleRulePackAction = {
  type: 'TOGGLE_RULE_PACK';
  pack: RulePack;
  active: boolean;
};

export const toggleRulePackHandler: ActionHandler<ToggleRulePackAction> = (
  state: StoreType,
  action: ToggleRulePackAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];
  const packRuleIds = new Set(action.pack.rules.map((rule) => rule.id));

  // If activating, add all rules from the pack that aren't already present
  // and update their pack associations
  if (action.active) {
    const defaultItemRules = [...selectedTripData.defaultItemRules];

    // Add new rules and update pack associations for existing ones
    action.pack.rules.forEach((packRule) => {
      const existingRuleIndex = defaultItemRules.findIndex(
        (r) => r.id === packRule.id
      );

      if (existingRuleIndex === -1) {
        // Rule doesn't exist yet, add it with pack association
        defaultItemRules.push({
          ...packRule,
          packIds: [action.pack.id],
        });
      } else {
        // Rule exists, add this pack to its associations if not already present
        const existingRule = defaultItemRules[existingRuleIndex];
        const existingPackIds = existingRule.packIds || [];
        if (!existingPackIds.includes(action.pack.id)) {
          defaultItemRules[existingRuleIndex] = {
            ...existingRule,
            packIds: [...existingPackIds, action.pack.id],
          };
        }
      }
    });

    // Update state with new rules for the current trip
    const updatedTripData = {
      ...selectedTripData,
      defaultItemRules,
    };

    const stateWithNewRules = {
      ...state,
      trips: {
        ...state.trips,
        byId: {
          ...state.trips.byId,
          [selectedTripId]: updatedTripData,
        },
      },
    };

    // Then recalculate default items
    const stateWithDefaultItems = calculateDefaultItems(stateWithNewRules);

    // Finally recalculate packing list
    return calculatePackingListHandler(stateWithDefaultItems);
  } else {
    // If deactivating, remove pack association and only remove rules that have no remaining packs
    const defaultItemRules = selectedTripData.defaultItemRules.reduce<
      DefaultItemRule[]
    >((acc, rule) => {
      if (!packRuleIds.has(rule.id)) {
        // Rule was never in this pack, keep it as is
        acc.push(rule);
        return acc;
      }

      // Remove this pack from the rule's associations
      const updatedPackIds = (rule.packIds || []).filter(
        (id) => id !== action.pack.id
      );

      // Keep the rule if:
      // 1. It has remaining pack associations OR
      // 2. It was never in any pack (packIds is undefined)
      if (updatedPackIds.length > 0 || rule.packIds === undefined) {
        acc.push({
          ...rule,
          packIds: updatedPackIds.length > 0 ? updatedPackIds : undefined,
        });
      }

      return acc;
    }, []);

    // Update state with filtered rules for the current trip
    const updatedTripData = {
      ...selectedTripData,
      defaultItemRules,
    };

    const stateWithNewRules = {
      ...state,
      trips: {
        ...state.trips,
        byId: {
          ...state.trips.byId,
          [selectedTripId]: updatedTripData,
        },
      },
    };

    // Then recalculate default items
    const stateWithDefaultItems = calculateDefaultItems(stateWithNewRules);

    // Finally recalculate packing list
    return calculatePackingListHandler(stateWithDefaultItems);
  }
};
