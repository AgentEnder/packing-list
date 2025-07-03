import { Condition } from '@packing-list/model';
import { useState, useEffect } from 'react';
import { useAppSelector } from '@packing-list/state';
import { selectPeople } from '@packing-list/state';

type ConditionFormProps = {
  initialCondition?: Condition;
  onSave: (condition: Condition) => void;
  onCancel: () => void;
  isEditing: boolean;
  testIdPrefix?: string;
};

const DEFAULT_CONDITION: Condition = {
  type: 'person',
  field: 'age',
  operator: '==',
  value: 0,
};

// Helper function to create a name condition
const createNameCondition = (names: string[] = []): Condition => ({
  type: 'person',
  field: 'name',
  operator: 'in',
  value: names,
});

// Helper function to create age condition
const createAgeCondition = (age = 0): Condition => ({
  type: 'person',
  field: 'age',
  operator: '==',
  value: age,
});

// Helper function to create gender condition
const createGenderCondition = (gender = 'male'): Condition => ({
  type: 'person',
  field: 'gender',
  operator: '==',
  value: gender as 'male' | 'female' | 'other' | 'prefer-not-to-say',
});

// Helper function to create day condition
const createDayCondition = (
  field: 'location' | 'expectedClimate' = 'location'
): Condition => ({
  type: 'day',
  field,
  operator: '==',
  value: '',
});

export const ConditionForm = ({
  initialCondition = DEFAULT_CONDITION,
  onSave,
  onCancel,
  isEditing,
  testIdPrefix = 'create-rule-',
}: ConditionFormProps) => {
  const [condition, setCondition] = useState<Condition>(initialCondition);
  const people = useAppSelector(selectPeople);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  const operatorOptions =
    condition.type === 'person'
      ? condition.field === 'name'
        ? [{ value: 'in', label: 'includes any of' }]
        : [
            { value: '==', label: 'equals' },
            { value: '>', label: 'greater than' },
            { value: '<', label: 'less than' },
            { value: '>=', label: 'greater than or equal' },
            { value: '<=', label: 'less than or equal' },
          ]
      : [
          { value: '==', label: 'equals' },
          { value: '>=', label: 'after or on' },
          { value: '<=', label: 'before or on' },
        ];

  return (
    <div className="card bg-base-200 p-4">
      {/* <div className="card-body"> */}
      <div className="flex gap-4">
        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text font-medium">Type</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={condition.type}
            onChange={(e) => {
              const type = e.target.value as 'person' | 'day';
              if (type === 'person') {
                setCondition(createAgeCondition());
              } else {
                setCondition(createDayCondition());
              }
            }}
            data-testid={`${testIdPrefix}condition-type-select`}
          >
            <option value="person">Person</option>
            <option value="day">Day</option>
          </select>
        </div>

        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text font-medium">Field</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={condition.field}
            onChange={(e) => {
              if (condition.type === 'person') {
                const field = e.target.value as 'age' | 'gender' | 'name';
                if (field === 'gender') {
                  setCondition(createGenderCondition());
                } else if (field === 'name') {
                  setCondition(createNameCondition());
                } else {
                  setCondition(createAgeCondition());
                }
              } else {
                const field = e.target.value as 'location' | 'expectedClimate';
                setCondition(createDayCondition(field));
              }
            }}
            data-testid={`${testIdPrefix}condition-field-select`}
          >
            {condition.type === 'person' ? (
              <>
                <option value="age">Age</option>
                <option value="gender">Gender</option>
                <option value="name">Name</option>
              </>
            ) : (
              <>
                <option value="location">Location</option>
                <option value="expectedClimate">Expected Climate</option>
              </>
            )}
          </select>
        </div>

        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text font-medium">Operator</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={condition.operator}
            onChange={(e) => {
              if (condition.field === 'name') {
                return;
              }
              const newOperator = e.target.value as
                | '<'
                | '>'
                | '=='
                | '>='
                | '<=';
              setCondition({
                ...condition,
                operator: newOperator,
              });
            }}
            data-testid={`${testIdPrefix}condition-operator-select`}
            disabled={condition.field === 'name'}
          >
            {operatorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text font-medium">Value</span>
          </label>
          {condition.field === 'gender' ? (
            <select
              className="select select-bordered w-full"
              value={condition.value as string}
              onChange={(e) =>
                setCondition({
                  ...condition,
                  value: e.target.value as
                    | 'male'
                    | 'female'
                    | 'other'
                    | 'prefer-not-to-say',
                })
              }
              data-testid={`${testIdPrefix}condition-value-input`}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          ) : condition.field === 'name' ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Select people who need this item:
              </div>
              {people.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  No people added to this trip yet
                </div>
              ) : (
                <div className="space-y-1">
                  {people.map((person) => (
                    <label
                      key={person.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={(condition.value as string[]).includes(
                          person.name
                        )}
                        onChange={(e) => {
                          const currentNames = condition.value as string[];
                          const newNames = e.target.checked
                            ? [...currentNames, person.name]
                            : currentNames.filter(
                                (name) => name !== person.name
                              );
                          setCondition(createNameCondition(newNames));
                        }}
                        data-testid={`${testIdPrefix}condition-name-checkbox-${person.id}`}
                      />
                      <span className="text-sm">{person.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : condition.type === 'person' ? (
            <input
              type="number"
              className="input input-bordered w-full"
              value={condition.value as number}
              onChange={(e) =>
                setCondition({
                  ...condition,
                  value: parseInt(e.target.value) || 0,
                })
              }
              data-testid={`${testIdPrefix}condition-value-input`}
            />
          ) : (
            <input
              type="text"
              className="input input-bordered w-full"
              value={condition.value as string}
              onChange={(e) => {
                if (condition.type === 'day') {
                  setCondition({
                    ...condition,
                    value: e.target.value,
                  });
                }
              }}
              data-testid={`${testIdPrefix}condition-value-input`}
            />
          )}
        </div>
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Notes (optional)</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={condition.notes || ''}
          onChange={(e) =>
            setCondition({
              ...condition,
              notes: e.target.value,
            })
          }
          placeholder="Add a helpful note about this condition..."
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSave(condition)}
          data-testid={`${testIdPrefix}condition-save-button`}
        >
          {isEditing ? 'Update' : 'Add'} Condition
        </button>
      </div>
      {/* </div> */}
    </div>
  );
};
