import { StoreType } from '../store.js';

export type DeleteRulePackAction = {
  type: 'DELETE_RULE_PACK';
  payload: { id: string };
};

export const deleteRulePackHandler = (
  state: StoreType,
  action: DeleteRulePackAction
): StoreType => {
  const packToDelete = state.rulePacks.find(
    (pack) => pack.id === action.payload.id
  );

  if (!packToDelete) {
    return state; // Pack not found, nothing to delete
  }

  return {
    ...state,
    rulePacks: state.rulePacks.filter((pack) => pack.id !== action.payload.id),
  };
};
