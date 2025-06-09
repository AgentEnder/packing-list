import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RuleList } from './RuleList';
import type {
  DefaultItemRule,
  LegacyPerson as Person,
  Day,
} from '@packing-list/model';

// Mock the RuleCard component since we're testing RuleList in isolation
vi.mock('./RuleCard', () => ({
  RuleCard: vi.fn(({ rule }) => (
    <div data-testid={`mocked-rule-card-${rule.id}`}>
      Rule Card: {rule.name}
    </div>
  )),
}));

describe('RuleList Component', () => {
  const mockPeople: Person[] = [
    {
      id: 'person1',
      name: 'Alice',
      age: 25,
      gender: 'female',
    },
    {
      id: 'person2',
      name: 'Bob',
      age: 30,
      gender: 'male',
    },
  ];

  const mockDays: Day[] = [
    {
      date: 1705363200000,
      location: 'Paris',
      expectedClimate: 'Mild',
      travel: false,
      items: [],
    },
    {
      date: 1705449600000,
      location: 'London',
      expectedClimate: 'Cool',
      travel: true,
      items: [],
    },
  ];

  const mockRules: DefaultItemRule[] = [
    {
      id: 'rule1',
      name: 'Daily Essentials',
      calculation: {
        baseQuantity: 1,
        perDay: true,
        perPerson: true,
      },
      conditions: [],
      categoryId: 'essentials',
      subcategoryId: 'daily',
    },
    {
      id: 'rule2',
      name: 'Weather Gear',
      calculation: {
        baseQuantity: 2,
        perDay: false,
        perPerson: true,
      },
      conditions: [],
      categoryId: 'clothing',
      subcategoryId: 'outerwear',
    },
  ];

  it('renders the component title', () => {
    render(<RuleList rules={[]} people={mockPeople} days={mockDays} />);

    expect(screen.getByText('Existing Rules')).toBeInTheDocument();
  });

  it('renders rules list container', () => {
    render(<RuleList rules={mockRules} people={mockPeople} days={mockDays} />);

    expect(screen.getByTestId('rules-list')).toBeInTheDocument();
  });

  it('renders rule cards for each rule', () => {
    render(<RuleList rules={mockRules} people={mockPeople} days={mockDays} />);

    // Check that rule items are rendered
    expect(screen.getByTestId('rule-item-rule1')).toBeInTheDocument();
    expect(screen.getByTestId('rule-item-rule2')).toBeInTheDocument();

    // Check that mocked RuleCard components are rendered
    expect(screen.getByTestId('mocked-rule-card-rule1')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-rule-card-rule2')).toBeInTheDocument();

    // Check that rule names are displayed
    expect(screen.getByText('Rule Card: Daily Essentials')).toBeInTheDocument();
    expect(screen.getByText('Rule Card: Weather Gear')).toBeInTheDocument();
  });

  it('displays no rules message when rules array is empty', () => {
    render(<RuleList rules={[]} people={mockPeople} days={mockDays} />);

    expect(screen.getByTestId('no-rules-message')).toBeInTheDocument();
    expect(screen.getByText('No rules added yet')).toBeInTheDocument();
  });

  it('does not display no rules message when rules exist', () => {
    render(<RuleList rules={mockRules} people={mockPeople} days={mockDays} />);

    expect(screen.queryByTestId('no-rules-message')).not.toBeInTheDocument();
    expect(screen.queryByText('No rules added yet')).not.toBeInTheDocument();
  });

  it('handles single rule correctly', () => {
    const singleRule = [mockRules[0]];
    render(<RuleList rules={singleRule} people={mockPeople} days={mockDays} />);

    expect(screen.getByTestId('rule-item-rule1')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-rule-card-rule1')).toBeInTheDocument();
    expect(screen.queryByTestId('rule-item-rule2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('no-rules-message')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<RuleList rules={mockRules} people={mockPeople} days={mockDays} />);

    // Check main container classes
    const mainContainer = screen.getByTestId('rules-list').closest('.card');
    expect(mainContainer).toHaveClass('card', 'bg-base-100', 'shadow-xl');

    // Check rules list classes
    expect(screen.getByTestId('rules-list')).toHaveClass('space-y-4');

    // Check individual rule item classes
    const ruleItem = screen.getByTestId('rule-item-rule1');
    expect(ruleItem).toHaveClass('card', 'bg-base-200');
  });

  it('handles empty people and days arrays', () => {
    render(<RuleList rules={mockRules} people={[]} days={[]} />);

    // Component should still render without issues
    expect(screen.getByText('Existing Rules')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-rule-card-rule1')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-rule-card-rule2')).toBeInTheDocument();
  });
});
