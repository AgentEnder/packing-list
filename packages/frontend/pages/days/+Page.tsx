import { useAppSelector } from '@packing-list/state';
import { Link } from '../../components/Link';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';

export default function DaysPage() {
  const trip = useAppSelector((state) => state.trip);

  return (
    <PageContainer>
      <PageHeader title="Configure Your Trip" />
      <HelpBlurb storageKey="trip-wizard" title="How to Configure Your Trip">
        <p>
          Add your travel dates and destinations to help calculate how many
          items you need to pack.
        </p>
        <div className="alert alert-info mt-4">
          <div>
            <h3 className="font-bold">Pro Tips</h3>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Add each day of your trip</li>
              <li>Include locations to help with packing suggestions</li>
              <li>Mark travel days to adjust packing needs</li>
              <li>Review and adjust before proceeding</li>
            </ul>
          </div>
        </div>
      </HelpBlurb>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Trip Days</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trip.days.map((day, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{day.date}</td>
                    <td>{day.location}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost">Edit</button>
                      <button className="btn btn-sm btn-ghost text-error">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary">Add Day</button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <Link href="/" className="btn">
          Cancel
        </Link>
        <Link href="/people" className="btn btn-primary">
          Next: Add People
        </Link>
      </div>
    </PageContainer>
  );
}
