import { Person } from '@packing-list/model';
import { useState } from 'react';
import { PersonCard } from './PersonCard';
import { PersonFormEnhanced } from './PersonFormEnhanced';
import { useAppDispatch } from '@packing-list/state';

export type PersonListProps = {
  people: Person[];
};

export const PersonList = ({ people }: PersonListProps) => {
  const dispatch = useAppDispatch();
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_PERSON', payload: { id } });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {people.length === 0 && !isAdding && (
        <div className="text-gray-500 col-span-full">No people added yet.</div>
      )}
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          onDelete={() => handleDelete(person.id)}
        />
      ))}
      {isAdding ? (
        <PersonFormEnhanced onCancel={() => setIsAdding(false)} />
      ) : (
        <button
          className="card bg-base-200 shadow-xl flex flex-col items-center justify-center border-2 border-dashed border-primary cursor-pointer min-h-[280px] hover:bg-primary hover:text-white transition col-span-1"
          onClick={() => setIsAdding(true)}
          type="button"
          aria-label="Add person"
          data-testid="add-person-button"
        >
          <span className="text-5xl mb-2">+</span>
          <span className="font-semibold">Add Person</span>
        </button>
      )}
    </div>
  );
};
