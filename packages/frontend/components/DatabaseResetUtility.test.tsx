import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { DatabaseResetUtility } from './DatabaseResetUtility';
import * as state from '@packing-list/state';
import * as Toast from './Toast';

vi.mock('@packing-list/shared-components', () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onClose }: { isOpen: boolean; onConfirm: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm} data-testid="confirm" />
        <button onClick={onClose} data-testid="cancel" />
      </div>
    ) : null,
}));

vi.mock('./Toast', () => ({ showToast: vi.fn() }));
vi.mock('@packing-list/state', () => ({
  useAppDispatch: vi.fn(),
  resetSyncService: vi.fn(),
}));

describe('DatabaseResetUtility Component', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
  });

  it('opens confirm dialog and handles reset', async () => {
    render(<DatabaseResetUtility />);
    fireEvent.click(screen.getByRole('button', { name: /Reset Database/i }));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('confirm'));
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_ALL_DATA' });
    expect(state.resetSyncService).toHaveBeenCalled();
    expect(Toast.showToast).toHaveBeenCalled();
  });
});