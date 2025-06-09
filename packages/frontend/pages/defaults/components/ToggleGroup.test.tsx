import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToggleGroup } from './ToggleGroup';
import type { DayCalculation } from '@packing-list/model';

describe('ToggleGroup Component', () => {
  const defaultProps = {
    perDay: false,
    perPerson: false,
    onPerDayChange: vi.fn(),
    onPerPersonChange: vi.fn(),
    onDaysPatternChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders per day and per person checkboxes', () => {
    render(<ToggleGroup {...defaultProps} />);

    expect(screen.getByTestId('per-day-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('per-person-checkbox')).toBeInTheDocument();
    expect(screen.getByText('Per Day')).toBeInTheDocument();
    expect(screen.getByText('Per Person')).toBeInTheDocument();
  });

  it('applies test id prefix to checkboxes', () => {
    render(<ToggleGroup {...defaultProps} testIdPrefix="test-" />);

    expect(screen.getByTestId('test-per-day-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('test-per-person-checkbox')).toBeInTheDocument();
  });

  it('renders optional label when provided', () => {
    render(<ToggleGroup {...defaultProps} label="Test Label" />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(<ToggleGroup {...defaultProps} />);

    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
  });

  it('calls onPerDayChange when per day checkbox is clicked', () => {
    const onPerDayChange = vi.fn();
    render(<ToggleGroup {...defaultProps} onPerDayChange={onPerDayChange} />);

    const perDayCheckbox = screen.getByTestId('per-day-checkbox');
    fireEvent.click(perDayCheckbox);

    expect(onPerDayChange).toHaveBeenCalledWith(true);
  });

  it('calls onPerPersonChange when per person checkbox is clicked', () => {
    const onPerPersonChange = vi.fn();
    render(
      <ToggleGroup {...defaultProps} onPerPersonChange={onPerPersonChange} />
    );

    const perPersonCheckbox = screen.getByTestId('per-person-checkbox');
    fireEvent.click(perPersonCheckbox);

    expect(onPerPersonChange).toHaveBeenCalledWith(true);
  });

  it('shows every N days checkbox when perDay is true', () => {
    render(<ToggleGroup {...defaultProps} perDay={true} />);

    expect(screen.getByTestId('every-n-days-checkbox')).toBeInTheDocument();
    expect(screen.getByText('Every N Days')).toBeInTheDocument();
  });

  it('hides every N days checkbox when perDay is false', () => {
    render(<ToggleGroup {...defaultProps} perDay={false} />);

    expect(
      screen.queryByTestId('every-n-days-checkbox')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Every N Days')).not.toBeInTheDocument();
  });

  it('shows days input when daysPattern is defined', () => {
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup {...defaultProps} perDay={true} daysPattern={daysPattern} />
    );

    expect(screen.getByTestId('every-n-days-input')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('hides days input when daysPattern is undefined', () => {
    render(
      <ToggleGroup {...defaultProps} perDay={true} daysPattern={undefined} />
    );

    expect(screen.queryByTestId('every-n-days-input')).not.toBeInTheDocument();
  });

  it('calls onDaysPatternChange with default pattern when every N days is enabled', () => {
    const onDaysPatternChange = vi.fn();
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const everyNDaysCheckbox = screen.getByTestId('test-every-n-days-checkbox');
    fireEvent.click(everyNDaysCheckbox);

    expect(onDaysPatternChange).toHaveBeenCalledWith({
      every: 2,
      roundUp: true,
    });
  });

  it('calls onDaysPatternChange with undefined when every N days is disabled', () => {
    const onDaysPatternChange = vi.fn();
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const everyNDaysCheckbox = screen.getByTestId('test-every-n-days-checkbox');
    fireEvent.click(everyNDaysCheckbox);

    expect(onDaysPatternChange).toHaveBeenCalledWith(undefined);
  });

  it('updates days pattern when input value changes', () => {
    const onDaysPatternChange = vi.fn();
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const daysInput = screen.getByTestId('test-every-n-days-input');
    fireEvent.change(daysInput, { target: { value: '5' } });

    expect(onDaysPatternChange).toHaveBeenCalledWith({
      every: 5,
      roundUp: true,
    });
  });

  it('handles invalid input in days pattern by defaulting to 1', () => {
    const onDaysPatternChange = vi.fn();
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const daysInput = screen.getByTestId('test-every-n-days-input');
    fireEvent.change(daysInput, { target: { value: 'invalid' } });

    expect(onDaysPatternChange).toHaveBeenCalledWith({
      every: 1,
      roundUp: true,
    });
  });

  it('handles empty input in days pattern by defaulting to 1', () => {
    const onDaysPatternChange = vi.fn();
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const daysInput = screen.getByTestId('test-every-n-days-input');
    fireEvent.change(daysInput, { target: { value: '' } });

    expect(onDaysPatternChange).toHaveBeenCalledWith({
      every: 1,
      roundUp: true,
    });
  });

  it('preserves roundUp value when updating days pattern', () => {
    const onDaysPatternChange = vi.fn();
    const daysPattern: DayCalculation = { every: 3, roundUp: false };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const daysInput = screen.getByTestId('test-every-n-days-input');
    fireEvent.change(daysInput, { target: { value: '7' } });

    expect(onDaysPatternChange).toHaveBeenCalledWith({
      every: 7,
      roundUp: false,
    });
  });

  it('sets correct input attributes for days input', () => {
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        testIdPrefix="test-"
      />
    );

    const daysInput = screen.getByTestId('test-every-n-days-input');
    expect(daysInput).toHaveAttribute('type', 'number');
    expect(daysInput).toHaveAttribute('min', '1');
    expect(daysInput).toHaveAttribute(
      'aria-label',
      'Number of days to group together'
    );
  });

  it('checks every N days checkbox when daysPattern is defined', () => {
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup {...defaultProps} perDay={true} daysPattern={daysPattern} />
    );

    const everyNDaysCheckbox = screen.getByTestId('every-n-days-checkbox');
    expect(everyNDaysCheckbox).toBeChecked();
  });

  it('unchecks every N days checkbox when daysPattern is undefined', () => {
    render(
      <ToggleGroup {...defaultProps} perDay={true} daysPattern={undefined} />
    );

    const everyNDaysCheckbox = screen.getByTestId('every-n-days-checkbox');
    expect(everyNDaysCheckbox).not.toBeChecked();
  });

  it('reflects perDay checkbox state correctly', () => {
    const { rerender } = render(
      <ToggleGroup {...defaultProps} perDay={false} />
    );

    expect(screen.getByTestId('per-day-checkbox')).not.toBeChecked();

    rerender(<ToggleGroup {...defaultProps} perDay={true} />);
    expect(screen.getByTestId('per-day-checkbox')).toBeChecked();
  });

  it('reflects perPerson checkbox state correctly', () => {
    const { rerender } = render(
      <ToggleGroup {...defaultProps} perPerson={false} />
    );

    expect(screen.getByTestId('per-person-checkbox')).not.toBeChecked();

    rerender(<ToggleGroup {...defaultProps} perPerson={true} />);
    expect(screen.getByTestId('per-person-checkbox')).toBeChecked();
  });

  it('applies correct CSS classes', () => {
    render(<ToggleGroup {...defaultProps} perDay={true} />);

    const perDayCheckbox = screen.getByTestId('per-day-checkbox');
    expect(perDayCheckbox).toHaveClass('checkbox');

    const perPersonCheckbox = screen.getByTestId('per-person-checkbox');
    expect(perPersonCheckbox).toHaveClass('checkbox');
  });

  it('handles zero value in days input', () => {
    const onDaysPatternChange = vi.fn();
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup
        {...defaultProps}
        perDay={true}
        daysPattern={daysPattern}
        onDaysPatternChange={onDaysPatternChange}
        testIdPrefix="test-"
      />
    );

    const daysInput = screen.getByTestId('test-every-n-days-input');
    fireEvent.change(daysInput, { target: { value: '0' } });

    expect(onDaysPatternChange).toHaveBeenCalledWith({
      every: 1,
      roundUp: true,
    });
  });

  it('renders tooltip elements for help text', () => {
    const daysPattern: DayCalculation = { every: 3, roundUp: true };
    render(
      <ToggleGroup {...defaultProps} perDay={true} daysPattern={daysPattern} />
    );

    // Check for tooltip on every N days checkbox
    expect(
      screen.getByText('Every N Days').closest('.tooltip')
    ).toBeInTheDocument();

    // Check for help icon tooltip on days input
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('?').closest('.tooltip')).toBeInTheDocument();
  });
});
