import { DayCalculation } from '@packing-list/model';

type DayPatternSelectProps = {
  value: DayCalculation | undefined;
  onChange: (pattern: DayCalculation | undefined) => void;
  label?: string;
};

export const DayPatternSelect = ({
  value,
  onChange,
  label,
}: DayPatternSelectProps) => {
  const handlePatternChange = (type: 'daily' | 'every') => {
    if (type === 'daily') {
      onChange({ every: 1, roundUp: true });
    } else {
      onChange({ every: 3, roundUp: true });
    }
  };

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className="label-text font-medium">{label}</span>
        </label>
      )}
      <div className="flex flex-col gap-2">
        <div className="join w-full">
          <button
            type="button"
            className={`join-item btn flex-1 ${
              !value || value.every === 1 ? 'btn-active' : ''
            }`}
            onClick={() => handlePatternChange('daily')}
          >
            Every Day
          </button>
          <button
            type="button"
            className={`join-item btn flex-1 ${
              value?.every && value.every > 1 ? 'btn-active' : ''
            }`}
            onClick={() => handlePatternChange('every')}
          >
            Every N Days
          </button>
        </div>

        {value?.every && value.every > 1 && (
          <div className="flex items-center gap-4">
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">Every N Days</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={value.every}
                min={2}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 2;
                  onChange({ ...value, every: num });
                }}
              />
            </div>
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Round Up</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={value.roundUp}
                  onChange={(e) =>
                    onChange({ ...value, roundUp: e.target.checked })
                  }
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
