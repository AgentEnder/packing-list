import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { XCircle } from 'lucide-react';

const SESSION_DEMO_CHOICE_KEY = 'session-demo-choice';

export function DemoBanner() {
  // Check if we have the demo trip loaded by checking its ID
  const tripId = useAppSelector((state) => state.trip.id);
  const dispatch = useAppDispatch();
  const isVisible = tripId === 'DEMO_TRIP';

  const handleClearDemo = () => {
    sessionStorage.setItem(SESSION_DEMO_CHOICE_KEY, 'fresh');
    dispatch({ type: 'CLEAR_TRIP_DATA' });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-content p-4 flex items-center justify-center gap-4 shadow-lg z-[9999]">
      <span>You're currently using demo data</span>
      <button onClick={handleClearDemo} className="btn btn-sm btn-ghost gap-2">
        <XCircle className="w-4 h-4" />
        Clear Demo Data
      </button>
    </div>
  );
}
