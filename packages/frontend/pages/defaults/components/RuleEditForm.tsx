import { DefaultItemRule } from '@packing-list/model';
import { useState } from 'react';
import { useAppDispatch } from '@packing-list/state';
import { CategorySelector } from '../../../components/CategorySelector';
import { ConditionsList } from './ConditionsList';
import { ItemCalculationForm } from './ItemCalculationForm';

type RuleEditFormProps = {
  rule: DefaultItemRule;
  onCancel: () => void;
};

export const RuleEditForm = ({
  rule: initialRule,
  onCancel,
}: RuleEditFormProps) => {
  const dispatch = useAppDispatch();
  // Local state for the rule being edited
  const [editedRule, setEditedRule] = useState<DefaultItemRule>(initialRule);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_ITEM_RULE',
      payload: editedRule,
    });
    onCancel();
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        aria-label="Edit Rule Form"
      >
        <div className="form-control w-full">
          <label htmlFor="edit-rule-name" className="label">
            <span className="label-text font-medium">Name</span>
          </label>
          <input
            id="edit-rule-name"
            type="text"
            className="input input-bordered w-full"
            value={editedRule.name}
            onChange={(e) =>
              setEditedRule((prev) => ({ ...prev, name: e.target.value }))
            }
            data-testid="edit-rule-name-input"
            required
            aria-required="true"
          />
        </div>

        <CategorySelector
          selectedCategoryId={editedRule.categoryId}
          selectedSubcategoryId={editedRule.subcategoryId}
          onCategoryChange={(categoryId, subcategoryId) =>
            setEditedRule((prev) => ({
              ...prev,
              categoryId,
              subcategoryId,
            }))
          }
          testIdPrefix="edit-rule-"
          className="mt-4"
        />

        <div className="form-control w-full mt-4">
          <label htmlFor="edit-rule-notes" className="label">
            <span className="label-text font-medium">Notes (optional)</span>
          </label>
          <textarea
            id="edit-rule-notes"
            className="textarea textarea-bordered w-full h-24"
            value={editedRule.notes || ''}
            onChange={(e) =>
              setEditedRule((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add any helpful notes about this rule..."
            data-testid="edit-rule-notes-input"
            aria-label="Rule description"
          />
        </div>

        <ItemCalculationForm
          calculation={editedRule.calculation}
          onCalculationChange={(calculation) =>
            setEditedRule((prev) => ({ ...prev, calculation }))
          }
          testIdPrefix="edit-rule-"
          className="mt-4"
        />

        <div className="divider" role="separator">
          Conditions
        </div>

        <ConditionsList
          conditions={editedRule.conditions}
          onConditionsChange={(conditions) =>
            setEditedRule((prev) => ({ ...prev, conditions }))
          }
          testIdPrefix="edit-rule-"
        />

        <div className="divider" role="separator"></div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            data-testid="edit-rule-cancel-button"
            aria-label="Cancel editing"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!editedRule.name || !editedRule.categoryId}
            data-testid="edit-rule-save-button"
            aria-disabled={!editedRule.name || !editedRule.categoryId}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
