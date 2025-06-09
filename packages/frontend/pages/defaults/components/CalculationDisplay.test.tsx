import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalculationDisplay } from './CalculationDisplay';

describe('CalculationDisplay Component', () => {
  const defaultProps = {
    baseCalculation: {
      quantity: 1,
      perPerson: false,
      perDay: false,
    },
    peopleCount: 2,
    daysCount: 3,
  };

  it('renders simple quantity calculation', () => {
    render(<CalculationDisplay {...defaultProps} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders per person calculation', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: true,
        perDay: false,
      },
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByText('2 people')).toBeInTheDocument();
  });

  it('renders per day calculation', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
      },
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
  });

  it('renders per person and per day calculation', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 2,
        perPerson: true,
        perDay: true,
      },
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('×')).toHaveLength(2);
    expect(screen.getByText('2 people')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
  });

  it('renders days pattern with roundUp true', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
        daysPattern: { every: 2, roundUp: true },
      },
      daysCount: 5,
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByText('3 2-day periods')).toBeInTheDocument(); // Math.ceil(5/2) = 3
  });

  it('renders days pattern with roundUp false', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
        daysPattern: { every: 2, roundUp: false },
      },
      daysCount: 5,
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByText('2 2-day periods')).toBeInTheDocument(); // Math.floor(5/2) = 2
  });

  it('handles zero quantity', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 0,
        perPerson: true,
        perDay: false,
      },
    };
    render(<CalculationDisplay {...props} />);

    // Should still show people count when perPerson is true
    expect(screen.getByText('2 people')).toBeInTheDocument();
  });

  it('renders extra calculation with plus prefix', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: false,
      },
      extraCalculation: {
        quantity: 2,
        perPerson: false,
        perDay: false,
      },
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders complex extra calculation with different modifiers', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: true,
        perDay: false,
      },
      extraCalculation: {
        quantity: 2,
        perPerson: false,
        perDay: true,
      },
    };
    render(<CalculationDisplay {...props} />);

    // Base calculation
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2 people')).toBeInTheDocument();

    // Extra calculation
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
  });

  it('does not show people count when only 1 person', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: true,
        perDay: false,
      },
      peopleCount: 1,
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('1 people')).not.toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('does not show days when 0 days', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
      },
      daysCount: 0,
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('0 days')).not.toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('handles empty base calculation', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 0,
        perPerson: false,
        perDay: false,
      },
    };

    const { container } = render(<CalculationDisplay {...props} />);

    // Should render empty grid
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles extra calculation without base quantity', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 0,
        perPerson: false,
        perDay: false,
      },
      extraCalculation: {
        quantity: 3,
        perPerson: true,
        perDay: false,
      },
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2 people')).toBeInTheDocument();
  });

  it('applies correct grid styles', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: true,
        perDay: false,
      },
    };

    const { container } = render(<CalculationDisplay {...props} />);
    const gridElement = container.firstChild as HTMLElement;

    expect(gridElement).toHaveClass(
      'grid',
      'items-center',
      'justify-end',
      'gap-x-1'
    );
    expect(gridElement).toHaveStyle({
      gridTemplateColumns: 'repeat(3, auto)', // quantity + × + people
      gridTemplateRows: 'repeat(1, auto)',
      rowGap: '0.125rem',
    });
  });

  it('applies correct grid styles with extra calculation', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: false,
      },
      extraCalculation: {
        quantity: 2,
        perPerson: false,
        perDay: false,
      },
    };

    const { container } = render(<CalculationDisplay {...props} />);
    const gridElement = container.firstChild as HTMLElement;

    expect(gridElement).toHaveStyle({
      gridTemplateColumns: 'repeat(2, auto)', // prefix + quantity
      gridTemplateRows: 'repeat(2, auto)', // base + extra rows
    });
  });

  it('handles complex days pattern calculations', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
        daysPattern: { every: 7, roundUp: true },
      },
      daysCount: 10,
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
    expect(screen.getByText('2 7-day periods')).toBeInTheDocument(); // Math.ceil(10/7) = 2
  });

  it('handles both base and extra with days patterns', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
        daysPattern: { every: 2, roundUp: true },
      },
      extraCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: true,
        daysPattern: { every: 3, roundUp: false },
      },
      daysCount: 7,
    };
    render(<CalculationDisplay {...props} />);

    // Both base and extra have quantity 1, so we expect two "1" elements
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('4 2-day periods')).toBeInTheDocument(); // Math.ceil(7/2) = 4
    expect(screen.getByText('2 3-day periods')).toBeInTheDocument(); // Math.floor(7/3) = 2
  });

  it('renders multiplication symbols correctly between elements', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 2,
        perPerson: true,
        perDay: true,
      },
    };
    render(<CalculationDisplay {...props} />);

    const multiplyElements = screen.getAllByText('×');
    expect(multiplyElements).toHaveLength(2); // One between quantity and people, one between people and days
  });

  it('handles empty extra calculation quantity', () => {
    const props = {
      ...defaultProps,
      baseCalculation: {
        quantity: 1,
        perPerson: false,
        perDay: false,
      },
      extraCalculation: {
        quantity: 0,
        perPerson: true,
        perDay: false,
      },
    };
    render(<CalculationDisplay {...props} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    // Extra calculation with 0 quantity doesn't create a second row, so perPerson modifier won't show
    // The people count will only show if the extraCalculation has a non-zero quantity
    expect(screen.queryByText('2 people')).not.toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });
});
