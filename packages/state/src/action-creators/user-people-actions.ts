// Action creators for Sprint 3 user people operations

import {
  CreateUserPersonInput,
  UpdateUserPersonInput,
  DeleteUserPersonInput,
  ClonePersonAsTemplateInput,
  UserPerson,
} from '@packing-list/model';

// Create User Person Template Action Creator
export const createUserPersonTemplate = (payload: CreateUserPersonInput) => ({
  type: 'CREATE_USER_PERSON_TEMPLATE' as const,
  payload,
});

// Update User Person Action Creator
export const updateUserPerson = (payload: UpdateUserPersonInput) => ({
  type: 'UPDATE_USER_PERSON' as const,
  payload,
});

// Delete User Person Action Creator
export const deleteUserPerson = (payload: DeleteUserPersonInput) => ({
  type: 'DELETE_USER_PERSON' as const,
  payload,
});

// Clone Person as Template Action Creator
export const clonePersonAsTemplate = (payload: ClonePersonAsTemplateInput) => ({
  type: 'CLONE_PERSON_AS_TEMPLATE' as const,
  payload,
});

// Load User People Action Creator
export const loadUserPeople = (payload: UserPerson[]) => ({
  type: 'LOAD_USER_PEOPLE' as const,
  payload,
});

// Set User People Loading Action Creator
export const setUserPeopleLoading = (payload: boolean) => ({
  type: 'SET_USER_PEOPLE_LOADING' as const,
  payload,
});

// Set User People Error Action Creator
export const setUserPeopleError = (payload: string | null) => ({
  type: 'SET_USER_PEOPLE_ERROR' as const,
  payload,
});

// Action types
export type CreateUserPersonTemplateAction = ReturnType<
  typeof createUserPersonTemplate
>;
export type UpdateUserPersonAction = ReturnType<typeof updateUserPerson>;
export type DeleteUserPersonAction = ReturnType<typeof deleteUserPerson>;
export type ClonePersonAsTemplateAction = ReturnType<
  typeof clonePersonAsTemplate
>;
export type LoadUserPeopleAction = ReturnType<typeof loadUserPeople>;
export type SetUserPeopleLoadingAction = ReturnType<
  typeof setUserPeopleLoading
>;
export type SetUserPeopleErrorAction = ReturnType<typeof setUserPeopleError>;

export type UserPeopleActions =
  | CreateUserPersonTemplateAction
  | UpdateUserPersonAction
  | DeleteUserPersonAction
  | ClonePersonAsTemplateAction
  | LoadUserPeopleAction
  | SetUserPeopleLoadingAction
  | SetUserPeopleErrorAction;
