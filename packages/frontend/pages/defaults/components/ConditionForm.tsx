import { Condition } from '@packing-list/model';
import { useState, useEffect } from 'react';

type ConditionFormProps = {
  initialCondition?: Condition;
  onSave: (condition: Condition) => void;
  onCancel: () => void;
  isEditing: boolean;
};

const DEFAULT_CONDITION: Condition = {
  type: 'person',
  field: 'age',
  operator: '==',
  value: 0,
};

export const ConditionForm = ({
  initialCondition = DEFAULT_CONDITION,
  onSave,
  onCancel,
  isEditing,
}: ConditionFormProps) => {
  const [condition, setCondition] = useState<Condition>(initialCondition);

  useEffect(() => {
    setCondition(initialCondition);
  }, [initialCondition]);

  const operatorOptions =
    condition.type === 'person'
      ? [
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
    <div className="card bg-base-300">
      <div className="card-body">
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
                  setCondition({
                    type: 'person',
                    field: 'age',
                    operator: '==',
                    value: 0,
                  });
                } else {
                  setCondition({
                    type: 'day',
                    field: 'location',
                    operator: '==',
                    value: '',
                  });
                }
              }}
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
                  const field = e.target.value as 'age' | 'gender';
                  setCondition({
                    ...condition,
                    field,
                    value: field === 'gender' ? 'male' : 0,
                  });
                } else {
                  const field = e.target.value as
                    | 'location'
                    | 'expectedClimate';
                  setCondition({
                    ...condition,
                    field,
                    value: '',
                  });
                }
              }}
            >
              {condition.type === 'person' ? (
                <>
                  <option value="age">Age</option>
                  <option value="gender">Gender</option>
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
                setCondition({
                  ...condition,
                  operator: e.target.value as '<' | '>' | '==' | '>=' | '<=',
                });
              }}
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
                    value: e.target.value,
                  })
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
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
              />
            ) : (
              <input
                type="text"
                className="input input-bordered w-full"
                value={condition.value as string}
                onChange={(e) =>
                  setCondition({
                    ...condition,
                    value: e.target.value,
                  })
                }
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
          >
            {isEditing ? 'Update' : 'Add'} Condition
          </button>
        </div>
      </div>
    </div>
  );
};
