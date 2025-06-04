import { Calculation, DayCalculation } from '@packing-list/model';
import { QuantitySection } from './QuantitySection';

interface ItemCalculationFormProps {
  calculation: Calculation;
  onCalculationChange: (calculation: Calculation) => void;
  testIdPrefix?: string;
  className?: string;
}

const DEFAULT_CALCULATION: Calculation = {
  baseQuantity: 1,
  perDay: false,
  perPerson: false,
  extraItems: {
    quantity: 1,
    perDay: false,
    perPerson: false,
  },
};

export const ItemCalculationForm = ({
  calculation = DEFAULT_CALCULATION,
  onCalculationChange,
  testIdPrefix = '',
  className = '',
}: ItemCalculationFormProps) => {
  const handleExtraItemsChange = (
    checked: boolean,
    field: 'perDay' | 'perPerson'
  ) => {
    onCalculationChange({
      ...calculation,
      extraItems: {
        ...(calculation.extraItems || {}),
        quantity: Math.max(calculation.extraItems?.quantity || 1, 1),
        [field]: checked,
        daysPattern:
          field === 'perDay' && !checked
            ? undefined
            : calculation.extraItems?.daysPattern,
      },
    });
  };

  const handleExtraItemsDaysPatternChange = (
    pattern: DayCalculation | undefined
  ) => {
    onCalculationChange({
      ...calculation,
      extraItems: {
        ...(calculation.extraItems || {}),
        quantity: Math.max(calculation.extraItems?.quantity || 1, 1),
        daysPattern: pattern,
      },
    });
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}
      role="group"
      aria-label="Item quantity calculation"
    >
      {/* Base Quantity Section */}
      <QuantitySection
        quantity={calculation.baseQuantity}
        perDay={calculation.perDay || false}
        perPerson={calculation.perPerson || false}
        daysPattern={calculation.daysPattern}
        onQuantityChange={(quantity) =>
          onCalculationChange({
            ...calculation,
            baseQuantity: quantity,
          })
        }
        onPerDayChange={(checked) =>
          onCalculationChange({
            ...calculation,
            perDay: checked,
            daysPattern: checked ? calculation.daysPattern : undefined,
          })
        }
        onPerPersonChange={(checked) =>
          onCalculationChange({
            ...calculation,
            perPerson: checked,
          })
        }
        onDaysPatternChange={(pattern) =>
          onCalculationChange({
            ...calculation,
            daysPattern: pattern,
          })
        }
        label="Base Quantity"
        testIdPrefix={`${testIdPrefix}base-`}
        cardStyle={true}
      />

      {/* Extra Items Section */}
      <QuantitySection
        quantity={calculation.extraItems?.quantity || 0}
        perDay={calculation.extraItems?.perDay || false}
        perPerson={calculation.extraItems?.perPerson || false}
        daysPattern={calculation.extraItems?.daysPattern}
        onQuantityChange={(quantity) =>
          onCalculationChange({
            ...calculation,
            extraItems: {
              ...(calculation.extraItems || {}),
              quantity,
            },
          })
        }
        onPerDayChange={(checked) => handleExtraItemsChange(checked, 'perDay')}
        onPerPersonChange={(checked) =>
          handleExtraItemsChange(checked, 'perPerson')
        }
        onDaysPatternChange={handleExtraItemsDaysPatternChange}
        label="Extra Quantity"
        testIdPrefix={`${testIdPrefix}extra-`}
        minQuantity={0}
        cardStyle={true}
      />
    </div>
  );
};
