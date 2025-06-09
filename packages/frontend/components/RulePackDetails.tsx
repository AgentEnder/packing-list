import type { RulePack } from '@packing-list/model';
import {
  useAppDispatch,
  useAppSelector,
  selectDefaultItemRules,
} from '@packing-list/state';
import { showToast } from './Toast';
import { Info, Star, Users, Calendar, Tag } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RulePackDetailsProps {
  pack: RulePack;
}

export function RulePackDetails({ pack }: RulePackDetailsProps) {
  const dispatch = useAppDispatch();
  const currentRules = useAppSelector(selectDefaultItemRules);
  const allRules = useAppSelector(selectDefaultItemRules);

  const isPackActive = currentRules.some((rule) =>
    rule.packIds?.includes(pack.id)
  );

  const handleTogglePack = () => {
    dispatch({
      type: 'TOGGLE_RULE_PACK',
      pack,
      active: !isPackActive,
    });
    showToast(
      isPackActive
        ? `Removed "${pack.name}" rules`
        : `Added "${pack.name}" rules`
    );
  };

  const handleEditPack = () => {
    dispatch({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'manage', packId: pack.id },
    });
  };

  const IconComponent = pack.icon
    ? (Icons as unknown as Record<string, LucideIcon>)[pack.icon]
    : null;

  const packRules = pack.rules
    .map((ruleRef) => allRules.find((r) => r.id === ruleRef.id))
    .filter((rule): rule is NonNullable<typeof rule> => rule !== undefined);

  return (
    <div className="space-y-6" data-testid="rule-pack-details">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {IconComponent && (
              <IconComponent
                className="w-6 h-6"
                style={{ color: pack.color }}
              />
            )}
            <h2 className="text-2xl font-bold">{pack.name}</h2>
          </div>
          <p className="text-base-content/70 mt-2">{pack.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn ${isPackActive ? 'btn-error' : 'btn-primary'}`}
            onClick={handleTogglePack}
            data-testid={`${isPackActive ? 'remove' : 'apply'}-pack-${
              pack.name
            }-button`}
          >
            {isPackActive ? 'Remove Pack' : 'Add Pack'}
          </button>
          {!pack.metadata.isBuiltIn && (
            <button
              className="btn btn-ghost"
              onClick={handleEditPack}
              data-testid={`edit-pack-${pack.name}-button`}
            >
              Edit Pack
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Star className="w-8 h-8" />
            </div>
            <div className="stat-title">Rating</div>
            <div className="stat-value" data-testid="pack-rating">
              {pack.stats.rating.toFixed(1)}
            </div>
            <div className="stat-desc" data-testid="pack-review-count">
              {pack.stats.reviewCount} reviews
            </div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">Usage</div>
            <div className="stat-value" data-testid="pack-usage-count">
              {pack.stats.usageCount}
            </div>
            <div className="stat-desc">Times used</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">
            <Info className="w-5 h-5" /> Pack Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Created</span>
              </div>
              <p data-testid="pack-created-date">
                {new Date(pack.metadata.created).toLocaleDateString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4" />
                <span className="font-medium">Category</span>
              </div>
              <p data-testid="pack-category">{pack.metadata.category}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Pack Rules</h3>
        <div className="grid gap-2" data-testid="pack-rules-list">
          {packRules.map((rule) => (
            <div
              key={rule.id}
              className="card bg-base-100"
              data-testid={`pack-rule-${rule.name}`}
            >
              <div className="card-body">
                <h4 className="card-title text-base">{rule.name}</h4>
                {rule.notes && (
                  <p className="text-sm text-base-content/70">{rule.notes}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {rule.categoryId && (
                    <span className="badge badge-outline gap-1">
                      <Tag className="w-3 h-3" />
                      {rule.categoryId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
