import { actions, useAppDispatch, useAppSelector } from '@packing-list/state';
import { navigate } from 'vike/client/router';
import { useBannerHeight } from '@packing-list/shared-components';
import { applyBaseUrl } from '@packing-list/shared-utils';

export function FlowContinueButton() {
  const bannerOffset = useBannerHeight();
  const flow = useAppSelector((s) => s?.ui?.flow);
  const dispatch = useAppDispatch();

  const handleContinue = () => {
    if (flow?.current !== null) {
      dispatch(actions.advanceFlow(1));
      const next = flow.steps[flow.current + 1];
      if (next)
        navigate(applyBaseUrl(import.meta.env.PUBLIC_ENV__BASE_URL, next.path));
    }
  };

  if (flow?.current !== null && flow?.current < flow?.steps?.length - 1) {
    return (
      <button
        style={{
          transform: `translateY(-${bannerOffset}px)`,
        }}
        className="btn btn-primary fixed bottom-6 right-6 z-[150]"
        data-testid="flow-continue-button"
        onClick={handleContinue}
      >
        Continue
      </button>
    );
  }

  return null;
}
