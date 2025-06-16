import {
  DefaultItemRule,
  Day,
  getAllCategories,
  Person,
} from '@packing-list/model';
import {
  calculateRuleTotal,
  calculateItemQuantity,
  calculateNumPeopleMeetingCondition,
  calculateNumDaysMeetingCondition,
} from '@packing-list/shared-utils';
import { Info, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { CalculationDisplay } from './CalculationDisplay';
import { RuleFormModal } from './RuleFormModal';
import { ConfirmDialog } from '@packing-list/shared-components';

type RuleCardProps = {
  rule: DefaultItemRule;
  people: Person[];
  days: Day[];
};

const formatDayPattern = (pattern: { every: number; roundUp: boolean }) => {
  if (pattern.every === 1) return 'every day';
  return `every ${pattern.every} days${pattern.roundUp ? ' (rounded up)' : ''}`;
};

export const RuleCard = ({ rule, people, days }: RuleCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dispatch = useAppDispatch();

  const total = calculateRuleTotal(rule, people, days);
  const { baseQuantity, perDay, perPerson, daysPattern, extraItems } =
    rule.calculation;
  const peopleCount = calculateNumPeopleMeetingCondition(
    people,
    rule.conditions || []
  );
  const daysCount = calculateNumDaysMeetingCondition(
    days,
    rule.conditions || []
  );

  // Get category information
  const categories = getAllCategories();
  const category = categories.find((c) => c.id === rule.categoryId);
  const subcategory = categories.find((c) => c.id === rule.subcategoryId);

  // Get the icon component for a category
  const getCategoryIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[
      iconName
    ];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  // Get rule packs
  const rulePacks = useAppSelector((state) => state.rulePacks);

  const handlePackClick = (packId: string) => {
    dispatch({
      type: 'OPEN_RULE_PACK_MODAL',
      payload: { tab: 'details', packId },
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    dispatch({
      type: 'DELETE_ITEM_RULE',
      payload: { id: rule.id },
    });
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const packBadges = rule.packIds
    ? rulePacks
        .filter((pack) => rule.packIds?.some((ref) => ref.packId === pack.id))
        .map((pack) => {
          const IconComponent = pack.icon
            ? (Icons as unknown as Record<string, LucideIcon>)[pack.icon]
            : null;
          return (
            <button
              key={pack.id}
              className="badge badge-sm gap-1 cursor-pointer"
              style={{ backgroundColor: pack.color, color: 'white' }}
              onClick={() => handlePackClick(pack.id)}
            >
              {IconComponent && <IconComponent className="w-3 h-3" />}
              {pack.name}
            </button>
          );
        })
    : null;

  // Calculate if extra items would result in zero
  const extraItemsTotal = extraItems
    ? calculateItemQuantity(
        extraItems.quantity,
        extraItems.perPerson,
        extraItems.perDay,
        extraItems.daysPattern,
        peopleCount,
        daysCount
      )
    : 0;

  const showMath = (() => {
    // Always show math for detailed calculations if we have people/days
    if (peopleCount === 0 || daysCount === 0) {
      return false;
    }

    // Show math if base calculation uses multipliers (per person/day with counts > 1)
    const baseShowsMath =
      (perPerson && peopleCount > 1) || (perDay && daysCount > 1);

    // Show math if extra calculation uses multipliers
    const extraShowsMath =
      extraItems &&
      ((extraItems.perPerson && peopleCount > 1) ||
        (extraItems.perDay && daysCount > 1));

    // Show math if either base or extra calculations have multipliers
    return baseShowsMath || extraShowsMath;
  })();

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-2" data-testid="rule-card">
        <div className="flex flex-col">
          <h3 className="font-medium text-lg">{rule.name}</h3>
          {category && (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              {category.icon && getCategoryIcon(category.icon)}
              <span>{category.name}</span>
              {subcategory && (
                <>
                  <span className="text-base-content/30">•</span>
                  <span>{subcategory.name}</span>
                </>
              )}
            </div>
          )}
          {packBadges && packBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">{packBadges}</div>
          )}
        </div>

        <div className="flex flex-col items-end row-span-2">
          <span className="text-base-content/70">Total: {total}</span>
          {peopleCount === 0 || daysCount === 0 ? (
            <div className="text-xs text-warning">
              {peopleCount === 0 && daysCount === 0
                ? 'No matching people or days'
                : peopleCount === 0
                ? 'No matching people'
                : 'No matching days'}
            </div>
          ) : (
            showMath && (
              <div className="hidden md:block text-xs text-base-content/50 mb-auto">
                <CalculationDisplay
                  baseCalculation={{
                    quantity: baseQuantity,
                    perPerson: !!perPerson,
                    perDay: !!perDay,
                    daysPattern,
                  }}
                  extraCalculation={
                    extraItems?.quantity && extraItemsTotal > 0
                      ? {
                          quantity: extraItems.quantity,
                          perPerson: Boolean(extraItems.perPerson),
                          perDay: Boolean(extraItems.perDay),
                          daysPattern: extraItems.daysPattern,
                        }
                      : undefined
                  }
                  peopleCount={peopleCount}
                  daysCount={daysCount}
                />
              </div>
            )
          )}
        </div>

        <div
          className="space-y-2 md:col-start-1 col-span-2 md:col-span-1"
          data-testid="rule-calculation-description"
        >
          {(perPerson || perDay || extraItems?.quantity) && (
            <p className="text-base-content/70">
              {baseQuantity}
              {perPerson ? ' per person' : ''}
              {perDay && !daysPattern ? ' per day' : ''}
              {perDay && daysPattern ? ` ${formatDayPattern(daysPattern)}` : ''}
              {extraItems?.quantity ? (
                <>
                  {' + '}
                  {extraItems.quantity} extra
                  {extraItems.perPerson ? ' per person' : ''}
                  {extraItems.perDay && !extraItems.daysPattern
                    ? ' per day'
                    : ''}
                  {extraItems.perDay && extraItems.daysPattern
                    ? ` ${formatDayPattern(extraItems.daysPattern)}`
                    : ''}
                </>
              ) : null}
            </p>
          )}
          {rule.notes && (
            <div className="text-sm text-base-content/70 flex gap-2 items-start">
              <Info className="stroke-base-content/50 shrink-0 w-4 h-4 mt-0.5" />
              <span>{rule.notes}</span>
            </div>
          )}
          {rule.conditions && rule.conditions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Conditions:</p>
              <div className="space-y-1">
                {rule.conditions.map((condition, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div
                      className={`badge badge-outline gap-1 ${
                        condition.notes ? 'tooltip tooltip-right' : ''
                      }`}
                      data-tip={condition.notes}
                      data-testid={`rule-condition-${index}`}
                    >
                      {condition.type === 'person' ? '👤' : '📅'}{' '}
                      {condition.field} {condition.operator} {condition.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 flex justify-end gap-2">
          <button
            onClick={handleEdit}
            className="btn btn-primary btn-sm"
            data-testid="edit-rule-button"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-error btn-sm"
            data-testid="delete-rule-button"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Edit Rule Modal */}
      <RuleFormModal
        isOpen={isEditing}
        onClose={handleCancelEdit}
        rule={rule}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Delete Rule?"
        message={`Are you sure you want to delete "${rule.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="error"
        onConfirm={handleConfirmDelete}
        data-testid="delete-rule-confirm-modal"
      />
    </>
  );
};
