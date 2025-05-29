import { DefaultItemRule, Calculation, Condition } from '@packing-list/model';
import { useState, useCallback, MouseEvent } from 'react';
import { useDispatch } from 'react-redux';
import { ToggleGroup } from './ToggleGroup';
import { ConditionForm } from './ConditionForm';

const DEFAULT_CALCULATION: Calculation = {
  baseQuantity: 1,
  perDay: true,
  perPerson: false,
  extraItems: {
    quantity: 0,
    perDay: false,
    perPerson: false,
  },
};

export const CreateRuleForm = () => {
  const dispatch = useDispatch();
  const [newRule, setNewRule] = useState<DefaultItemRule>({
    id: crypto.randomUUID(),
    name: '',
    calculation: DEFAULT_CALCULATION,
    conditions: [],
  });
  const [showCondition, setShowCondition] = useState(false);
  const [editingConditionIndex, setEditingConditionIndex] = useState<
    number | null
  >(null);
  const [condition, setCondition] = useState<Condition>({
    type: 'person',
    field: 'age',
    operator: '==',
    value: 0,
  });

  const handleCreateRule = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRule.name) return;

      dispatch({
        type: 'CREATE_ITEM_RULE',
        payload: {
          ...newRule,
          id: crypto.randomUUID(),
        } as DefaultItemRule,
      });
      setNewRule({
        id: '',
        name: '',
        calculation: DEFAULT_CALCULATION,
        conditions: [],
      });
    },
    [dispatch, newRule]
  );

  const handleAddCondition = useCallback(() => {
    if (!condition.value) return;

    setNewRule((prev) => ({
      ...prev,
      conditions:
        editingConditionIndex !== null
          ? prev.conditions?.map((c, i) =>
              i === editingConditionIndex ? condition : c
            )
          : [...(prev.conditions || []), condition],
    }));
    setShowCondition(false);
    setEditingConditionIndex(null);
    setCondition({
      type: 'person',
      field: 'age',
      operator: '==',
      value: 0,
    });
  }, [condition, editingConditionIndex]);

  const handleStartEditingCondition = useCallback(
    (index: number, condition: Condition) => {
      setEditingConditionIndex(index);
      setCondition(condition);
      setShowCondition(true);
    },
    []
  );

  const handleCancelCondition = useCallback(() => {
    setShowCondition(false);
    setEditingConditionIndex(null);
    setCondition({
      type: 'person',
      field: 'age',
      operator: '==',
      value: 0,
    });
  }, []);

  const handleRemoveCondition = useCallback((index: number) => {
    setNewRule((prev) => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index),
    }));
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title">Add New Rule</h2>
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Item Name</span>
            </label>
            <input
              type="text"
              value={newRule.name}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, name: e.target.value }))
              }
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes (optional)</span>
            </label>
            <textarea
              value={newRule.notes || ''}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="textarea textarea-bordered w-full h-24"
              placeholder="Add any helpful notes about this rule..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Base Quantity</span>
              </label>
              <input
                type="number"
                value={newRule.calculation?.baseQuantity}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    calculation: {
                      ...prev.calculation!,
                      baseQuantity: parseFloat(e.target.value),
                    },
                  }))
                }
                step="0.1"
                min="0.1"
                className="input input-bordered w-full"
                required
              />
              <div className="mt-4">
                <ToggleGroup
                  perDay={newRule.calculation?.perDay ?? false}
                  perPerson={newRule.calculation?.perPerson ?? false}
                  daysPattern={newRule.calculation?.daysPattern}
                  onPerDayChange={(checked) =>
                    setNewRule((prev) => ({
                      ...prev,
                      calculation: {
                        ...prev.calculation!,
                        perDay: checked,
                        daysPattern: checked
                          ? prev.calculation?.daysPattern
                          : undefined,
                      },
                    }))
                  }
                  onPerPersonChange={(checked) =>
                    setNewRule((prev) => ({
                      ...prev,
                      calculation: {
                        ...prev.calculation!,
                        perPerson: checked,
                      },
                    }))
                  }
                  onDaysPatternChange={(pattern) =>
                    setNewRule((prev) => ({
                      ...prev,
                      calculation: {
                        ...prev.calculation!,
                        daysPattern: pattern,
                      },
                    }))
                  }
                  label="Base Quantity Settings"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Extra Items</span>
              </label>
              <input
                type="number"
                value={newRule.calculation?.extraItems?.quantity ?? 0}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    calculation: {
                      ...prev.calculation!,
                      extraItems: {
                        ...(prev.calculation?.extraItems ?? {}),
                        quantity: parseFloat(e.target.value),
                      },
                    },
                  }))
                }
                min="0"
                className="input input-bordered w-full"
              />
              <div className="mt-4">
                {newRule.calculation?.extraItems?.quantity ? (
                  <ToggleGroup
                    perDay={newRule.calculation?.extraItems?.perDay ?? false}
                    perPerson={
                      newRule.calculation?.extraItems?.perPerson ?? false
                    }
                    daysPattern={newRule.calculation?.extraItems?.daysPattern}
                    onPerDayChange={(checked) =>
                      setNewRule((prev) => ({
                        ...prev,
                        calculation: {
                          ...prev.calculation!,
                          extraItems: {
                            ...(prev.calculation?.extraItems ?? {}),
                            quantity:
                              prev.calculation?.extraItems?.quantity || 0,
                            perDay: checked,
                            daysPattern: checked
                              ? prev.calculation?.extraItems?.daysPattern
                              : undefined,
                          },
                        },
                      }))
                    }
                    onPerPersonChange={(checked) =>
                      setNewRule((prev) => ({
                        ...prev,
                        calculation: {
                          ...prev.calculation!,
                          extraItems: {
                            ...(prev.calculation?.extraItems ?? {}),
                            quantity:
                              prev.calculation?.extraItems?.quantity || 0,
                            perPerson: checked,
                          },
                        },
                      }))
                    }
                    onDaysPatternChange={(pattern) =>
                      setNewRule((prev) => ({
                        ...prev,
                        calculation: {
                          ...prev.calculation!,
                          extraItems: {
                            ...(prev.calculation?.extraItems ?? {}),
                            quantity:
                              prev.calculation?.extraItems?.quantity || 0,
                            daysPattern: pattern,
                          },
                        },
                      }))
                    }
                    label="Extra Items Settings"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="divider">Conditions</div>

          {/* Existing conditions */}
          {newRule.conditions && newRule.conditions.length > 0 && (
            <div className="space-y-2">
              {newRule.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="alert flex flex-col items-stretch gap-2 mb-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="badge badge-outline gap-1">
                      {condition.type === 'person' ? '👤' : '📅'}{' '}
                      {condition.field} {condition.operator} {condition.value}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() =>
                          handleStartEditingCondition(index, condition)
                        }
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
                  {condition.notes && (
                    <div className="text-xs text-base-content/70 ml-1">
                      {condition.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add condition form */}
          {showCondition ? (
            <ConditionForm
              initialCondition={condition}
              onSave={(newCondition) => {
                if (editingConditionIndex !== null) {
                  setNewRule((prev) => ({
                    ...prev,
                    conditions: prev.conditions?.map((c, i) =>
                      i === editingConditionIndex ? newCondition : c
                    ),
                  }));
                } else {
                  setNewRule((prev) => ({
                    ...prev,
                    conditions: [...(prev.conditions || []), newCondition],
                  }));
                }
                setShowCondition(false);
                setEditingConditionIndex(null);
                setCondition({
                  type: 'person',
                  field: 'age',
                  operator: '==',
                  value: 0,
                });
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

          <div className="card-actions justify-end">
            <button type="submit" className="btn btn-primary">
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
