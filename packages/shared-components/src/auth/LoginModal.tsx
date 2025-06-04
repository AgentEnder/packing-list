import { useAppSelector, useAppDispatch, StoreType } from '@packing-list/state';
import { LoginForm } from './LoginForm.js';

export function LoginModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(
    (state: StoreType) => state.ui.loginModal.isOpen
  );

  const closeModal = () => {
    dispatch({ type: 'CLOSE_LOGIN_MODAL' });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Sign In</h3>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={closeModal}
          >
            ✕
          </button>
        </div>
        <LoginForm />
        <div className="modal-action">
          <button className="btn" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={closeModal}>
        <button>close</button>
      </form>
    </div>
  );
}
