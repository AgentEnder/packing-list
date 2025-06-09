import {
  useAppSelector,
  selectPeople,
  selectTripDays,
  selectSelectedTripId,
  selectDefaultItemRules,
  useAppDispatch,
  actions,
} from '@packing-list/state';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { RuleFormModal } from './components/RuleFormModal';
import { RuleList } from './components/RuleList';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';
import { NoTripSelected } from '../../components/NoTripSelected';
import { RulePackSelector } from '../../components/RulePackSelector';
import { navigate } from 'vike/client/router';

export default function DefaultsPage() {
  const selectedTripId = useAppSelector(selectSelectedTripId);
  const defaultItemRules = useAppSelector(selectDefaultItemRules);
  const people = useAppSelector(selectPeople);
  const days = useAppSelector(selectTripDays);
  const dispatch = useAppDispatch();
  const flow = useAppSelector((s) => s.ui.flow);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const handleContinue = () => {
    if (flow.current !== null) {
      dispatch(actions.advanceFlow());
      const next = flow.steps[flow.current + 1];
      if (next) navigate(next.path);
    }
  };

  // If no trip is selected, show the no trip selected state
  if (!selectedTripId) {
    return (
      <PageContainer>
        <PageHeader title="Packing Rules" />
        <NoTripSelected
          title="No Trip Selected"
          message="You need to select a trip before you can create packing rules. Rules help calculate the perfect quantity of items based on your trip duration and travelers."
          actionText="View My Trips"
          actionHref="/trips"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Default Packing Rules" />

      <HelpBlurb storageKey="packing-rules" title="How Default Rules Work">
        <p>
          Default packing rules help you automatically calculate how many items
          to pack based on your trip details. We&apos;ve included some common
          items to get you started, like clothes and toiletries, but you can
          easily edit or remove these and add your own rules.
        </p>

        <h3 className="text-base mt-4 mb-2">Available Rule Options</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4">
          <dt className="font-bold">Base Quantity:</dt>
          <dd>The starting number of items</dd>

          <dt className="font-bold">Per Person:</dt>
          <dd>Multiply by the number of travelers</dd>

          <dt className="font-bold">Per Day:</dt>
          <dd>Multiply by the number of days</dd>

          <dt className="font-bold">Every N Days:</dt>
          <dd>
            Pack items for every N days (e.g., laundry supplies every 3 days)
          </dd>

          <dt className="font-bold">Extra Items:</dt>
          <dd>Add additional items with their own multipliers</dd>

          <dt className="font-bold">Conditions:</dt>
          <dd>
            Only apply the rule based on person traits (age, gender) or trip
            details (climate, activities)
          </dd>
        </dl>

        <div className="bg-base-200 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium mb-2">Example Calculation</h3>
          <p className="text-sm text-base-content/70 m-0">
            For the rule &quot;1 shirt per person every 2 days + 1 extra per
            person&quot; with 4 people on a 7-day trip:
            <br />
            Base: (1 × 4 people × 4 two-day periods) = 16 shirts
            <br />
            Extra: (1 × 4 people) = 4 shirts
            <br />
            Total: 20 shirts
          </p>
        </div>
      </HelpBlurb>

      <RulePackSelector className="mb-8" />

      {/* Add Rule Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Rules</h2>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setIsRuleModalOpen(true)}
          data-testid="add-rule-button"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <RuleList rules={defaultItemRules} people={people} days={days} />

      {flow.current !== null && flow.current < flow.steps.length - 1 && (
        <div className="mt-6 text-right">
          <button
            className="btn btn-primary fixed bottom-6 right-6"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      )}

      {/* Rule Form Modal */}
      <RuleFormModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
      />
    </PageContainer>
  );
}
