import { selectSelectedTripId } from '@packing-list/state';
import { PackingList } from './components/PackingList';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import { NoTripSelected } from '../../components/NoTripSelected';
import { useAppSelector } from '@packing-list/state';

export default function PackingListPage() {
  const selectedTripId = useAppSelector(selectSelectedTripId);

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

  return (
    <PageContainer>
      <PackingList />
    </PageContainer>
  );
}
