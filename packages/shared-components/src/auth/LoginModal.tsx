import { useAppSelector, useAppDispatch, StoreType } from '@packing-list/state';
import { LoginForm } from './LoginForm.js';
import { Modal } from '../Dialog.js';

export function LoginModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(
    (state: StoreType) => state.ui.loginModal.isOpen
  );

  const closeModal = () => {
    dispatch({ type: 'CLOSE_LOGIN_MODAL' });
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Sign In" size="md">
      <LoginForm />
    </Modal>
  );
}
