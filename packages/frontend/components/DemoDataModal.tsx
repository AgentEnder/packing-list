import { useEffect, useState } from 'react';
import { useAppDispatch } from '@packing-list/state';

const HAS_SEEN_DEMO_KEY = 'has-seen-demo';
const SESSION_DEMO_CHOICE_KEY = 'session-demo-choice';

export function DemoDataModal() {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has made a choice this session
    const sessionChoice = sessionStorage.getItem(SESSION_DEMO_CHOICE_KEY);
    if (sessionChoice === 'demo') {
      // If they chose demo data this session, load it
      dispatch({ type: 'LOAD_DEMO_DATA' });
      return;
    }

    // If they haven't made a choice this session, check if they've ever seen the demo
    const hasSeenDemo = localStorage.getItem(HAS_SEEN_DEMO_KEY);
    if (!hasSeenDemo) {
      // First time visitor, show the modal
      setIsOpen(true);
      localStorage.setItem(HAS_SEEN_DEMO_KEY, 'true');
    } else {
      // Returning visitor in a new session, show modal again
      const sessionChoice = sessionStorage.getItem(SESSION_DEMO_CHOICE_KEY);
      if (!sessionChoice) {
        setIsOpen(true);
      }
    }
  }, [dispatch]);

  const handleLoadDemo = () => {
    dispatch({ type: 'LOAD_DEMO_DATA' });
    sessionStorage.setItem(SESSION_DEMO_CHOICE_KEY, 'demo');
    setIsOpen(false);
  };

  const handleStartFresh = () => {
    sessionStorage.setItem(SESSION_DEMO_CHOICE_KEY, 'fresh');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Welcome to Smart Packing List!</h3>
        <p className="py-4">
          Would you like to start with a demo trip to see how everything works,
          or would you prefer to start fresh with your own trip?
        </p>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={handleLoadDemo}>
            Load Demo Trip
          </button>
          <button className="btn" onClick={handleStartFresh}>
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
