import { useState } from 'react';
import { DefaultItemRule } from '@packing-list/model';
import { useAppSelector } from '@packing-list/state';
import { Tag, Plus, Minus } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RulePackRuleSelectorProps {
  selectedRules: DefaultItemRule[];
  onRulesChange: (rules: DefaultItemRule[]) => void;
}

export function RulePackRuleSelector({
  selectedRules,
  onRulesChange,
}: RulePackRuleSelectorProps) {
  const allRules = useAppSelector((state) => state.defaultItemRules);
  const rulePacks = useAppSelector((state) => state.rulePacks);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedRuleIds = new Set(selectedRules.map((rule) => rule.id));

  const filteredRules = allRules.filter((rule) =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleRule = (rule: DefaultItemRule) => {
    if (selectedRuleIds.has(rule.id)) {
      onRulesChange(selectedRules.filter((r) => r.id !== rule.id));
    } else {
      onRulesChange([...selectedRules, rule]);
    }
  };

  const getPackBadges = (rule: DefaultItemRule) => {
    if (!rule.packIds) return null;
    return rulePacks
      .filter((pack) => rule.packIds?.includes(pack.id))
      .map((pack) => {
        const IconComponent = pack.icon
          ? (Icons as unknown as Record<string, LucideIcon>)[pack.icon]
          : null;
        return (
          <span
            key={pack.id}
            className="badge badge-sm gap-1"
            style={{ backgroundColor: pack.color, color: 'white' }}
          >
            {IconComponent && <IconComponent className="w-3 h-3" />}
            {pack.name}
          </span>
        );
      });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Rules</label>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="rule-search-input"
          />
          <div
            className="badge badge-neutral"
            data-testid="selected-rules-count"
          >
            {selectedRules.length} selected
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {filteredRules.map((rule) => {
          const isSelected = selectedRuleIds.has(rule.id);
          const packBadges = getPackBadges(rule);
          return (
            <div
              key={rule.id}
              className={`card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer ${
                isSelected
                  ? 'border-2 border-primary'
                  : 'border border-base-300'
              }`}
              onClick={() => handleToggleRule(rule)}
              data-testid={`rule-${rule.name}`}
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{rule.name}</h3>
                    {rule.notes && (
                      <p className="text-sm text-base-content/70">
                        {rule.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rule.categoryId && (
                        <span className="badge badge-outline gap-1">
                          <Tag className="w-3 h-3" />
                          {rule.categoryId}
                        </span>
                      )}
                      {packBadges}
                    </div>
                  </div>
                  <button
                    className={`btn btn-circle btn-sm ${
                      isSelected ? 'btn-error' : 'btn-primary'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRule(rule);
                    }}
                    data-testid={`${isSelected ? 'remove' : 'add'}-rule-${
                      rule.name
                    }-button`}
                  >
                    {isSelected ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
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
