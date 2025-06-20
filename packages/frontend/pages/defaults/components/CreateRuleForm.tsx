import { DefaultItemRule, Calculation } from '@packing-list/model';
import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { CategorySelector } from '../../../components/CategorySelector';
import { ConditionsList } from './ConditionsList';
import { ItemCalculationForm } from './ItemCalculationForm';
import { useAppDispatch } from '@packing-list/state';
import { ConfirmDialog } from '@packing-list/shared-components';
import { uuid } from '@packing-list/shared-utils';

const DEFAULT_CALCULATION: Calculation = {
  baseQuantity: 1,
  perDay: false,
  perPerson: false,
  extraItems: {
    quantity: 0,
    perDay: false,
    perPerson: false,
  },
};

export const CreateRuleForm = () => {
  const dispatch = useAppDispatch();
  const [newRule, setNewRule] = useState<DefaultItemRule>({
    id: '',
    name: '',
    calculation: DEFAULT_CALCULATION,
    categoryId: '',
    originalRuleId: '',
  });
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleCreateRule = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRule.name || !newRule.categoryId) return;

      const id = uuid();

      dispatch({
        type: 'CREATE_ITEM_RULE',
        payload: {
          ...newRule,
          id,
          originalRuleId: id,
        },
      });

      setNewRule({
        id: '',
        name: '',
        calculation: DEFAULT_CALCULATION,
        categoryId: '',
        originalRuleId: '',
      });
    },
    [dispatch, newRule]
  );

  const handleDiscard = () => {
    setNewRule({
      id: '',
      name: '',
      calculation: DEFAULT_CALCULATION,
      categoryId: '',
      originalRuleId: '',
    });
    setShowDiscardModal(false);
  };

  return (
    <div
      className="card bg-base-100 shadow-xl mb-6"
      data-testid="create-rule-form"
    >
      <form onSubmit={handleCreateRule} aria-label="Create Rule Form">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title" id="create-rule-title">
              {newRule ? 'Edit Rule' : 'Create New Rule'}
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowDiscardModal(true)}
              data-testid="create-rule-discard-button"
              aria-label="Discard changes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <label htmlFor="rule-name" className="label">
                Name
              </label>
              <input
                id="rule-name"
                type="text"
                className="input input-bordered w-full"
                value={newRule.name}
                onChange={(e) =>
                  setNewRule((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Rule name"
                data-testid="rule-name-input"
                required
                aria-required="true"
              />
            </div>
            <CategorySelector
              selectedCategoryId={newRule.categoryId}
              selectedSubcategoryId={newRule.subcategoryId}
              onCategoryChange={(categoryId, subcategoryId) =>
                setNewRule((prev) => ({ ...prev, categoryId, subcategoryId }))
              }
              testIdPrefix="create-rule-"
            />
            <div>
              <label htmlFor="rule-notes" className="label">
                Description
              </label>
              <textarea
                id="rule-notes"
                className="textarea textarea-bordered w-full"
                value={newRule.notes || ''}
                onChange={(e) =>
                  setNewRule((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notes (optional)"
                data-testid="rule-notes-input"
                aria-label="Rule description"
              />
            </div>

            <ItemCalculationForm
              calculation={newRule.calculation}
              onCalculationChange={(calculation) =>
                setNewRule((prev) => ({ ...prev, calculation }))
              }
              testIdPrefix="create-rule-"
            />

            {/* Conditions */}
            <ConditionsList
              conditions={newRule.conditions}
              onConditionsChange={(conditions) =>
                setNewRule((prev) => ({ ...prev, conditions }))
              }
              testIdPrefix="create-rule-"
            />

            {/* Actions */}
            <div className="card-body pt-2">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowDiscardModal(true)}
                  data-testid="create-rule-discard-button"
                  aria-label="Discard changes"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-testid="create-rule-save-button"
                  disabled={!newRule.name || !newRule.categoryId}
                  aria-disabled={!newRule.name || !newRule.categoryId}
                >
                  {newRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Discard Changes?"
        message="Are you sure you want to discard your changes? This cannot be undone."
        confirmText="Discard"
        cancelText="Cancel"
        confirmVariant="error"
        onConfirm={handleDiscard}
      />
    </div>
  );
};
