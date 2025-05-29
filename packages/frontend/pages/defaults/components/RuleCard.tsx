import { DefaultItemRule, Person, Day } from '@packing-list/model';
import {
  calculateRuleTotal,
  calculateItemQuantity,
  calculateNumPeopleMeetingCondition,
  calculateNumDaysMeetingCondition,
} from '../utils';
import { ReactNode } from 'react';

type RuleCardProps = {
  rule: DefaultItemRule;
  people: Person[];
  days: Day[];
  onEdit: () => void;
  onDelete: () => void;
};

const formatDayPattern = (pattern: { every: number; roundUp: boolean }) => {
  if (pattern.every === 1) return 'every day';
  return `every ${pattern.every} days${pattern.roundUp ? ' (rounded up)' : ''}`;
};

export const RuleCard = ({
  rule,
  people,
  days,
  onEdit,
  onDelete,
}: RuleCardProps) => {
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

  // Format the multiplier text
  const getMultiplierParts = () => {
    const parts = [];
    if (perPerson && peopleCount > 0) {
      if (peopleCount > 1) {
        parts.push({ value: peopleCount, unit: 'people' });
      }
    }
    if (perDay && daysCount > 0) {
      if (daysPattern && daysPattern.every > 1) {
        const dayGroups = daysPattern.roundUp
          ? Math.ceil(daysCount / daysPattern.every)
          : Math.floor(daysCount / daysPattern.every);
        if (dayGroups > 1) {
          parts.push({
            value: dayGroups,
            unit: `${daysPattern.every}-day periods`,
          });
        } else if (dayGroups === 1) {
          parts.push({ value: 1, unit: `${daysPattern.every}-day period` });
        }
      } else if (daysCount > 1) {
        parts.push({ value: daysCount, unit: 'days' });
      }
    }
    return parts;
  };

  const getExtraMultiplierParts = () => {
    if (!extraItems?.quantity) return [];
    const parts = [];
    if (extraItems.perPerson && peopleCount > 0) {
      if (peopleCount > 1) {
        parts.push({ value: peopleCount, unit: 'people' });
      }
    }
    if (extraItems.perDay && daysCount > 0) {
      if (extraItems.daysPattern && extraItems.daysPattern.every > 1) {
        const dayGroups = extraItems.daysPattern.roundUp
          ? Math.ceil(daysCount / extraItems.daysPattern.every)
          : Math.floor(daysCount / extraItems.daysPattern.every);
        if (dayGroups > 1) {
          parts.push({
            value: dayGroups,
            unit: `${extraItems.daysPattern.every}-day periods`,
          });
        } else if (dayGroups === 1) {
          parts.push({
            value: 1,
            unit: `${extraItems.daysPattern.every}-day period`,
          });
        }
      } else if (daysCount > 1) {
        parts.push({ value: daysCount, unit: 'days' });
      }
    }
    return parts;
  };

  const baseParts = getMultiplierParts();
  const extraParts = getExtraMultiplierParts();
  const showMath =
    (baseParts.length > 0 || extraParts.length > 0) &&
    peopleCount > 0 &&
    daysCount > 0;

  // Get units needed for each row and ensure common units are in the same order
  const getUnitsForRow = (parts: Array<{ value: number; unit: string }>) => {
    return [...new Set(parts.map((p) => p.unit))];
  };

  const baseUnits = getUnitsForRow(baseParts);
  const extraUnits = getUnitsForRow(extraParts);

  // Combine units ensuring common ones appear in the same order
  const allUnits = [...new Set([...baseUnits, ...extraUnits])];

  // Check if we need to reserve space for leading numbers
  const needsLeadingNumberSpace =
    baseQuantity !== 1 || (extraItems?.quantity && extraItems.quantity !== 1);

  const renderMultiplierRow = (
    quantity: number,
    parts: Array<{ value: number; unit: string }>,
    prefix = ''
  ) => {
    // If it's an extra item with no multipliers, just return the simple format
    if (prefix && parts.length === 0) {
      return (
        <div className="flex items-center justify-end gap-x-1">
          <span>{prefix}</span>
          <span>{quantity}</span>
        </div>
      );
    }

    const cells: ReactNode[] = [];

    // Only add quantity cell if we need the space
    if (needsLeadingNumberSpace) {
      cells.push(
        <div
          key="quantity"
          className={`text-right ${quantity === 1 ? 'opacity-0' : ''}`}
        >
          {quantity}
        </div>,
        // Always add the multiplication symbol after the quantity, but hide it if quantity is 1
        <span
          key="mult-quantity"
          className={`text-center ${quantity === 1 ? 'opacity-0' : ''}`}
        >
          ×
        </span>
      );
    }

    // Add cells for each unit position, maintaining alignment with other rows
    allUnits.forEach((unit, index) => {
      const part = parts.find((p) => p.unit === unit);
      const showMultiplier = index > 0; // Only show multipliers between units

      if (part) {
        if (showMultiplier) {
          cells.push(
            <span key={`mult-${index}`} className="text-center">
              ×
            </span>
          );
        }
        cells.push(
          <div
            key={`unit-${index}`}
            className="grid grid-cols-[auto_auto] items-center gap-x-1"
          >
            <span className="text-right">{part.value}</span>
            <span>{part.unit}</span>
          </div>
        );
      } else {
        // Add empty cells to maintain alignment with other rows
        if (showMultiplier) {
          cells.push(
            <span key={`mult-${index}`} className="opacity-0">
              ×
            </span>
          );
        }
        cells.push(
          <div
            key={`unit-${index}`}
            className="grid grid-cols-[auto_auto] items-center gap-x-1 opacity-0"
          >
            <span className="text-right">0</span>
            <span>{unit}</span>
          </div>
        );
      }
    });

    return (
      <div className="flex items-center justify-end gap-x-1">
        {prefix && <span>{prefix}</span>}
        <div
          className="grid items-center gap-x-1"
          style={{
            gridTemplateColumns: needsLeadingNumberSpace
              ? `auto auto ${' auto auto'.repeat(allUnits.length)}`
              : `auto ${' auto'.repeat(allUnits.length)}`,
          }}
        >
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <h3 className="font-medium text-lg">{rule.name}</h3>

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
            <div className="text-xs text-base-content/50 space-y-0.5 mb-auto">
              {renderMultiplierRow(baseQuantity, baseParts)}
              {extraItems?.quantity &&
                extraItemsTotal > 0 &&
                renderMultiplierRow(extraItems.quantity, extraParts, '+ ')}
            </div>
          )
        )}
      </div>

      <div className="space-y-2">
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
                {extraItems.perDay && !extraItems.daysPattern ? ' per day' : ''}
                {extraItems.perDay && extraItems.daysPattern
                  ? ` ${formatDayPattern(extraItems.daysPattern)}`
                  : ''}
              </>
            ) : null}
          </p>
        )}
        {rule.notes && (
          <div className="text-sm text-base-content/70 flex gap-2 items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-base-content/50 shrink-0 w-4 h-4 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
        <button onClick={onEdit} className="btn btn-primary btn-sm">
          Edit
        </button>
        <button onClick={onDelete} className="btn btn-error btn-sm">
          Delete
        </button>
      </div>
    </div>
  );
};
