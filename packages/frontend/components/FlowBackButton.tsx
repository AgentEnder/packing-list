import { ChevronLeft } from 'lucide-react';
import { useAppSelector, useAppDispatch, actions } from '@packing-list/state';
import { Link } from './Link';

export function FlowBackButton() {
  const flow = useAppSelector((s) => s?.ui?.flow);
  const dispatch = useAppDispatch();

  if (flow?.current === null || flow?.current === 0 || !flow?.steps?.length) {
    return null;
  }

  const prevStep = flow.steps[flow.current - 1];
  const handleClick = () => {
    dispatch(actions.advanceFlow(-1));
  };
  return flow && flow.current !== null && flow.current !== 0 ? (
    <Link
      href={prevStep.path}
      className="btn btn-ghost gap-2"
      onClick={handleClick}
      data-testid="flow-back-button"
    >
      <ChevronLeft className="w-4 h-4" />
      {prevStep.label}
    </Link>
  ) : null;
}
