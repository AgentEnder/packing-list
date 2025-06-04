import { DayCalculation } from '@packing-list/model';

interface ToggleGroupProps {
  perDay: boolean;
  perPerson: boolean;
  daysPattern?: DayCalculation;
  onPerDayChange: (checked: boolean) => void;
  onPerPersonChange: (checked: boolean) => void;
  onDaysPatternChange: (pattern: DayCalculation | undefined) => void;
  testIdPrefix?: string;
  label?: string;
}

export const ToggleGroup = ({
  perDay,
  perPerson,
  daysPattern,
  onPerDayChange,
  onPerPersonChange,
  onDaysPatternChange,
  testIdPrefix = '',
  label,
}: ToggleGroupProps) => {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-col gap-2">
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={perDay}
            onChange={(e) => onPerDayChange(e.target.checked)}
            data-testid={`${testIdPrefix}per-day-checkbox`}
          />
          <span className="label-text">Per Day</span>
        </label>

        {perDay && (
          <div className="ml-8">
            <label
              className="label cursor-pointer justify-start gap-2 tooltip tooltip-right"
              data-tip="When enabled, items will be counted in groups of N days. For example, if set to 'Every 2 Days', you'd get 1 item for each 2-day period. "
            >
              <input
                type="checkbox"
                className="checkbox"
                checked={daysPattern !== undefined}
                onChange={(e) =>
                  onDaysPatternChange(
                    e.target.checked ? { every: 2, roundUp: true } : undefined
                  )
                }
                data-testid={`${testIdPrefix}every-n-days-checkbox`}
              />
              <span className="label-text">Every N Days</span>
            </label>

            {daysPattern && (
              <div className="form-control max-w-xs ml-8">
                <label className="label">
                  <span className="label-text">Days</span>
                  <div
                    className="tooltip tooltip-right"
                    data-tip="The number of days to group together. Higher numbers mean fewer items overall since they're reused across more days."
                  >
                    <div className="cursor-help text-base-content/70">?</div>
                  </div>
                </label>
                <input
                  type="number"
                  className="input input-bordered max-w-xs"
                  value={daysPattern.every}
                  onChange={(e) =>
                    onDaysPatternChange({
                      every: parseInt(e.target.value) || 1,
                      roundUp: daysPattern.roundUp,
                    })
                  }
                  min="1"
                  data-testid={`${testIdPrefix}every-n-days-input`}
                  aria-label="Number of days to group together"
                />
              </div>
            )}
          </div>
        )}

        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={perPerson}
            onChange={(e) => onPerPersonChange(e.target.checked)}
            data-testid={`${testIdPrefix}per-person-checkbox`}
          />
          <span className="label-text">Per Person</span>
        </label>
      </div>
    </div>
  );
};
