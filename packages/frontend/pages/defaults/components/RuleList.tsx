import { DefaultItemRule, Person, Day } from '@packing-list/model';
import { useCallback, useState } from 'react';
import { RuleCard } from './RuleCard';
import { RuleEditForm } from './RuleEditForm';
import { useAppDispatch } from '@packing-list/state';

type RuleListProps = {
  rules: DefaultItemRule[];
  people: Person[];
  days: Day[];
};

export const RuleList = ({ rules, people, days }: RuleListProps) => {
  const dispatch = useAppDispatch();
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const handleUpdateRule = useCallback(
    (id: string, updates: Partial<DefaultItemRule>) => {
      const existingRule = rules.find((rule) => rule.id === id);
      if (!existingRule) return;

      const mergedRule = {
        ...existingRule,
        ...updates,
        calculation: {
          ...existingRule.calculation,
          ...(updates.calculation || {}),
        },
        conditions:
          updates.conditions !== undefined
            ? updates.conditions
            : existingRule.conditions,
      };

      dispatch({
        type: 'UPDATE_ITEM_RULE',
        payload: {
          id,
          rule: mergedRule,
        },
      });
    },
    [dispatch, rules]
  );

  const handleDeleteRule = useCallback(
    (id: string) => {
      dispatch({
        type: 'DELETE_ITEM_RULE',
        payload: { id },
      });
    },
    [dispatch]
  );

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Existing Rules</h2>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="card bg-base-200">
              <div className="card-body">
                {editingRuleId === rule.id ? (
                  <RuleEditForm
                    rule={rule}
                    onUpdateRule={(updates) =>
                      handleUpdateRule(rule.id, updates)
                    }
                    onCancel={() => setEditingRuleId(null)}
                  />
                ) : (
                  <RuleCard
                    rule={rule}
                    people={people}
                    days={days}
                    onEdit={() => setEditingRuleId(rule.id)}
                    onDelete={() => handleDeleteRule(rule.id)}
                  />
                )}
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="alert">
              <span>No rules added yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
