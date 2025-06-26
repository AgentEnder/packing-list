import {
  selectPeople,
  useAppSelector,
  selectSelectedTripId,
} from '@packing-list/state';
import { PersonList } from './components/PersonList';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';
import { NoTripSelected } from '../../components/NoTripSelected';
import { FlowContinueButton } from '../../components/FlowContinueButton';
// import { Link } from '../../components/Link';
import { Settings } from 'lucide-react';

export default function PeoplePage() {
  const selectedTripId = useAppSelector(selectSelectedTripId);
  const people = useAppSelector(selectPeople);

  // If no trip is selected, show the no trip selected state
  if (!selectedTripId) {
    return (
      <PageContainer>
        <PageHeader title="People on this Trip" />
        <NoTripSelected
          title="No Trip Selected"
          message="You need to select a trip before you can manage travelers. Each trip can have different people with personalized packing recommendations."
          actionText="View My Trips"
          actionHref="/trips"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="People on this Trip"
        actions={
          <a
            href="/people/manage"
            className="btn btn-outline btn-sm ml-auto"
            title="Manage Templates"
          >
            <Settings className="w-4 h-4" />
            Manage Templates
          </a>
        }
      />
      <HelpBlurb storageKey="travelers" title="Managing Travelers">
        <p>
          Add everyone who&apos;s going on the trip to help calculate the right
          amount of items to pack. Each person&apos;s details help customize
          packing recommendations:
        </p>

        <h3 className="text-base mt-4 mb-2">Person Details</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4">
          <dt className="font-bold">Name:</dt>
          <dd>Identify each traveler uniquely</dd>

          <dt className="font-bold">Age:</dt>
          <dd>Used for age-specific packing rules (e.g., baby items)</dd>

          <dt className="font-bold">Gender:</dt>
          <dd>Helps with gender-specific packing rules</dd>
        </dl>

        <div className="bg-base-200 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium mb-2">How It Works</h3>
          <p className="text-sm text-base-content/70 m-0">
            Your packing list will automatically adjust based on who&apos;s
            traveling:
            <br />
            • Items can be multiplied per person
            <br />
            • Special items can be added based on age or gender
            <br />• You can create custom rules for specific travelers
          </p>
        </div>
      </HelpBlurb>
      <PersonList people={people} />
      <FlowContinueButton />
    </PageContainer>
  );
}
