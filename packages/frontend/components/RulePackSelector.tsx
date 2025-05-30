import { useAppDispatch, useAppSelector, StoreType } from '@packing-list/state';
import { RulePack } from '@packing-list/model';
import { showToast } from './Toast';
import { Check } from 'lucide-react';

interface RulePackSelectorProps {
  className?: string;
  onRulesApplied?: () => void;
}

export function RulePackSelector({
  className,
  onRulesApplied,
}: RulePackSelectorProps) {
  const dispatch = useAppDispatch();
  const rulePacks = useAppSelector((state: StoreType) => state.rulePacks);
  const currentRules = useAppSelector(
    (state: StoreType) => state.defaultItemRules
  );

  // Check if a rule pack is active by comparing rule IDs
  const isPackActive = (pack: RulePack): boolean => {
    const currentRuleIds = new Set(currentRules.map((rule) => rule.id));

    // Consider the pack active if any of its rules are present
    return pack.rules.some((rule) => currentRuleIds.has(rule.id));
  };

  const handleTogglePack = (pack: RulePack) => {
    const active = isPackActive(pack);
    dispatch({
      type: 'TOGGLE_RULE_PACK',
      pack,
      active: !active,
    });
    showToast(
      active ? `Removed "${pack.name}" rules` : `Added "${pack.name}" rules`
    );
    onRulesApplied?.();
  };

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-4">Rule Packs</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rulePacks.map((pack) => {
          const active = isPackActive(pack);
          return (
            <div
              key={pack.id}
              className={`card bg-base-100 shadow-xl ${
                active ? 'border-2 border-primary' : ''
              }`}
            >
              <div className="card-body">
                <h3 className="card-title">
                  {pack.name}
                  {active && <Check className="w-4 h-4 text-primary" />}
                </h3>
                <p className="text-base-content/70">{pack.description}</p>
                <div className="card-actions justify-end mt-4">
                  <button
                    className={`btn btn-sm ${
                      active ? 'btn-outline btn-error' : 'btn-primary'
                    }`}
                    onClick={() => handleTogglePack(pack)}
                  >
                    {active ? 'Remove' : 'Add Rules'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
