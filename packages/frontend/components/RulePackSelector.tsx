import {
  useAppDispatch,
  useAppSelector,
  selectDefaultItemRules,
} from '@packing-list/state';
import { RulePack } from '@packing-list/model';
import { showToast } from './Toast';
import { Check, Star, Tag, ChevronRight, User } from 'lucide-react';
import * as Icons from 'lucide-react';

const ICONS = {
  sun: Icons.Sun,
  briefcase: Icons.Briefcase,
  tent: Icons.Tent,
  backpack: Icons.Backpack,
  plane: Icons.Plane,
  car: Icons.Car,
  train: Icons.Train,
  ship: Icons.Ship,
  map: Icons.Map,
  compass: Icons.Compass,
} as const;

interface RulePackSelectorProps {
  className?: string;
  onRulesApplied?: () => void;
}

export function RulePackSelector({
  className,
  onRulesApplied,
}: RulePackSelectorProps) {
  const dispatch = useAppDispatch();
  const rulePacks = useAppSelector((state) => state.rulePacks);
  const currentRules = useAppSelector(selectDefaultItemRules);

  // Get the top 2 packs by usage count
  const topPacks = [...rulePacks]
    .sort((a, b) => b.stats.usageCount - a.stats.usageCount)
    .slice(0, 2);

  const isPackActive = (pack: RulePack): boolean => {
    return currentRules.some(
      (rule) =>
        rule.originalRuleId &&
        pack.rules.some((packRule) => packRule.id === rule.originalRuleId)
    );
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

  const getPackIcon = (pack: RulePack) => {
    if (!pack.icon) return null;
    const IconComponent = ICONS[pack.icon as keyof typeof ICONS];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Popular Rule Packs</h2>
        <button
          className="btn btn-ghost btn-sm gap-2"
          onClick={() => dispatch({ type: 'OPEN_RULE_PACK_MODAL' })}
          data-testid="view-all-packs-button"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Top 2 most used packs */}
        {topPacks.map((pack) => {
          const active = isPackActive(pack);
          const icon = getPackIcon(pack);

          return (
            <div
              key={pack.id}
              className={`card bg-base-100 shadow-xl ${
                active ? 'border-2 border-primary' : ''
              }`}
              style={{
                borderColor: active ? undefined : pack.color,
                borderWidth: '1px',
              }}
              data-testid={`rule-pack-${pack.name}`}
              onClick={() => {
                dispatch({ type: 'OPEN_RULE_PACK_MODAL' });
                dispatch({ type: 'SET_SELECTED_RULE_PACK', pack });
                dispatch({
                  type: 'SET_RULE_PACK_MODAL_TAB',
                  payload: { tab: 'details', packId: pack.id },
                });
              }}
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <h3 className="card-title flex items-center gap-2 text-base">
                    {icon}
                    {pack.name}
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-base-content/70">
                    <Star className="w-4 h-4" />
                    <span>{pack.stats.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm text-base-content/70">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>{pack.rules.length} rules</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{pack.author.name}</span>
                  </div>
                </div>

                <div className="card-actions justify-end mt-auto">
                  <button
                    className={`btn btn-sm ${
                      active ? 'btn-outline btn-error' : 'btn-primary'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePack(pack);
                    }}
                    data-testid={`${active ? 'remove' : 'apply'}-pack-${
                      pack.name
                    }-button`}
                  >
                    {active ? 'Remove' : 'Add Rules'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* "More Packs" card */}
        <div
          className="card bg-base-100 shadow-xl border border-base-300 cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={() => dispatch({ type: 'OPEN_RULE_PACK_MODAL' })}
          data-testid="more-packs-card"
        >
          <div className="card-body items-center justify-center text-center p-4">
            <h3 className="card-title text-base mb-2">Explore More Packs</h3>
            <p className="text-sm text-base-content/70">
              Browse and manage all available rule packs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
