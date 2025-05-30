import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader Component', () => {
  it('renders the title correctly', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders without actions', () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const TestAction = <button>Test Action</button>;
    render(<PageHeader title="Test Title" actions={TestAction} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders multiple actions', () => {
    const TestActions = (
      <>
        <button>Action 1</button>
        <button>Action 2</button>
      </>
    );
    render(<PageHeader title="Test Title" actions={TestActions} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });
});
