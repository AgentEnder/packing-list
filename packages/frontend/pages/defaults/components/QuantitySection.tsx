import { DayCalculation } from '@packing-list/model';
import { ToggleGroup } from './ToggleGroup';

interface QuantitySectionProps {
  quantity: number;
  perDay: boolean;
  perPerson: boolean;
  daysPattern?: DayCalculation;
  onQuantityChange: (quantity: number) => void;
  onPerDayChange: (checked: boolean) => void;
  onPerPersonChange: (checked: boolean) => void;
  onDaysPatternChange: (pattern: DayCalculation | undefined) => void;
  label?: string;
  testIdPrefix?: string;
  className?: string;
  minQuantity?: number;
  cardStyle?: boolean;
}

export const QuantitySection = ({
  quantity,
  perDay,
  perPerson,
  daysPattern,
  onQuantityChange,
  onPerDayChange,
  onPerPersonChange,
  onDaysPatternChange,
  label = 'Quantity',
  testIdPrefix = '',
  className = '',
  minQuantity = 0,
  cardStyle = false,
}: QuantitySectionProps) => {
  const Content = () => (
    <>
      <div className="flex flex-col gap-2">
        {!cardStyle && (
          <label htmlFor={`${testIdPrefix}quantity`} className="label">
            {label}
          </label>
        )}
        <input
          id={`${testIdPrefix}quantity`}
          type="number"
          className="input input-bordered w-full"
          value={quantity}
          onChange={(e) =>
            onQuantityChange(parseFloat(e.target.value) || minQuantity)
          }
          min={minQuantity}
          step={1}
          data-testid={`${testIdPrefix}quantity-input`}
          aria-label={`${label} value`}
        />

        <ToggleGroup
          perDay={perDay}
          perPerson={perPerson}
          daysPattern={daysPattern}
          onPerDayChange={onPerDayChange}
          onPerPersonChange={onPerPersonChange}
          onDaysPatternChange={onDaysPatternChange}
          testIdPrefix={testIdPrefix}
        />
      </div>
    </>
  );

  if (cardStyle) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <label htmlFor={`${testIdPrefix}quantity`} className="label">
            {label}
          </label>
          <div className="space-y-4">
            <div
              className="card bg-base-200 p-4"
              role="group"
              aria-label={`${label} settings`}
            >
              <Content />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Content />
    </div>
  );
};
