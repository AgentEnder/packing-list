// Action handlers for user people template operations - Sprint 3

import { uuid } from '@packing-list/shared-utils';
import { StoreType } from '../store.js';
import {
  UserPerson,
  CreateUserPersonInput,
  UpdateUserPersonInput,
  DeleteUserPersonInput,
  ClonePersonAsTemplateInput,
} from '@packing-list/model';

// Create User Person Template (Sprint 3)
export function createUserPersonTemplateHandler(
  state: StoreType,
  action: {
    type: 'CREATE_USER_PERSON_TEMPLATE';
    payload: CreateUserPersonInput;
  }
): StoreType {
  console.log(
    '🆕 [CREATE_USER_PERSON_TEMPLATE] Creating template:',
    action.payload
  );

  const newTemplate: UserPerson = {
    id: uuid(),
    userId: action.payload.userId,
    name: action.payload.name,
    age: action.payload.age,
    gender: action.payload.gender,
    settings: action.payload.settings || {},
    isUserProfile: false, // Templates are never profiles
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
  };

  console.log(
    '✅ [CREATE_USER_PERSON_TEMPLATE] Created template:',
    newTemplate
  );

  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      people: [...state.userPeople.people, newTemplate],
      error: null,
    },
  };
}

// Update User Person (Profile or Template)
export function updateUserPersonHandler(
  state: StoreType,
  action: {
    type: 'UPDATE_USER_PERSON';
    payload: UpdateUserPersonInput;
  }
): StoreType {
  console.log('📝 [UPDATE_USER_PERSON] Updating person:', action.payload);

  const personIndex = state.userPeople.people.findIndex(
    (p) => p.id === action.payload.id
  );

  if (personIndex === -1) {
    console.warn(
      '⚠️ [UPDATE_USER_PERSON] Person not found:',
      action.payload.id
    );
    return {
      ...state,
      userPeople: {
        ...state.userPeople,
        error: `Person with ID ${action.payload.id} not found`,
      },
    };
  }

  const existingPerson = state.userPeople.people[personIndex];
  const updatedPerson: UserPerson = {
    ...existingPerson,
    name: action.payload.name ?? existingPerson.name,
    age: action.payload.age ?? existingPerson.age,
    gender: action.payload.gender ?? existingPerson.gender,
    settings: action.payload.settings ?? existingPerson.settings,
    updatedAt: new Date().toISOString(),
    version: existingPerson.version + 1,
  };

  const updatedPeople = [...state.userPeople.people];
  updatedPeople[personIndex] = updatedPerson;

  console.log('✅ [UPDATE_USER_PERSON] Updated person:', updatedPerson);

  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      people: updatedPeople,
      error: null,
    },
  };
}

// Delete User Person (Template only, profiles require special handling)
export function deleteUserPersonHandler(
  state: StoreType,
  action: {
    type: 'DELETE_USER_PERSON';
    payload: DeleteUserPersonInput;
  }
): StoreType {
  console.log('🗑️ [DELETE_USER_PERSON] Deleting person:', action.payload.id);

  const person = state.userPeople.people.find(
    (p) => p.id === action.payload.id
  );

  if (!person) {
    console.warn(
      '⚠️ [DELETE_USER_PERSON] Person not found:',
      action.payload.id
    );
    return {
      ...state,
      userPeople: {
        ...state.userPeople,
        error: `Person with ID ${action.payload.id} not found`,
      },
    };
  }

  if (person.isUserProfile) {
    console.warn('⚠️ [DELETE_USER_PERSON] Cannot delete user profile directly');
    return {
      ...state,
      userPeople: {
        ...state.userPeople,
        error: 'Cannot delete user profile. Use profile update instead.',
      },
    };
  }

  const updatedPeople = state.userPeople.people.filter(
    (p) => p.id !== action.payload.id
  );

  console.log('✅ [DELETE_USER_PERSON] Deleted template:', person.name);

  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      people: updatedPeople,
      error: null,
    },
  };
}

// Clone Person as Template (from trip person)
export function clonePersonAsTemplateHandler(
  state: StoreType,
  action: {
    type: 'CLONE_PERSON_AS_TEMPLATE';
    payload: ClonePersonAsTemplateInput;
  }
): StoreType {
  console.log(
    '👥 [CLONE_PERSON_AS_TEMPLATE] Cloning as template:',
    action.payload
  );

  const newTemplate: UserPerson = {
    id: uuid(),
    userId: action.payload.userId,
    name: action.payload.personData.name,
    age: action.payload.personData.age,
    gender: action.payload.personData.gender as UserPerson['gender'],
    settings: {},
    isUserProfile: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
  };

  console.log(
    '✅ [CLONE_PERSON_AS_TEMPLATE] Created template from person:',
    newTemplate
  );

  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      people: [...state.userPeople.people, newTemplate],
      error: null,
    },
  };
}

// Load User People (from sync)
export function loadUserPeopleHandler(
  state: StoreType,
  action: {
    type: 'LOAD_USER_PEOPLE';
    payload: UserPerson[];
  }
): StoreType {
  console.log(
    `👥 [LOAD_USER_PEOPLE] Loading ${action.payload.length} user people from sync`
  );

  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      people: action.payload.filter((p) => !p.isDeleted),
      hasTriedToLoad: true,
      isLoading: false,
      error: null,
    },
  };
}

// Set User People Loading State
export function setUserPeopleLoadingHandler(
  state: StoreType,
  action: {
    type: 'SET_USER_PEOPLE_LOADING';
    payload: boolean;
  }
): StoreType {
  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      isLoading: action.payload,
    },
  };
}

// Set User People Error State
export function setUserPeopleErrorHandler(
  state: StoreType,
  action: {
    type: 'SET_USER_PEOPLE_ERROR';
    payload: string | null;
  }
): StoreType {
  return {
    ...state,
    userPeople: {
      ...state.userPeople,
      error: action.payload,
      isLoading: false,
    },
  };
}
