import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuantitySection } from './QuantitySection';
import type { DayCalculation } from '@packing-list/model';

// Mock the ToggleGroup component
vi.mock('./ToggleGroup', () => ({
  ToggleGroup: vi.fn(
    ({
      perDay,
      perPerson,
      testIdPrefix,
      onPerDayChange,
      onPerPersonChange,
    }) => (
      <div data-testid={`${testIdPrefix}toggle-group`}>
        <label>
          <input
            type="checkbox"
            checked={perDay}
            onChange={(e) => onPerDayChange(e.target.checked)}
            data-testid={`${testIdPrefix}per-day-checkbox`}
          />
          Per Day
        </label>
        <label>
          <input
            type="checkbox"
            checked={perPerson}
            onChange={(e) => onPerPersonChange(e.target.checked)}
            data-testid={`${testIdPrefix}per-person-checkbox`}
          />
          Per Person
        </label>
      </div>
    )
  ),
}));

describe('QuantitySection Component', () => {
  const defaultProps = {
    quantity: 5,
    perDay: false,
    perPerson: true,
    onQuantityChange: vi.fn(),
    onPerDayChange: vi.fn(),
    onPerPersonChange: vi.fn(),
    onDaysPatternChange: vi.fn(),
  };

  it('renders quantity input with correct value', () => {
    render(<QuantitySection {...defaultProps} />);

    const quantityInput = screen.getByTestId('quantity-input');
    expect(quantityInput).toBeInTheDocument();
    expect(quantityInput).toHaveValue(5);
  });

  it('renders default label', () => {
    render(<QuantitySection {...defaultProps} />);

    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<QuantitySection {...defaultProps} label="Custom Label" />);

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument();
  });

  it('calls onQuantityChange when input value changes', () => {
    const onQuantityChange = vi.fn();
    render(
      <QuantitySection {...defaultProps} onQuantityChange={onQuantityChange} />
    );

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '10' } });

    expect(onQuantityChange).toHaveBeenCalledWith(10);
  });

  it('handles invalid input by using minimum value', () => {
    const onQuantityChange = vi.fn();
    render(
      <QuantitySection
        {...defaultProps}
        onQuantityChange={onQuantityChange}
        minQuantity={1}
      />
    );

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: 'invalid' } });

    expect(onQuantityChange).toHaveBeenCalledWith(1);
  });

  it('handles empty input by using minimum value', () => {
    const onQuantityChange = vi.fn();
    render(
      <QuantitySection
        {...defaultProps}
        onQuantityChange={onQuantityChange}
        minQuantity={0}
      />
    );

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '' } });

    expect(onQuantityChange).toHaveBeenCalledWith(0);
  });

  it('applies test id prefix to elements', () => {
    render(<QuantitySection {...defaultProps} testIdPrefix="test-" />);

    expect(screen.getByTestId('test-quantity-input')).toBeInTheDocument();
    expect(screen.getByTestId('test-toggle-group')).toBeInTheDocument();
  });

  it('sets correct input attributes', () => {
    render(
      <QuantitySection {...defaultProps} testIdPrefix="test-" minQuantity={2} />
    );

    const quantityInput = screen.getByTestId('test-quantity-input');
    expect(quantityInput).toHaveAttribute('type', 'number');
    expect(quantityInput).toHaveAttribute('min', '2');
    expect(quantityInput).toHaveAttribute('step', '1');
    expect(quantityInput).toHaveAttribute('aria-label', 'Quantity value');
  });

  it('renders in default (non-card) style', () => {
    render(<QuantitySection {...defaultProps} />);

    // Should not find card style elements
    expect(screen.queryByRole('group')).not.toBeInTheDocument();

    // Should find the default container
    const container = screen
      .getByTestId('quantity-input')
      .closest('.space-y-6');
    expect(container).toBeInTheDocument();
  });

  it('renders in card style', () => {
    render(
      <QuantitySection {...defaultProps} cardStyle={true} label="Card Label" />
    );

    // Should find the card container
    const cardGroup = screen.getByRole('group', {
      name: 'Card Label settings',
    });
    expect(cardGroup).toBeInTheDocument();
    expect(cardGroup).toHaveClass('card', 'bg-base-200', 'p-4');

    // Label should be outside the card
    expect(screen.getByText('Card Label')).toBeInTheDocument();
  });

  it('does not render label in non-card style when cardStyle is false', () => {
    render(
      <QuantitySection {...defaultProps} cardStyle={false} label="Test Label" />
    );

    // The label should be rendered normally in non-card style
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<QuantitySection {...defaultProps} className="custom-class" />);

    const container = screen
      .getByTestId('quantity-input')
      .closest('.space-y-6');
    expect(container).toHaveClass('custom-class');
  });

  it('passes correct props to ToggleGroup', () => {
    const daysPattern: DayCalculation = { every: 2, roundUp: true };
    render(
      <QuantitySection
        {...defaultProps}
        perDay={true}
        perPerson={false}
        daysPattern={daysPattern}
        testIdPrefix="custom-"
      />
    );

    // Check that ToggleGroup received the correct props through the mock
    expect(screen.getByTestId('custom-toggle-group')).toBeInTheDocument();
    expect(screen.getByTestId('custom-per-day-checkbox')).toBeChecked();
    expect(screen.getByTestId('custom-per-person-checkbox')).not.toBeChecked();
  });

  it('forwards toggle events to parent callbacks', () => {
    const onPerDayChange = vi.fn();
    const onPerPersonChange = vi.fn();

    render(
      <QuantitySection
        {...defaultProps}
        onPerDayChange={onPerDayChange}
        onPerPersonChange={onPerPersonChange}
        testIdPrefix="test-"
      />
    );

    // Test per day toggle
    const perDayCheckbox = screen.getByTestId('test-per-day-checkbox');
    fireEvent.click(perDayCheckbox);
    expect(onPerDayChange).toHaveBeenCalledWith(true);

    // Test per person toggle
    const perPersonCheckbox = screen.getByTestId('test-per-person-checkbox');
    fireEvent.click(perPersonCheckbox);
    expect(onPerPersonChange).toHaveBeenCalledWith(false); // Currently true, so click makes it false
  });

  it('handles decimal values correctly', () => {
    const onQuantityChange = vi.fn();
    render(
      <QuantitySection {...defaultProps} onQuantityChange={onQuantityChange} />
    );

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '2.5' } });

    expect(onQuantityChange).toHaveBeenCalledWith(2.5);
  });

  it('handles zero value', () => {
    const onQuantityChange = vi.fn();
    render(
      <QuantitySection {...defaultProps} onQuantityChange={onQuantityChange} />
    );

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '0' } });

    expect(onQuantityChange).toHaveBeenCalledWith(0);
  });

  it('handles large numbers', () => {
    const onQuantityChange = vi.fn();
    render(
      <QuantitySection {...defaultProps} onQuantityChange={onQuantityChange} />
    );

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '999' } });

    expect(onQuantityChange).toHaveBeenCalledWith(999);
  });
});
