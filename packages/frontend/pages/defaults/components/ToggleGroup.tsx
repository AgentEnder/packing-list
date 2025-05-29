import { DayCalculation } from '@packing-list/model';
import { DayPatternSelect } from './DayPatternSelect';

type ToggleGroupProps = {
  perDay: boolean;
  perPerson: boolean;
  daysPattern?: DayCalculation;
  onPerDayChange: (checked: boolean) => void;
  onPerPersonChange: (checked: boolean) => void;
  onDaysPatternChange: (pattern: DayCalculation | undefined) => void;
  label?: string;
};

export const ToggleGroup = ({
  perDay,
  perPerson,
  daysPattern,
  onPerDayChange,
  onPerPersonChange,
  onDaysPatternChange,
  label,
}: ToggleGroupProps) => (
  <div className="form-control mt-4">
    {label && (
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
    )}
    <div className="flex flex-col gap-2">
      <label className="label cursor-pointer min-w-[200px]">
        <span className="label-text w-24">Per Person</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={perPerson}
          onChange={(e) => onPerPersonChange(e.target.checked)}
        />
      </label>
      <label className="label cursor-pointer min-w-[200px]">
        <span className="label-text w-24">Per Day</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={perDay}
          onChange={(e) => onPerDayChange(e.target.checked)}
        />
      </label>
      <div
        className={perDay ? 'animate-in fade-in slide-in-from-top-1' : 'hidden'}
      >
        <DayPatternSelect
          value={daysPattern}
          onChange={onDaysPatternChange}
          label="Day Pattern"
        />
      </div>
    </div>
  </div>
);
