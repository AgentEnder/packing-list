import { StoreType } from '../store.js';

export type RemovePersonAction = {
  type: 'REMOVE_PERSON';
  payload: string;
};

export const removePersonHandler = (
  state: StoreType,
  action: RemovePersonAction
) => {
  return {
    ...state,
    people: state.people.filter((person) => person.id !== action.payload),
  };
};
