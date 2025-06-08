import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { XCircle } from 'lucide-react';

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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-content px-2 py-1.5 sm:p-4 shadow-lg z-[9999] text-xs sm:text-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 max-w-[100vw]">
        <span className="text-center">
          You&apos;re currently using demo data
        </span>
        <button
          onClick={handleClearDemo}
          className="btn btn-xs btn-ghost gap-1 h-6 min-h-0"
        >
          <XCircle className="w-3 h-3" />
          Clear
        </button>
      </div>
    </div>
  );
}
