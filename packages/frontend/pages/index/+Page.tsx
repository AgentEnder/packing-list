import { useAppSelector } from '@packing-list/state';
import { Link } from '../../components/Link';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';
import { DemoDataModal } from '../../components/DemoDataModal';

export default function Page() {
  const people = useAppSelector((state) => state.people);
  const trip = useAppSelector((state) => state.trip);
  const defaultItems = useAppSelector((state) => state.calculated.defaultItems);

  const hasTrip = trip.days.length > 0;
  const hasPeople = people.length > 0;
  const hasDefaultItems = defaultItems.length > 0;

  return (
    <PageContainer>
      <DemoDataModal />
      <PageHeader title="Smart Packing List" />

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
              <div className="stat-value">{trip.days.length}</div>
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

      <p>
        Let&apos;s get started by creating a new trip or loading one you&apos;ve
        already started.
      </p>

      <button className="btn btn-primary">
        &quot;Try it out with demo data&quot;
      </button>
      <button className="btn btn-primary">&quot;Start fresh&quot;</button>
    </PageContainer>
  );
}
