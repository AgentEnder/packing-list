import { Condition } from '@packing-list/model';
import { Plus, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { ConditionForm } from './ConditionForm';

interface ConditionsListProps {
  conditions?: Condition[];
  onConditionsChange: (conditions: Condition[]) => void;
  testIdPrefix?: string;
}

const DEFAULT_CONDITION: Condition = {
  type: 'person',
  field: 'age',
  operator: '==',
  value: 0,
};

export const ConditionsList = ({
  conditions = [],
  onConditionsChange,
  testIdPrefix = '',
}: ConditionsListProps) => {
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
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  const handleCancelCondition = () => {
    setShowCondition(false);
    setEditingConditionIndex(null);
    setEditingCondition(DEFAULT_CONDITION);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Conditions</label>
        {!showCondition && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCondition(true)}
            data-testid={`${testIdPrefix}add-condition-button`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </button>
        )}
      </div>

      <div className="space-y-2">
        {conditions?.map((condition, index) => (
          <div
            key={index}
            className="alert flex flex-col items-stretch gap-2"
            data-testid={`${testIdPrefix}condition-${index}`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`badge badge-outline gap-1 ${
                  condition.notes ? 'tooltip tooltip-right' : ''
                }`}
                data-tip={condition.notes}
              >
                {condition.type === 'person' ? '👤' : '📅'} {condition.field}{' '}
                {condition.operator} {condition.value}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleStartEditingCondition(index, condition)}
                  data-testid={`${testIdPrefix}edit-condition-${index}-button`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => handleRemoveCondition(index)}
                  data-testid={`${testIdPrefix}remove-condition-${index}-button`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCondition && (
        <ConditionForm
          initialCondition={editingCondition}
          onSave={(newCondition) => {
            if (editingConditionIndex !== null) {
              onConditionsChange(
                conditions.map((c, i) =>
                  i === editingConditionIndex ? newCondition : c
                )
              );
            } else {
              onConditionsChange([...conditions, newCondition]);
            }
            handleCancelCondition();
          }}
          onCancel={handleCancelCondition}
          isEditing={editingConditionIndex !== null}
          testIdPrefix={testIdPrefix}
        />
      )}
    </div>
  );
};
