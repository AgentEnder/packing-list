import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConditionsList } from './ConditionsList';
import type { Condition } from '@packing-list/model';

// Mock the ConditionForm component since we're testing ConditionsList in isolation
vi.mock('./ConditionForm', () => ({
  ConditionForm: vi.fn(
    ({ onSave, onCancel, initialCondition, isEditing, testIdPrefix }) => (
      <div data-testid={`${testIdPrefix}condition-form`}>
        <div data-testid="form-editing-status">
          {isEditing ? 'editing' : 'creating'}
        </div>
        <div data-testid="form-initial-condition">
          {JSON.stringify(initialCondition)}
        </div>
        <button
          onClick={() => onSave(initialCondition)}
          data-testid={`${testIdPrefix}save-condition-button`}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          data-testid={`${testIdPrefix}cancel-condition-button`}
        >
          Cancel
        </button>
      </div>
    )
  ),
}));

describe('ConditionsList Component', () => {
  const defaultProps = {
    conditions: [],
    onConditionsChange: vi.fn(),
  };

  const mockConditions: Condition[] = [
    {
      type: 'person',
      field: 'age',
      operator: '==',
      value: 25,
    },
    {
      type: 'day',
      field: 'location',
      operator: '>=',
      value: 'Paris',
      notes: 'Exclude Paris days',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conditions label', () => {
    render(<ConditionsList {...defaultProps} />);

    expect(screen.getByText('Conditions')).toBeInTheDocument();
  });

  it('renders add condition button when not showing condition form', () => {
    render(<ConditionsList {...defaultProps} />);

    expect(screen.getByTestId('add-condition-button')).toBeInTheDocument();
    expect(screen.getByText('Add Condition')).toBeInTheDocument();
  });

  it('applies test id prefix to add button', () => {
    render(<ConditionsList {...defaultProps} testIdPrefix="test-" />);

    expect(screen.getByTestId('test-add-condition-button')).toBeInTheDocument();
  });

  it('renders existing conditions correctly', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    // Check for condition elements
    expect(screen.getByTestId('condition-0')).toBeInTheDocument();
    expect(screen.getByTestId('condition-1')).toBeInTheDocument();

    // Check condition content
    expect(screen.getByText('👤 age == 25')).toBeInTheDocument();
    expect(screen.getByText('📅 location >= Paris')).toBeInTheDocument();
  });

  it('applies test id prefix to condition elements', () => {
    render(
      <ConditionsList
        {...defaultProps}
        conditions={mockConditions}
        testIdPrefix="test-"
      />
    );

    expect(screen.getByTestId('test-condition-0')).toBeInTheDocument();
    expect(screen.getByTestId('test-condition-1')).toBeInTheDocument();
  });

  it('renders edit and remove buttons for each condition', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    // Check edit buttons
    expect(screen.getByTestId('edit-condition-0-button')).toBeInTheDocument();
    expect(screen.getByTestId('edit-condition-1-button')).toBeInTheDocument();

    // Check remove buttons
    expect(screen.getByTestId('remove-condition-0-button')).toBeInTheDocument();
    expect(screen.getByTestId('remove-condition-1-button')).toBeInTheDocument();
  });

  it('applies test id prefix to action buttons', () => {
    render(
      <ConditionsList
        {...defaultProps}
        conditions={mockConditions}
        testIdPrefix="test-"
      />
    );

    expect(
      screen.getByTestId('test-edit-condition-0-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('test-remove-condition-0-button')
    ).toBeInTheDocument();
  });

  it('shows condition form when add condition button is clicked', () => {
    render(<ConditionsList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-condition-button'));

    expect(screen.getByTestId('condition-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-editing-status')).toHaveTextContent(
      'creating'
    );
  });

  it('hides add condition button when showing condition form', () => {
    render(<ConditionsList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-condition-button'));

    expect(
      screen.queryByTestId('add-condition-button')
    ).not.toBeInTheDocument();
  });

  it('shows condition form with correct initial condition when editing', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    fireEvent.click(screen.getByTestId('edit-condition-0-button'));

    expect(screen.getByTestId('condition-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-editing-status')).toHaveTextContent(
      'editing'
    );

    const initialCondition = JSON.parse(
      screen.getByTestId('form-initial-condition').textContent || '{}'
    );
    expect(initialCondition).toEqual(mockConditions[0]);
  });

  it('removes condition when remove button is clicked', () => {
    const onConditionsChange = vi.fn();
    render(
      <ConditionsList
        {...defaultProps}
        conditions={mockConditions}
        onConditionsChange={onConditionsChange}
      />
    );

    fireEvent.click(screen.getByTestId('remove-condition-0-button'));

    expect(onConditionsChange).toHaveBeenCalledWith([mockConditions[1]]);
  });

  it('removes correct condition when multiple conditions exist', () => {
    const onConditionsChange = vi.fn();
    render(
      <ConditionsList
        {...defaultProps}
        conditions={mockConditions}
        onConditionsChange={onConditionsChange}
      />
    );

    fireEvent.click(screen.getByTestId('remove-condition-1-button'));

    expect(onConditionsChange).toHaveBeenCalledWith([mockConditions[0]]);
  });

  it('adds new condition when save is clicked in add mode', () => {
    const onConditionsChange = vi.fn();
    render(
      <ConditionsList
        {...defaultProps}
        onConditionsChange={onConditionsChange}
      />
    );

    // Open form
    fireEvent.click(screen.getByTestId('add-condition-button'));

    // Save condition
    fireEvent.click(screen.getByTestId('save-condition-button'));

    expect(onConditionsChange).toHaveBeenCalledWith([
      {
        type: 'person',
        field: 'age',
        operator: '==',
        value: 0,
      },
    ]);
  });

  it('updates existing condition when save is clicked in edit mode', () => {
    const onConditionsChange = vi.fn();
    render(
      <ConditionsList
        {...defaultProps}
        conditions={mockConditions}
        onConditionsChange={onConditionsChange}
      />
    );

    // Edit first condition
    fireEvent.click(screen.getByTestId('edit-condition-0-button'));

    // Save condition (mocked to save the initial condition)
    fireEvent.click(screen.getByTestId('save-condition-button'));

    expect(onConditionsChange).toHaveBeenCalledWith([
      mockConditions[0], // Should be the same since we're using initialCondition
      mockConditions[1],
    ]);
  });

  it('hides condition form when cancel is clicked', () => {
    render(<ConditionsList {...defaultProps} />);

    // Open form
    fireEvent.click(screen.getByTestId('add-condition-button'));
    expect(screen.getByTestId('condition-form')).toBeInTheDocument();

    // Cancel form
    fireEvent.click(screen.getByTestId('cancel-condition-button'));
    expect(screen.queryByTestId('condition-form')).not.toBeInTheDocument();
  });

  it('shows add button again after canceling form', () => {
    render(<ConditionsList {...defaultProps} />);

    // Open form
    fireEvent.click(screen.getByTestId('add-condition-button'));
    expect(
      screen.queryByTestId('add-condition-button')
    ).not.toBeInTheDocument();

    // Cancel form
    fireEvent.click(screen.getByTestId('cancel-condition-button'));
    expect(screen.getByTestId('add-condition-button')).toBeInTheDocument();
  });

  it('hides condition form after saving new condition', () => {
    render(<ConditionsList {...defaultProps} onConditionsChange={vi.fn()} />);

    // Open form
    fireEvent.click(screen.getByTestId('add-condition-button'));
    expect(screen.getByTestId('condition-form')).toBeInTheDocument();

    // Save condition
    fireEvent.click(screen.getByTestId('save-condition-button'));
    expect(screen.queryByTestId('condition-form')).not.toBeInTheDocument();
  });

  it('shows add button again after saving new condition', () => {
    render(<ConditionsList {...defaultProps} onConditionsChange={vi.fn()} />);

    // Open form
    fireEvent.click(screen.getByTestId('add-condition-button'));
    expect(
      screen.queryByTestId('add-condition-button')
    ).not.toBeInTheDocument();

    // Save condition
    fireEvent.click(screen.getByTestId('save-condition-button'));
    expect(screen.getByTestId('add-condition-button')).toBeInTheDocument();
  });

  it('handles empty conditions array', () => {
    render(<ConditionsList {...defaultProps} conditions={[]} />);

    expect(screen.queryByTestId('condition-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-condition-button')).toBeInTheDocument();
  });

  it('handles undefined conditions', () => {
    render(<ConditionsList {...defaultProps} conditions={undefined} />);

    expect(screen.queryByTestId('condition-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-condition-button')).toBeInTheDocument();
  });

  it('displays tooltip for conditions with notes', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    const conditionWithNotes = screen
      .getByText('📅 location >= Paris')
      .closest('.badge');
    expect(conditionWithNotes).toHaveClass('tooltip', 'tooltip-right');
    expect(conditionWithNotes).toHaveAttribute(
      'data-tip',
      'Exclude Paris days'
    );
  });

  it('does not add tooltip class for conditions without notes', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    const conditionWithoutNotes = screen
      .getByText('👤 age == 25')
      .closest('.badge');
    expect(conditionWithoutNotes).not.toHaveClass('tooltip');
  });

  it('renders person icon for person type conditions', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    expect(screen.getByText('👤 age == 25')).toBeInTheDocument();
  });

  it('renders day icon for day type conditions', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    expect(screen.getByText('📅 location >= Paris')).toBeInTheDocument();
  });

  it('applies correct CSS classes to action buttons', () => {
    render(<ConditionsList {...defaultProps} conditions={mockConditions} />);

    const editButton = screen.getByTestId('edit-condition-0-button');
    expect(editButton).toHaveClass('btn', 'btn-ghost', 'btn-xs');

    const removeButton = screen.getByTestId('remove-condition-0-button');
    expect(removeButton).toHaveClass(
      'btn',
      'btn-ghost',
      'btn-xs',
      'text-error'
    );
  });
});
