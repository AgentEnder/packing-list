import { PackingListItem } from '@packing-list/model';
import { StoreType } from '../store.js';

export type CalculatePackingListAction = {
  type: 'CALCULATE_PACKING_LIST';
};

export const calculatePackingListHandler = (
  state: StoreType,
  _action: CalculatePackingListAction
): StoreType => {
  // Convert default items to packing list items
  const packingListItems: PackingListItem[] = state.calculated.defaultItems
    .map((item) => {
      const override = state.ruleOverrides.find(
        (o) => o.ruleId === item.ruleId
      );

      return {
        id: `${item.ruleId}-${Date.now()}`,
        name: item.name,
        count: override?.overrideCount ?? item.quantity,
        ruleId: item.ruleId,
        isPacked: false,
        isOverridden: !!override,
        applicableDays: state.trip.days.map((_, idx) => idx),
        applicablePersons: state.people.map((p) => p.id),
      };
    })
    .filter((item) => {
      const override = state.ruleOverrides.find(
        (o) => o.ruleId === item.ruleId
      );
      return !override?.isExcluded;
    });

  return {
    ...state,
    calculated: {
      ...state.calculated,
      packingListItems,
    },
  };
};
