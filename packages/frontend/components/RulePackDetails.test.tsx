import { render, screen, fireEvent } from '@testing-library/react';
import { format } from 'date-fns';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { RulePackDetails } from './RulePackDetails';
import * as state from '@packing-list/state';
import * as Toast from './Toast';
import type { RulePack, DefaultItemRule } from '@packing-list/model';

// Mock the state and Toast modules
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  selectDefaultItemRules: vi.fn(),
}));

vi.mock('./Toast', () => ({
  showToast: vi.fn(),
}));

describe('RulePackDetails Component', () => {
  const mockDispatch = vi.fn();

  const mockRules: DefaultItemRule[] = [
    {
      id: 'rule1',
      name: 'Beach Towel',
      calculation: { baseQuantity: 1, perDay: false, perPerson: true },
      categoryId: 'beach',
      notes: 'Essential for beach trips',
      packIds: ['pack1'],
    },
    {
      id: 'rule2',
      name: 'Sunscreen',
      calculation: { baseQuantity: 1, perDay: false, perPerson: false },
      categoryId: 'beach',
      packIds: ['pack1'],
    },
  ];

  const mockRulePack: RulePack = {
    id: 'pack1',
    name: 'Beach Essentials',
    description: 'Everything you need for a perfect beach day',
    rules: [
      {
        id: 'rule1',
        name: 'Beach Towel',
        calculation: { baseQuantity: 1, perDay: false, perPerson: true },
      },
      {
        id: 'rule2',
        name: 'Sunscreen',
        calculation: { baseQuantity: 1, perDay: false, perPerson: false },
      },
    ],
    author: { id: 'author1', name: 'Beach Expert' },
    metadata: {
      created: '2023-01-01T00:00:00Z',
      modified: '2023-01-01T00:00:00Z',
      isBuiltIn: false,
      isShared: true,
      visibility: 'public' as const,
      tags: ['beach', 'summer'],
      category: 'Travel',
      version: '1.0.0',
    },
    stats: {
      usageCount: 150,
      rating: 4.5,
      reviewCount: 23,
    },
    color: '#FFB74D',
    icon: 'Sun',
  };

  const mockBuiltInPack: RulePack = {
    ...mockRulePack,
    id: 'builtin-pack',
    name: 'Built-in Pack',
    metadata: {
      ...mockRulePack.metadata,
      isBuiltIn: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: typeof state.selectDefaultItemRules) => {
        if (selector === state.selectDefaultItemRules) {
          return mockRules;
        }
        return mockRules;
      }
    );
  });

  it('renders pack details correctly', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    expect(screen.getByTestId('rule-pack-details')).toBeInTheDocument();
    expect(screen.getByText('Beach Essentials')).toBeInTheDocument();
    expect(
      screen.getByText('Everything you need for a perfect beach day')
    ).toBeInTheDocument();
  });

  it('displays pack statistics correctly', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    expect(screen.getByTestId('pack-rating')).toHaveTextContent('4.5');
    expect(screen.getByTestId('pack-review-count')).toHaveTextContent(
      '23 reviews'
    );
    expect(screen.getByTestId('pack-usage-count')).toHaveTextContent('150');
  });

  it('displays pack metadata correctly', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    const expected = format(new Date('2023-01-01T00:00:00Z'), 'MMM d, yyyy');
    expect(screen.getByTestId('pack-created-date')).toHaveTextContent(expected);
    expect(screen.getByTestId('pack-category')).toHaveTextContent('Travel');
  });

  it('shows add pack button when pack is not active', () => {
    // Mock rules without this pack
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: typeof state.selectDefaultItemRules) => {
        if (selector === state.selectDefaultItemRules) {
          return [];
        }
        return [];
      }
    );

    render(<RulePackDetails pack={mockRulePack} />);

    const addButton = screen.getByTestId('apply-pack-Beach Essentials-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent('Add Pack');
    expect(addButton).toHaveClass('btn-primary');
  });

  it('shows remove pack button when pack is active', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    const removeButton = screen.getByTestId(
      'remove-pack-Beach Essentials-button'
    );
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent('Remove Pack');
    expect(removeButton).toHaveClass('btn-error');
  });

  it('handles add pack action', () => {
    // Mock rules without this pack
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: typeof state.selectDefaultItemRules) => {
        if (selector === state.selectDefaultItemRules) {
          return [];
        }
        return [];
      }
    );

    render(<RulePackDetails pack={mockRulePack} />);

    const addButton = screen.getByTestId('apply-pack-Beach Essentials-button');
    fireEvent.click(addButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePack,
      active: true,
    });
    expect(Toast.showToast).toHaveBeenCalledWith(
      'Added "Beach Essentials" rules'
    );
  });

  it('handles remove pack action', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    const removeButton = screen.getByTestId(
      'remove-pack-Beach Essentials-button'
    );
    fireEvent.click(removeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePack,
      active: false,
    });
    expect(Toast.showToast).toHaveBeenCalledWith(
      'Removed "Beach Essentials" rules'
    );
  });

  it('shows edit button for non-built-in packs', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    const editButton = screen.getByTestId('edit-pack-Beach Essentials-button');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('Edit Pack');
  });

  it('hides edit button for built-in packs', () => {
    render(<RulePackDetails pack={mockBuiltInPack} />);

    expect(
      screen.queryByTestId('edit-pack-Built-in Pack-button')
    ).not.toBeInTheDocument();
  });

  it('handles edit pack action', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    const editButton = screen.getByTestId('edit-pack-Beach Essentials-button');
    fireEvent.click(editButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'manage', packId: 'pack1' },
    });
  });

  it('renders pack rules list', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    expect(screen.getByTestId('pack-rules-list')).toBeInTheDocument();
    expect(screen.getByTestId('pack-rule-Beach Towel')).toBeInTheDocument();
    expect(screen.getByTestId('pack-rule-Sunscreen')).toBeInTheDocument();
  });

  it('displays rule details correctly', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    const beachTowelRule = screen.getByTestId('pack-rule-Beach Towel');
    expect(beachTowelRule).toHaveTextContent('Beach Towel');
    expect(beachTowelRule).toHaveTextContent('Essential for beach trips');
    expect(beachTowelRule).toHaveTextContent('beach');

    const sunscreenRule = screen.getByTestId('pack-rule-Sunscreen');
    expect(sunscreenRule).toHaveTextContent('Sunscreen');
    expect(sunscreenRule).not.toHaveTextContent('Essential for beach trips'); // No notes
  });

  it('renders pack icon when provided', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    // Just verify the component renders without crashing when icon is provided
    expect(screen.getByText('Beach Essentials')).toBeInTheDocument();
  });

  it('handles pack without icon gracefully', () => {
    const packWithoutIcon = { ...mockRulePack, icon: undefined };
    render(<RulePackDetails pack={packWithoutIcon} />);

    expect(screen.getByText('Beach Essentials')).toBeInTheDocument();
    // Should not crash and should still render the pack name
  });

  it('handles rules that are not found in allRules', () => {
    const packWithMissingRule: RulePack = {
      ...mockRulePack,
      rules: [
        {
          id: 'rule1',
          name: 'Beach Towel',
          calculation: { baseQuantity: 1, perDay: false, perPerson: true },
        },
        {
          id: 'missing-rule',
          name: 'Missing Rule',
          calculation: { baseQuantity: 1, perDay: false, perPerson: false },
        },
      ],
    };

    render(<RulePackDetails pack={packWithMissingRule} />);

    // Should only render the rule that exists
    expect(screen.getByTestId('pack-rule-Beach Towel')).toBeInTheDocument();
    expect(
      screen.queryByTestId('pack-rule-Missing Rule')
    ).not.toBeInTheDocument();
  });

  it('displays all required UI elements', () => {
    render(<RulePackDetails pack={mockRulePack} />);

    // Check for all major sections
    expect(screen.getByText('Pack Details')).toBeInTheDocument();
    expect(screen.getByText('Pack Rules')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });
});
