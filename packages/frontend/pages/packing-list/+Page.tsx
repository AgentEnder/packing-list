import { selectSelectedTripId } from '@packing-list/state';
import { PackingList } from './components/PackingList';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import { NoTripSelected } from '../../components/NoTripSelected';
import { useAppSelector } from '@packing-list/state';
import { usePermissions } from '../../hooks/usePermissions';
import { AlertTriangle } from 'lucide-react';

export default function PackingListPage() {
  const selectedTripId = useAppSelector(selectSelectedTripId);
  const { canView, canEdit } = usePermissions(selectedTripId || undefined);

  // If no trip is selected, show the no trip selected state
  if (!selectedTripId) {
    return (
      <PageContainer>
        <PageHeader title="Packing List" />
        <NoTripSelected
          title="No Trip Selected"
          message="You need to select a trip before you can view your packing list. Each trip has its own customized list based on travelers, duration, and destinations."
          actionText="View My Trips"
          actionHref="/trips"
        />
      </PageContainer>
    );
  }

  // Check permissions
  if (!canView) {
    return (
      <PageContainer>
        <PageHeader title="Packing List" />
        <div className="card bg-base-200 shadow-lg mt-6">
          <div className="card-body text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-warning mb-4" />
            <h2 className="card-title justify-center">Access Denied</h2>
            <p className="text-base-content/70">
              You don't have permission to view this trip's packing list.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PackingList canEdit={canEdit} />
    </PageContainer>
  );
}
