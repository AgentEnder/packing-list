import {
  useAppSelector,
  selectPeople,
  selectCurrentTrip,
  selectCalculatedItems,
  selectSelectedTripId,
  selectAccurateTripSummaries,
} from '@packing-list/state';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';
import { NoTripSelected } from '../../components/NoTripSelected';
import { Link } from '@packing-list/shared-components';
import { PendingInvitationsCard } from '../../components/PendingInvitationsCard';

export default function Page() {
  const selectedTripId = useAppSelector(selectSelectedTripId);
  const tripSummaries = useAppSelector(selectAccurateTripSummaries);
  const people = useAppSelector(selectPeople);
  const trip = useAppSelector(selectCurrentTrip);
  const calculatedItems = useAppSelector(selectCalculatedItems);
  const defaultItems = calculatedItems?.defaultItems || [];
  const pendingInvitations = useAppSelector(
    (state) => state.tripUsers.pendingInvitations
  );


  // If no trip is selected or no trips exist, show the no trip selected state
  if (!selectedTripId || tripSummaries.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Smart Packing List" />
        
        {/* Show pending invitations even when no trip is selected */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6">
            <PendingInvitationsCard />
          </div>
        )}
        
        <NoTripSelected
          title="Welcome to Smart Packing List!"
          message="Get started by selecting an existing trip, creating a new one, or trying our demo to see how smart packing recommendations work."
          actionText="View My Trips"
          actionHref="/trips"
        />
      </PageContainer>
    );
  }

  const hasTrip = trip && trip.days.length > 0;
  const hasPeople = people.length > 0;
  const hasDefaultItems = defaultItems.length > 0;

  return (
    <PageContainer>
      <PageHeader title="Smart Packing List" />

      {/* Show pending invitations if any */}
      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <PendingInvitationsCard />
        </div>
      )}

      <HelpBlurb storageKey="overview" title="How It Works">
        <p>
          Create the perfect packing list for your trip in three easy steps:
        </p>
        <ol>
          <li>
            <strong>Configure Your Trip</strong> - Add your travel dates and
            destinations to automatically calculate the number of days
            you&apos;ll be away.
          </li>
          <li>
            <strong>Add Travelers</strong> - Include everyone going on the trip,
            with their age and preferences to personalize packing
            recommendations.
          </li>
          <li>
            <strong>Set Packing Rules</strong> - Use smart rules to
            automatically calculate quantities (e.g., &quot;1 shirt per person
            per 2 days + 1 extra&quot;).
          </li>
        </ol>
        <p className="text-sm text-base-content/70">
          Your packing list will automatically update as you modify any of these
          details!
        </p>
      </HelpBlurb>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title mb-4">Current Trip Status</h2>

          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Trip Length</div>
              <div className="stat-value">{trip?.days.length || 0}</div>
              <div className="stat-desc">days</div>
            </div>

            <div className="stat">
              <div className="stat-title">Travelers</div>
              <div className="stat-value">{people.length}</div>
              <div className="stat-desc">people</div>
            </div>

            <div className="stat">
              <div className="stat-title">Packed Items</div>
              <div className="stat-value">{defaultItems.length}</div>
              <div className="stat-desc">items calculated</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Next Steps</h3>
            <ul className="steps steps-vertical md:steps-horizontal w-full">
              <li className={`step ${hasTrip ? 'step-primary' : ''}`}>
                <span className="link link-hover">
                  <Link href="/days">
                    {hasTrip ? 'Trip Configured' : 'Configure Trip'}
                  </Link>
                </span>
              </li>
              <li className={`step ${hasPeople ? 'step-primary' : ''}`}>
                <span className="link link-hover">
                  <Link href="/people">
                    {hasPeople ? 'Travelers Added' : 'Add Travelers'}
                  </Link>
                </span>
              </li>
              <li className={`step ${hasDefaultItems ? 'step-primary' : ''}`}>
                <span className="link link-hover">
                  <Link href="/defaults">
                    {hasDefaultItems ? 'Rules Created' : 'Create Rules'}
                  </Link>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {defaultItems.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Current Packing List</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultItems.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td className="text-right">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-actions justify-end mt-4">
              <span className="btn btn-primary">
                <Link href="/packing-list">View Full List</Link>
              </span>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
