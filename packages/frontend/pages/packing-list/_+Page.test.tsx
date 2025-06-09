import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PackingListPage from './+Page';

// Mock state
vi.mock('@packing-list/state', () => ({
  selectSelectedTripId: vi.fn(),
  useAppSelector: vi.fn(),
}));

// Mock components
interface PageContainerProps {
  children: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
}

interface NoTripSelectedProps {
  title: string;
  message: string;
  actionText: string;
  actionHref: string;
}

vi.mock('./components/PackingList', () => ({
  PackingList: () => (
    <div data-testid="packing-list">Packing List Component</div>
  ),
}));

vi.mock('../../components/PageContainer', () => ({
  PageContainer: ({ children }: PageContainerProps) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

vi.mock('../../components/PageHeader', () => ({
  PageHeader: ({ title }: PageHeaderProps) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
    </header>
  ),
}));

vi.mock('../../components/NoTripSelected', () => ({
  NoTripSelected: ({
    title,
    message,
    actionText,
    actionHref,
  }: NoTripSelectedProps) => (
    <div data-testid="no-trip-selected">
      <h2>{title}</h2>
      <p>{message}</p>
      <a href={actionHref}>{actionText}</a>
    </div>
  ),
}));

import { useAppSelector } from '@packing-list/state';

describe('PackingListPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders NoTripSelected when no trip is selected', () => {
    vi.mocked(useAppSelector).mockReturnValue(null);

    render(<PackingListPage />);

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText('Packing List')).toBeInTheDocument();
    expect(screen.getByTestId('no-trip-selected')).toBeInTheDocument();
    expect(screen.getByText('No Trip Selected')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You need to select a trip before you can view your packing list. Each trip has its own customized list based on travelers, duration, and destinations.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('View My Trips')).toBeInTheDocument();
    expect(screen.queryByTestId('packing-list')).not.toBeInTheDocument();
  });

  it('renders NoTripSelected when selectedTripId is undefined', () => {
    vi.mocked(useAppSelector).mockReturnValue(undefined);

    render(<PackingListPage />);

    expect(screen.getByTestId('no-trip-selected')).toBeInTheDocument();
    expect(screen.queryByTestId('packing-list')).not.toBeInTheDocument();
  });

  it('renders NoTripSelected when selectedTripId is empty string', () => {
    vi.mocked(useAppSelector).mockReturnValue('');

    render(<PackingListPage />);

    expect(screen.getByTestId('no-trip-selected')).toBeInTheDocument();
    expect(screen.queryByTestId('packing-list')).not.toBeInTheDocument();
  });

  it('renders PackingList when trip is selected', () => {
    vi.mocked(useAppSelector).mockReturnValue('trip-123');

    render(<PackingListPage />);

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByTestId('packing-list')).toBeInTheDocument();
    expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('no-trip-selected')).not.toBeInTheDocument();
  });

  it('renders PackingList for any truthy trip ID', () => {
    vi.mocked(useAppSelector).mockReturnValue('any-trip-id');

    render(<PackingListPage />);

    expect(screen.getByTestId('packing-list')).toBeInTheDocument();
    expect(screen.queryByTestId('no-trip-selected')).not.toBeInTheDocument();
  });

  it('passes correct props to NoTripSelected', () => {
    vi.mocked(useAppSelector).mockReturnValue(null);

    render(<PackingListPage />);

    const actionLink = screen.getByText('View My Trips');
    expect(actionLink.closest('a')).toHaveAttribute('href', '/trips');
  });

  it('calls useAppSelector with selectSelectedTripId', () => {
    const mockSelector = vi.fn().mockReturnValue('trip-123');
    vi.mocked(useAppSelector).mockImplementation(mockSelector);

    render(<PackingListPage />);

    expect(mockSelector).toHaveBeenCalledTimes(1);
  });

  it('renders PageContainer in both states', () => {
    // Test with no trip
    vi.mocked(useAppSelector).mockReturnValue(null);
    const { rerender } = render(<PackingListPage />);
    expect(screen.getByTestId('page-container')).toBeInTheDocument();

    // Test with trip
    vi.mocked(useAppSelector).mockReturnValue('trip-123');
    rerender(<PackingListPage />);
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('displays helpful message in no trip state', () => {
    vi.mocked(useAppSelector).mockReturnValue(null);

    render(<PackingListPage />);

    expect(
      screen.getByText(/Each trip has its own customized list/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/based on travelers, duration, and destinations/)
    ).toBeInTheDocument();
  });

  it('renders page header only when no trip is selected', () => {
    // No trip selected
    vi.mocked(useAppSelector).mockReturnValue(null);
    const { rerender } = render(<PackingListPage />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();

    // Trip selected
    vi.mocked(useAppSelector).mockReturnValue('trip-123');
    rerender(<PackingListPage />);
    expect(screen.queryByTestId('page-header')).not.toBeInTheDocument();
  });
});
