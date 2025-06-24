import { ChevronLeft } from 'lucide-react';
import { useAppSelector, useAppDispatch, actions } from '@packing-list/state';
import { Link } from './Link';
import { navigate } from 'vike/client/router';
import { applyBaseUrl } from '@packing-list/shared-utils';

export function FlowBackButton() {
  const flow = useAppSelector((s) => s?.ui?.flow);
  const dispatch = useAppDispatch();

  if (flow?.current === null || flow?.current === 0 || !flow?.steps?.length) {
    return null;
  }

  const prevStep = flow.steps[flow.current - 1];
  console.log(prevStep.path);
  const handleClick = () => {
    // Calculate the target step before dispatching
    if (!flow.current) {
      return;
    }
    const targetStepIndex = flow.current - 1;
    const targetStep = flow.steps[targetStepIndex];

    // Update flow state first
    dispatch(actions.advanceFlow(-1));

    // Then navigate to the target step
    navigate(
      applyBaseUrl(import.meta.env.PUBLIC_ENV__BASE_URL, targetStep.path)
    );
  };

  return flow && flow.current !== null && flow.current !== 0 ? (
    <Link
      className="btn btn-ghost gap-2"
      href={prevStep.path}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClick();
      }}
      data-testid="flow-back-button"
      style={{ cursor: 'pointer' }}
    >
      <ChevronLeft className="w-4 h-4" />
      {prevStep.label}
    </Link>
  ) : null;
}
