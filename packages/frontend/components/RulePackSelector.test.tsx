import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RulePackSelector } from './RulePackSelector';
import * as state from '@packing-list/state';
import * as Toast from './Toast';
import type { StoreType } from '@packing-list/state';
import type { Mock } from 'vitest';

// Mock the state and Toast modules
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

vi.mock('./Toast', () => ({
  showToast: vi.fn(),
}));

describe('RulePackSelector Component', () => {
  const mockDispatch = vi.fn();
  const mockOnRulesApplied = vi.fn();

  const mockRulePacks = [
    {
      id: '1',
      name: 'Beach Pack',
      description: 'Essential items for beach trips',
      rules: [{ id: 'beach1' }, { id: 'beach2' }],
    },
    {
      id: '2',
      name: 'Camping Pack',
      description: 'Must-have items for camping',
      rules: [{ id: 'camp1' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: (state: StoreType) => unknown) => {
        // Mock the store state
        const mockState = {
          rulePacks: mockRulePacks,
          defaultItemRules: [{ id: 'beach1' }],
        } as StoreType;
        return selector(mockState);
      }
    );
  });

  it('renders all rule packs', () => {
    render(<RulePackSelector />);

    expect(screen.getByText('Beach Pack')).toBeInTheDocument();
    expect(screen.getByText('Camping Pack')).toBeInTheDocument();
    expect(
      screen.getByText('Essential items for beach trips')
    ).toBeInTheDocument();
    expect(screen.getByText('Must-have items for camping')).toBeInTheDocument();
  });

  it('shows active state for packs with active rules', () => {
    render(<RulePackSelector />);

    const beachCard = screen.getByText('Beach Pack').closest('.card');
    const campingCard = screen.getByText('Camping Pack').closest('.card');

    expect(beachCard).toHaveClass('border-primary');
    expect(campingCard).not.toHaveClass('border-primary');
  });

  it('handles adding rules', () => {
    render(<RulePackSelector onRulesApplied={mockOnRulesApplied} />);

    const addButton = screen.getByText('Add Rules');
    fireEvent.click(addButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePacks[1],
      active: true,
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Added "Camping Pack" rules');
    expect(mockOnRulesApplied).toHaveBeenCalled();
  });

  it('handles removing rules', () => {
    render(<RulePackSelector onRulesApplied={mockOnRulesApplied} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePacks[0],
      active: false,
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Removed "Beach Pack" rules');
    expect(mockOnRulesApplied).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<RulePackSelector className="custom-class" />);

    const container = screen.getByText('Rule Packs').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('renders check icon for active packs', () => {
    render(<RulePackSelector />);

    const activePackTitle = screen.getByText('Beach Pack').parentElement;
    const inactivePackTitle = screen.getByText('Camping Pack').parentElement;

    expect(activePackTitle?.querySelector('.lucide-check')).toBeInTheDocument();
    expect(
      inactivePackTitle?.querySelector('.lucide-check')
    ).not.toBeInTheDocument();
  });

  it('renders correct button styles based on pack state', () => {
    render(<RulePackSelector />);

    const removeButton = screen.getByText('Remove');
    const addButton = screen.getByText('Add Rules');

    expect(removeButton).toHaveClass('btn-outline', 'btn-error');
    expect(addButton).toHaveClass('btn-primary');
  });
});
