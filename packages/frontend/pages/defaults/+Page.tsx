import { useSelector } from 'react-redux';
import { StoreType } from '@packing-list/state';
import { CreateRuleForm } from './components/CreateRuleForm';
import { RuleList } from './components/RuleList';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';

export default function DefaultsPage() {
  const defaultRules = useSelector(
    (state: StoreType) => state.defaultItemRules
  );
  const people = useSelector((state: StoreType) => state.people);
  const days = useSelector((state: StoreType) => state.trip.days);

  return (
    <PageContainer>
      <PageHeader title="Default Packing Rules" />

      <HelpBlurb storageKey="packing-rules" title="How Default Rules Work">
        <p>
          Default packing rules help you automatically calculate how many items
          to pack based on your trip details. We've included some common items
          to get you started, like clothes and toiletries, but you can easily
          edit or remove these and add your own rules.
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
            For the rule "1 shirt per person every 2 days + 1 extra per person"
            with 4 people on a 7-day trip:
            <br />
            Base: (1 × 4 people × 4 two-day periods) = 16 shirts
            <br />
            Extra: (1 × 4 people) = 4 shirts
            <br />
            Total: 20 shirts
          </p>
        </div>
      </HelpBlurb>

      <CreateRuleForm />
      <RuleList rules={defaultRules} people={people} days={days} />
    </PageContainer>
  );
}
