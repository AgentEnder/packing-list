import { Person } from '@packing-list/model';
import { StoreType } from '../store.js';

export type AddPersonAction = {
  type: 'ADD_PERSON';
  payload: Person;
};

export const addPersonHandler = (state: StoreType, action: AddPersonAction) => {
  return {
    ...state,
    people: [...state.people, action.payload],
  };
};
