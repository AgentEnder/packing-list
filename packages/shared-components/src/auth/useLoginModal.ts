import { useAppDispatch } from '@packing-list/state';

export function useLoginModal() {
  const dispatch = useAppDispatch();

  const openLoginModal = () => {
    dispatch({ type: 'OPEN_LOGIN_MODAL' });
  };

  const closeLoginModal = () => {
    dispatch({ type: 'CLOSE_LOGIN_MODAL' });
  };

  return {
    openLoginModal,
    closeLoginModal,
  };
}
