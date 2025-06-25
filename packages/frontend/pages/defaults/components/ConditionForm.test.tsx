import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ConditionForm } from './ConditionForm';

// Mock Redux store and selectors
const mockPeople = [
  { id: '1', name: 'John', tripId: 'trip1' },
  { id: '2', name: 'Jane', tripId: 'trip1' },
];

vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(() => mockPeople),
  selectPeople: vi.fn(),
}));

describe('ConditionForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render person name field option', () => {
    render(
      <ConditionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={false}
        testIdPrefix="test-"
      />
    );

    // Check that name is available as a field option for person conditions
    const fieldSelect = screen.getByTestId('test-condition-field-select');
    expect(fieldSelect).toHaveValue('age'); // default

    fireEvent.change(fieldSelect, { target: { value: 'name' } });
    expect(fieldSelect).toHaveValue('name');
  });

  test('should show checkboxes for people when name field is selected', () => {
    render(
      <ConditionForm
        initialCondition={{
          type: 'person',
          field: 'name',
          operator: 'in',
          value: [],
        }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={false}
        testIdPrefix="test-"
      />
    );

    expect(
      screen.getByText('Select people who need this item:')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('test-condition-name-checkbox-1')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('test-condition-name-checkbox-2')
    ).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  test('should only show "includes any of" operator for name field', () => {
    render(
      <ConditionForm
        initialCondition={{
          type: 'person',
          field: 'name',
          operator: 'in',
          value: [],
        }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={false}
        testIdPrefix="test-"
      />
    );

    const operatorSelect = screen.getByTestId('test-condition-operator-select');
    const options = Array.from(operatorSelect.querySelectorAll('option'));

    expect(options).toHaveLength(1);
    expect(options[0]).toHaveValue('in');
    expect(options[0]).toHaveTextContent('includes any of');
    expect(operatorSelect).toBeDisabled();
  });

  test('should handle selecting and deselecting people', () => {
    render(
      <ConditionForm
        initialCondition={{
          type: 'person',
          field: 'name',
          operator: 'in',
          value: ['John'],
        }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={false}
        testIdPrefix="test-"
      />
    );

    const johnCheckbox = screen.getByTestId('test-condition-name-checkbox-1');
    const janeCheckbox = screen.getByTestId('test-condition-name-checkbox-2');

    expect(johnCheckbox).toBeChecked();
    expect(janeCheckbox).not.toBeChecked();

    // Select Jane
    fireEvent.click(janeCheckbox);
    // Deselect John
    fireEvent.click(johnCheckbox);

    const saveButton = screen.getByTestId('test-condition-save-button');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      type: 'person',
      field: 'name',
      operator: 'in',
      value: ['Jane'],
    });
  });

  test('should switch to name field correctly when changing field type', () => {
    render(
      <ConditionForm
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={false}
        testIdPrefix="test-"
      />
    );

    const fieldSelect = screen.getByTestId('test-condition-field-select');

    // Switch to name field
    fireEvent.change(fieldSelect, { target: { value: 'name' } });

    // Check that checkboxes are shown
    expect(
      screen.getByText('Select people who need this item:')
    ).toBeInTheDocument();

    // Check that operator is set to 'in' and disabled
    const operatorSelect = screen.getByTestId('test-condition-operator-select');
    expect(operatorSelect).toHaveValue('in');
    expect(operatorSelect).toBeDisabled();
  });

  test('should show message when no people are added to trip', () => {
    // Mock empty people array
    const mockUseAppSelector = vi.fn(() => []);
    const stateModule = require('@packing-list/state');
    stateModule.useAppSelector = mockUseAppSelector;

    render(
      <ConditionForm
        initialCondition={{
          type: 'person',
          field: 'name',
          operator: 'in',
          value: [],
        }}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={false}
        testIdPrefix="test-"
      />
    );

    expect(
      screen.getByText('No people added to this trip yet')
    ).toBeInTheDocument();
  });
});
