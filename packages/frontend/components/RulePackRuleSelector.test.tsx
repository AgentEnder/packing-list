import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { RulePackRuleSelector } from './RulePackRuleSelector';
import * as state from '@packing-list/state';
import type { DefaultItemRule, RulePack } from '@packing-list/model';

// Mock the state modules
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  selectDefaultItemRules: vi.fn(),
}));

describe('RulePackRuleSelector Component', () => {
  const mockOnRulesChange = vi.fn();

  const mockRules: DefaultItemRule[] = [
    {
      id: 'rule1',
      name: 'Beach Towel',
      calculation: { baseQuantity: 1, perDay: false, perPerson: true },
      categoryId: 'beach',
      notes: 'Essential for beach trips',
      packIds: [{ packId: 'pack1', ruleId: 'rule1' }],
      originalRuleId: 'rule1',
    },
    {
      id: 'rule2',
      name: 'Sunscreen',
      calculation: { baseQuantity: 1, perDay: false, perPerson: false },
      categoryId: 'beach',
      packIds: [
        { packId: 'pack1', ruleId: 'rule2' },
        { packId: 'pack2', ruleId: 'rule2' },
      ],
      originalRuleId: 'rule2',
    },
    {
      id: 'rule3',
      name: 'Winter Coat',
      calculation: { baseQuantity: 1, perDay: false, perPerson: true },
      categoryId: 'clothing',
      notes: 'For cold weather',
      packIds: [{ packId: 'pack3', ruleId: 'rule3' }],
      originalRuleId: 'rule3',
    },
    {
      id: 'rule4',
      name: 'Passport',
      calculation: { baseQuantity: 1, perDay: false, perPerson: false },
      categoryId: 'documents',
      originalRuleId: 'rule4',
    },
  ];

  const mockRulePacks: RulePack[] = [
    {
      id: 'pack1',
      name: 'Beach Essentials',
      description: 'Beach trip items',
      rules: [],
      author: { id: 'user1', name: 'Beach Expert' },
      metadata: {
        created: '2023-01-01T00:00:00Z',
        modified: '2023-01-01T00:00:00Z',
        isBuiltIn: false,
        isShared: true,
        visibility: 'public',
        tags: ['beach'],
        category: 'Travel',
        version: '1.0.0',
      },
      stats: { usageCount: 10, rating: 4.5, reviewCount: 2 },
      color: '#FFB74D',
      icon: 'Sun',
    },
    {
      id: 'pack2',
      name: 'Summer Vacation',
      description: 'Summer items',
      rules: [],
      author: { id: 'user2', name: 'Travel Pro' },
      metadata: {
        created: '2023-01-01T00:00:00Z',
        modified: '2023-01-01T00:00:00Z',
        isBuiltIn: false,
        isShared: true,
        visibility: 'public',
        tags: ['summer'],
        category: 'Travel',
        version: '1.0.0',
      },
      stats: { usageCount: 5, rating: 4.0, reviewCount: 1 },
      color: '#4CAF50',
      icon: 'Plane',
    },
    {
      id: 'pack3',
      name: 'Winter Gear',
      description: 'Cold weather items',
      rules: [],
      author: { id: 'user3', name: 'Winter Expert' },
      metadata: {
        created: '2023-01-01T00:00:00Z',
        modified: '2023-01-01T00:00:00Z',
        isBuiltIn: false,
        isShared: true,
        visibility: 'public',
        tags: ['winter'],
        category: 'Travel',
        version: '1.0.0',
      },
      stats: { usageCount: 8, rating: 4.2, reviewCount: 3 },
      color: '#2196F3',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: typeof state.selectDefaultItemRules) => {
        if (selector === state.selectDefaultItemRules) {
          return mockRules;
        }
        // For rulePacks selector
        return mockRulePacks;
      }
    );
  });

  it('renders with empty selected rules', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    expect(screen.getByTestId('rule-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('selected-rules-count')).toHaveTextContent(
      '0 selected'
    );
    expect(screen.getByPlaceholderText('Search rules...')).toBeInTheDocument();
  });

  it('renders all available rules', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    expect(screen.getByTestId('rule-Beach Towel')).toBeInTheDocument();
    expect(screen.getByTestId('rule-Sunscreen')).toBeInTheDocument();
    expect(screen.getByTestId('rule-Winter Coat')).toBeInTheDocument();
    expect(screen.getByTestId('rule-Passport')).toBeInTheDocument();
  });

  it('displays selected rules count correctly', () => {
    const selectedRules = [mockRules[0], mockRules[1]];
    render(
      <RulePackRuleSelector
        selectedRules={selectedRules}
        onRulesChange={mockOnRulesChange}
      />
    );

    expect(screen.getByTestId('selected-rules-count')).toHaveTextContent(
      '2 selected'
    );
  });

  it('highlights selected rules with border', () => {
    const selectedRules = [mockRules[0]];
    render(
      <RulePackRuleSelector
        selectedRules={selectedRules}
        onRulesChange={mockOnRulesChange}
      />
    );

    const selectedRule = screen.getByTestId('rule-Beach Towel');
    expect(selectedRule).toHaveClass('border-2', 'border-primary');

    const unselectedRule = screen.getByTestId('rule-Sunscreen');
    expect(unselectedRule).toHaveClass('border', 'border-base-300');
  });

  it('shows correct button states for selected and unselected rules', () => {
    const selectedRules = [mockRules[0]];
    render(
      <RulePackRuleSelector
        selectedRules={selectedRules}
        onRulesChange={mockOnRulesChange}
      />
    );

    const removeButton = screen.getByTestId('remove-rule-Beach Towel-button');
    expect(removeButton).toHaveClass('btn-error');

    const addButton = screen.getByTestId('add-rule-Sunscreen-button');
    expect(addButton).toHaveClass('btn-primary');
  });

  it('calls onRulesChange when adding a rule', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const addButton = screen.getByTestId('add-rule-Beach Towel-button');
    fireEvent.click(addButton);

    expect(mockOnRulesChange).toHaveBeenCalledWith([
      {
        ...mockRules[0],
        id: expect.any(String),
      },
    ]);
  });

  it('calls onRulesChange when removing a rule', () => {
    const selectedRules = [mockRules[0], mockRules[1]];
    render(
      <RulePackRuleSelector
        selectedRules={selectedRules}
        onRulesChange={mockOnRulesChange}
      />
    );

    const removeButton = screen.getByTestId('remove-rule-Beach Towel-button');
    fireEvent.click(removeButton);

    expect(mockOnRulesChange).toHaveBeenCalledWith([mockRules[1]]);
  });

  it('calls onRulesChange when clicking on rule card', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const ruleCard = screen.getByTestId('rule-Beach Towel');
    fireEvent.click(ruleCard);

    expect(mockOnRulesChange).toHaveBeenCalledWith([
      {
        ...mockRules[0],
        id: expect.any(String),
      },
    ]);
  });

  it('prevents event bubbling when clicking button directly', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const addButton = screen.getByTestId('add-rule-Beach Towel-button');
    fireEvent.click(addButton);

    // Should only be called once (from button click, not card click)
    expect(mockOnRulesChange).toHaveBeenCalledTimes(1);
  });

  it('filters rules based on search term', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const searchInput = screen.getByTestId('rule-search-input');
    fireEvent.change(searchInput, { target: { value: 'beach' } });

    expect(screen.getByTestId('rule-Beach Towel')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-Winter Coat')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-Passport')).not.toBeInTheDocument();
  });

  it('filters rules case-insensitively', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const searchInput = screen.getByTestId('rule-search-input');
    fireEvent.change(searchInput, { target: { value: 'WINTER' } });

    expect(screen.getByTestId('rule-Winter Coat')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-Beach Towel')).not.toBeInTheDocument();
  });

  it('shows no rules when search term matches nothing', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const searchInput = screen.getByTestId('rule-search-input');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.queryByTestId('rule-Beach Towel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-Sunscreen')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-Winter Coat')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rule-Passport')).not.toBeInTheDocument();
  });

  it('displays rule notes when available', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    expect(screen.getByText('Essential for beach trips')).toBeInTheDocument();
    expect(screen.getByText('For cold weather')).toBeInTheDocument();
  });

  it('does not display notes section when rule has no notes', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const sunscreenRule = screen.getByTestId('rule-Sunscreen');
    expect(sunscreenRule).not.toHaveTextContent('Essential for beach trips');
  });

  it('displays category badges for rules', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    expect(screen.getAllByText('beach')).toHaveLength(2); // Beach Towel and Sunscreen
    expect(screen.getByText('clothing')).toBeInTheDocument();
    expect(screen.getByText('documents')).toBeInTheDocument();
  });

  it('displays pack badges for rules with pack associations', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    expect(screen.getAllByText('Beach Essentials')).toHaveLength(2); // Beach Towel and Sunscreen
    expect(screen.getByText('Summer Vacation')).toBeInTheDocument();
    expect(screen.getByText('Winter Gear')).toBeInTheDocument();
  });

  it('applies pack colors to pack badges', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const beachBadges = screen.getAllByText('Beach Essentials');
    beachBadges.forEach((badge) => {
      const badgeElement = badge.closest('span');
      expect(badgeElement).toHaveStyle('background-color: #FFB74D');
    });

    const summerBadge = screen.getByText('Summer Vacation').closest('span');
    expect(summerBadge).toHaveStyle('background-color: #4CAF50');

    const winterBadge = screen.getByText('Winter Gear').closest('span');
    expect(winterBadge).toHaveStyle('background-color: #2196F3');
  });

  it('does not display pack badges for rules without pack associations', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const passportRule = screen.getByTestId('rule-Passport');
    expect(passportRule).not.toHaveTextContent('Beach Essentials');
    expect(passportRule).not.toHaveTextContent('Summer Vacation');
    expect(passportRule).not.toHaveTextContent('Winter Gear');
  });

  it('handles rules with multiple pack associations', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    const sunscreenRule = screen.getByTestId('rule-Sunscreen');
    expect(sunscreenRule).toHaveTextContent('Beach Essentials');
    expect(sunscreenRule).toHaveTextContent('Summer Vacation');
  });

  it('handles pack badges when pack has icon', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    // Icons should render without throwing errors
    expect(screen.getAllByText('Beach Essentials').length).toBeGreaterThan(0);
    expect(screen.getByText('Summer Vacation')).toBeInTheDocument();
  });

  it('handles pack badges when pack has no icon', () => {
    render(
      <RulePackRuleSelector
        selectedRules={[]}
        onRulesChange={mockOnRulesChange}
      />
    );

    // Winter Gear pack has no icon defined
    expect(screen.getByText('Winter Gear')).toBeInTheDocument();
  });
});
