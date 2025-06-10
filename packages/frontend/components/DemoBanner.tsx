import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { XCircle } from 'lucide-react';
import { Banner } from '@packing-list/shared-components';

const SESSION_DEMO_CHOICE_KEY = 'session-demo-choice';

export function DemoBanner() {
  // Check if we have the demo trip loaded by checking its ID
  const tripId = useAppSelector((state) => state.trips.selectedTripId);
  const dispatch = useAppDispatch();
  const isVisible = tripId === 'DEMO_TRIP';

  const handleClearDemo = () => {
    sessionStorage.setItem(SESSION_DEMO_CHOICE_KEY, 'fresh');
    dispatch({ type: 'CLEAR_DEMO_DATA' });
  };

  return (
    <Banner
      id="demo-banner"
      priority={10} // Lower priority (appears at bottom)
      visible={isVisible}
      variant="primary"
    >
      <span className="text-center">You&apos;re currently using demo data</span>
      <button
        onClick={handleClearDemo}
        className="btn btn-xs btn-ghost gap-1 h-6 min-h-0"
      >
        <XCircle className="w-3 h-3" />
        Clear
      </button>
    </Banner>
  );
}
