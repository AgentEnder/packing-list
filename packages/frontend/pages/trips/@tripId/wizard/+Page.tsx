import { useEffect } from 'react';
import { actions, useAppDispatch, useAppSelector } from '@packing-list/state';
import { usePageContext } from 'vike-react/usePageContext';
import { navigate } from 'vike/client/router';
import type { TripEvent } from '@packing-list/model';
import { PageContainer } from '../../../../components/PageContainer';
import { PageHeader } from '../../../../components/PageHeader';
import { TripWizard } from '../../../days/TripWizard';
import { useMousePosition } from '@packing-list/shared-utils';

export default function TripWizardPage() {
  const pageContext = usePageContext();
  const { tripId } = pageContext.routeParams as { tripId: string };
  const dispatch = useAppDispatch();
  const tripData = useAppSelector((s) =>
    tripId ? s.trips.byId[tripId] : undefined
  );
  const flow = useAppSelector((s) => s.ui.flow);
  const currentEvents: TripEvent[] = tripData?.trip?.tripEvents || [];
  const { x, y } = useMousePosition();
  // If trip not found, redirect to trips list
  useEffect(() => {
    if (!tripData) {
      navigate('/trips');
    }
  }, [tripData]);

  // Reset wizard when accessing directly (not through flow)
  useEffect(() => {
    if (flow.current === null && tripData) {
      // Accessing wizard directly, reset to first step
      dispatch({ type: 'RESET_WIZARD' });
    }
  }, [flow.current, tripData, dispatch]);

  const handleSave = (events: TripEvent[]) => {
    dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    dispatch(actions.triggerConfettiBurst({ x, y }));

    // Use flow navigation if available, otherwise go to people page
    if (flow.current !== null && flow.current < flow.steps.length - 1) {
      dispatch(actions.advanceFlow());
      const nextStep = flow.steps[flow.current + 1];
      if (nextStep) {
        navigate(nextStep.path);
      } else {
        navigate('/people');
      }
    } else {
      navigate(`/trips/${tripId}`);
    }
  };

  const handleClose = () => {
    navigate('/trips');
  };

  return (
    <PageContainer>
      <PageHeader title="Configure Trip" />
      <div className="max-w-3xl mx-auto">
        <TripWizard
          fullPage
          open={true}
          onClose={handleClose}
          onSave={handleSave}
          currentEvents={currentEvents}
        />
      </div>
    </PageContainer>
  );
}
