import { Person } from '@packing-list/model';
import { StoreType } from '../store.js';

export type UpdatePersonAction = {
  type: 'UPDATE_PERSON';
  payload: Person;
};

export const updatePersonHandler = (
  state: StoreType,
  action: UpdatePersonAction
) => {
  return {
    ...state,
    people: state.people.map((person) =>
      person.id === action.payload.id ? action.payload : person
    ),
  };
};
