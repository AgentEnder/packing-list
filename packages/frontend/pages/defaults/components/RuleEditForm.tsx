import { Condition, DefaultItemRule } from '@packing-list/model';
import { useState } from 'react';
import { ToggleGroup } from './ToggleGroup';
import { ConditionForm } from './ConditionForm';

type RuleEditFormProps = {
  rule: DefaultItemRule;
  onUpdateRule: (updates: Partial<DefaultItemRule>) => void;
  onCancel: () => void;
};

const DEFAULT_CONDITION: Condition = {
  type: 'person',
  field: 'age',
  operator: '==',
  value: 0,
};

export const RuleEditForm = ({
  rule,
  onUpdateRule,
  onCancel,
}: RuleEditFormProps) => {
  const [showCondition, setShowCondition] = useState(false);
  const [editingConditionIndex, setEditingConditionIndex] = useState<
    number | null
  >(null);
  const [editingCondition, setEditingCondition] =
    useState<Condition>(DEFAULT_CONDITION);

  const handleStartEditingCondition = (index: number, condition: Condition) => {
    setEditingConditionIndex(index);
    setEditingCondition(condition);
    setShowCondition(true);
  };

  const handleRemoveCondition = (index: number) => {
    onUpdateRule({
      conditions: rule.conditions?.filter((_, i) => i !== index),
    });
  };

  const handleCancelCondition = () => {
    setShowCondition(false);
    setEditingConditionIndex(null);
    setEditingCondition(DEFAULT_CONDITION);
  };

  return (
    <div>
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={rule.name}
          onChange={(e) => onUpdateRule({ name: e.target.value })}
        />
      </div>

      <div className="form-control w-full mt-4">
        <label className="label">
          <span className="label-text font-medium">Notes (optional)</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full h-24"
          value={rule.notes || ''}
          onChange={(e) => onUpdateRule({ notes: e.target.value })}
          placeholder="Add any helpful notes about this rule..."
        />
      </div>

      <div className="form-control w-full mt-4">
        <label className="label">
          <span className="label-text font-medium">Base Quantity</span>
        </label>
        <input
          type="number"
          className="input input-bordered w-full"
          value={rule.calculation.baseQuantity}
          onChange={(e) =>
            onUpdateRule({
              calculation: {
                ...rule.calculation,
                baseQuantity: parseInt(e.target.value) || 0,
              },
            })
          }
        />
      </div>

      <ToggleGroup
        perDay={rule.calculation.perDay || false}
        perPerson={rule.calculation.perPerson || false}
        daysPattern={rule.calculation.daysPattern}
        onPerDayChange={(checked) =>
          onUpdateRule({
            calculation: {
              ...rule.calculation,
              perDay: checked,
              daysPattern: checked ? rule.calculation.daysPattern : undefined,
            },
          })
        }
        onPerPersonChange={(checked) =>
          onUpdateRule({
            calculation: {
              ...rule.calculation,
              perPerson: checked,
            },
          })
        }
        onDaysPatternChange={(pattern) =>
          onUpdateRule({
            calculation: {
              ...rule.calculation,
              daysPattern: pattern,
            },
          })
        }
      />

      <div className="divider">Extra Items</div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Extra Quantity</span>
        </label>
        <input
          type="number"
          className="input input-bordered w-full"
          value={rule.calculation.extraItems?.quantity || 0}
          onChange={(e) =>
            onUpdateRule({
              calculation: {
                ...rule.calculation,
                extraItems: {
                  ...(rule.calculation.extraItems || {}),
                  quantity: parseInt(e.target.value) || 0,
                },
              },
            })
          }
        />
      </div>

      {rule.calculation.extraItems?.quantity ? (
        <ToggleGroup
          perDay={rule.calculation.extraItems?.perDay || false}
          perPerson={rule.calculation.extraItems?.perPerson || false}
          daysPattern={rule.calculation.extraItems?.daysPattern}
          onPerDayChange={(checked) =>
            onUpdateRule({
              calculation: {
                ...rule.calculation,
                extraItems: {
                  ...(rule.calculation.extraItems || {}),
                  quantity: rule.calculation.extraItems?.quantity || 0,
                  perDay: checked,
                  daysPattern: checked
                    ? rule.calculation.extraItems?.daysPattern
                    : undefined,
                },
              },
            })
          }
          onPerPersonChange={(checked) =>
            onUpdateRule({
              calculation: {
                ...rule.calculation,
                extraItems: {
                  ...(rule.calculation.extraItems || {}),
                  quantity: rule.calculation.extraItems?.quantity || 0,
                  perPerson: checked,
                },
              },
            })
          }
          onDaysPatternChange={(pattern) =>
            onUpdateRule({
              calculation: {
                ...rule.calculation,
                extraItems: {
                  ...(rule.calculation.extraItems || {}),
                  quantity: rule.calculation.extraItems?.quantity || 0,
                  daysPattern: pattern,
                },
              },
            })
          }
          label="Extra Items Calculation"
        />
      ) : null}

      <div className="divider">Conditions</div>

      {rule.conditions?.map((condition, index) => (
        <div
          key={index}
          className="alert flex flex-col items-stretch gap-2 mb-2"
        >
          <div className="flex items-center justify-between w-full">
            <div className="badge badge-outline gap-1">
              {condition.type === 'person' ? '👤' : '📅'} {condition.field}{' '}
              {condition.operator} {condition.value}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => handleStartEditingCondition(index, condition)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error"
                onClick={() => handleRemoveCondition(index)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {showCondition ? (
        <ConditionForm
          initialCondition={editingCondition}
          onSave={(newCondition) => {
            if (editingConditionIndex !== null) {
              onUpdateRule({
                conditions: rule.conditions?.map((c, i) =>
                  i === editingConditionIndex ? newCondition : c
                ),
              });
            } else {
              onUpdateRule({
                conditions: [...(rule.conditions || []), newCondition],
              });
            }
            handleCancelCondition();
          }}
          onCancel={handleCancelCondition}
          isEditing={editingConditionIndex !== null}
        />
      ) : (
        <button
          type="button"
          className="btn btn-outline btn-primary"
          onClick={() => setShowCondition(true)}
        >
          Add Condition
        </button>
      )}

      <div className="divider"></div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onCancel}>
          Save
        </button>
      </div>
    </div>
  );
};
