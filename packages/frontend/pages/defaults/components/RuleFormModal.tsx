import React, { useState, useCallback, useEffect } from 'react';
import { DefaultItemRule, Calculation } from '@packing-list/model';
import { Modal, ConfirmDialog } from '@packing-list/shared-components';
import { CategorySelector } from '../../../components/CategorySelector';
import { ConditionsList } from './ConditionsList';
import { ItemCalculationForm } from './ItemCalculationForm';
import { useAppDispatch } from '@packing-list/state';

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

interface RuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: DefaultItemRule; // If provided, we're editing; otherwise creating
}

export const RuleFormModal = ({
  isOpen,
  onClose,
  rule,
}: RuleFormModalProps) => {
  const dispatch = useAppDispatch();
  const isEditing = !!rule;

  const [formRule, setFormRule] = useState<DefaultItemRule>(() => ({
    id: rule?.id || '',
    name: rule?.name || '',
    calculation: rule?.calculation || DEFAULT_CALCULATION,
    categoryId: rule?.categoryId || '',
    subcategoryId: rule?.subcategoryId,
    notes: rule?.notes,
    conditions: rule?.conditions,
  }));

  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Reset form when rule prop changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormRule({
        id: rule?.id || '',
        name: rule?.name || '',
        calculation: rule?.calculation || DEFAULT_CALCULATION,
        categoryId: rule?.categoryId || '',
        subcategoryId: rule?.subcategoryId,
        notes: rule?.notes,
        conditions: rule?.conditions,
      });
    }
  }, [rule, isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formRule.name || !formRule.categoryId) return;

      if (isEditing) {
        dispatch({
          type: 'UPDATE_ITEM_RULE',
          payload: formRule,
        });
      } else {
        dispatch({
          type: 'CREATE_ITEM_RULE',
          payload: {
            ...formRule,
            id: crypto.randomUUID(),
          },
        });
      }

      onClose();
    },
    [dispatch, formRule, isEditing, onClose]
  );

  const handleDiscard = () => {
    setFormRule({
      id: '',
      name: '',
      calculation: DEFAULT_CALCULATION,
      categoryId: '',
    });
    setShowDiscardModal(false);
    onClose();
  };

  const handleClose = () => {
    // Check if form has been modified
    const hasChanges = isEditing
      ? JSON.stringify(formRule) !== JSON.stringify(rule)
      : formRule.name || formRule.categoryId || formRule.notes;

    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditing ? 'Edit Rule' : 'Create New Rule'}
        size="xl"
        modalBoxClassName="max-w-4xl"
        data-testid="rule-form-modal"
        ariaLabelledBy="rule-form-modal-title"
      >
        <form
          onSubmit={handleSubmit}
          aria-label={`${isEditing ? 'Edit' : 'Create'} Rule Form`}
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="form-control w-full">
              <label htmlFor="rule-form-name" className="label">
                <span className="label-text font-medium">Name</span>
              </label>
              <input
                id="rule-form-name"
                type="text"
                className="input input-bordered w-full"
                value={formRule.name}
                onChange={(e) =>
                  setFormRule((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Rule name"
                data-testid="rule-form-name-input"
                required
                aria-required="true"
              />
            </div>

            <CategorySelector
              selectedCategoryId={formRule.categoryId}
              selectedSubcategoryId={formRule.subcategoryId}
              onCategoryChange={(categoryId, subcategoryId) =>
                setFormRule((prev) => ({
                  ...prev,
                  categoryId,
                  subcategoryId,
                }))
              }
              testIdPrefix="rule-form-"
            />

            <div className="form-control w-full">
              <label htmlFor="rule-form-notes" className="label">
                <span className="label-text font-medium">Notes (optional)</span>
              </label>
              <textarea
                id="rule-form-notes"
                className="textarea textarea-bordered w-full h-24"
                value={formRule.notes || ''}
                onChange={(e) =>
                  setFormRule((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any helpful notes about this rule..."
                data-testid="rule-form-notes-input"
                aria-label="Rule description"
              />
            </div>

            <ItemCalculationForm
              calculation={formRule.calculation}
              onCalculationChange={(calculation) =>
                setFormRule((prev) => ({ ...prev, calculation }))
              }
              testIdPrefix="rule-form-"
            />

            <div className="divider" role="separator">
              Conditions
            </div>

            <ConditionsList
              conditions={formRule.conditions}
              onConditionsChange={(conditions) =>
                setFormRule((prev) => ({ ...prev, conditions }))
              }
              testIdPrefix="rule-form-"
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={handleClose}
              data-testid="rule-form-cancel-button"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formRule.name || !formRule.categoryId}
              data-testid="rule-form-save-button"
              aria-disabled={!formRule.name || !formRule.categoryId}
            >
              {isEditing ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>

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
        data-testid="discard-rule-modal"
      />
    </>
  );
};
