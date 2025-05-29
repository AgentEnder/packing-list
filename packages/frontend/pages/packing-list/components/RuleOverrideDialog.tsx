import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { PackingListItem, RuleOverride } from '@packing-list/model';

interface RuleOverrideDialogProps {
  item: PackingListItem;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleOverrideDialog: React.FC<RuleOverrideDialogProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const people = useAppSelector((state) => state.people);
  const days = useAppSelector((state) => state.trip.days);
  const trip = useAppSelector((state) => state.trip);

  const [overrideCount, setOverrideCount] = useState<number>(item.count);
  const [selectedPersonId, setSelectedPersonId] = useState<
    string | undefined
  >();
  const [selectedDayIndex, setSelectedDayIndex] = useState<
    number | undefined
  >();
  const [isExcluded, setIsExcluded] = useState(false);

  const handleSave = () => {
    const override: RuleOverride = {
      ruleId: item.ruleId,
      tripId: trip.id,
      personId: selectedPersonId,
      dayIndex: selectedDayIndex,
      overrideCount: overrideCount !== item.count ? overrideCount : undefined,
      isExcluded,
    };

    dispatch({
      type: 'ADD_RULE_OVERRIDE',
      payload: override,
    });

    dispatch({
      type: 'CALCULATE_PACKING_LIST',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Modify {item.name}</h3>

        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text">Quantity</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={overrideCount}
            onChange={(e) => setOverrideCount(parseInt(e.target.value, 10))}
            min={0}
          />
        </div>

        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text">Apply to Person (Optional)</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedPersonId || ''}
            onChange={(e) => setSelectedPersonId(e.target.value || undefined)}
          >
            <option value="">All People</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text">Apply to Day (Optional)</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedDayIndex?.toString() || ''}
            onChange={(e) =>
              setSelectedDayIndex(
                e.target.value ? parseInt(e.target.value, 10) : undefined
              )
            }
          >
            <option value="">All Days</option>
            {days.map((day, index) => (
              <option key={index} value={index}>
                Day {index + 1} - {day.location}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control mb-6">
          <label className="label cursor-pointer">
            <span className="label-text">Exclude this item</span>
            <input
              type="checkbox"
              className="checkbox"
              checked={isExcluded}
              onChange={(e) => setIsExcluded(e.target.checked)}
            />
          </label>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
