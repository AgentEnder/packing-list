import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './PageHeader';
import { Provider } from 'react-redux';
import {
  authInitialState,
  createStore,
  initialState,
} from '@packing-list/state';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./Link', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PageHeader Component', () => {
  it('renders the title correctly', () => {
    render(
      <Provider store={configureStore({ reducer: (s) => s })}>
        <PageHeader title="Test Title" />
      </Provider>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders without actions', () => {
    render(
      <Provider store={configureStore({ reducer: (s) => s })}>
        <PageHeader title="Test Title" />
      </Provider>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const TestAction = <button>Test Action</button>;
    render(
      <Provider store={configureStore({ reducer: (s) => s })}>
        <PageHeader title="Test Title" actions={TestAction} />
      </Provider>
    );

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
    render(
      <Provider store={configureStore({ reducer: (s) => s })}>
        <PageHeader title="Test Title" actions={TestActions} />
      </Provider>
    );

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('renders flow back button when state has flow', () => {
    // This test requires a bit more store logic.
    const store = createStore(undefined, {
      ...initialState,
      auth: authInitialState,
      ui: {
        ...initialState.ui,
        flow: {
          steps: [
            { path: '/previous', label: 'Backcrumb' },
            { path: '/test', label: 'Test' },
          ],
          current: 1,
        },
      },
    });
    render(
      <Provider store={store}>
        <PageHeader title="Test Title" />
      </Provider>
    );
    expect(screen.getByText('Backcrumb')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Backcrumb' })).toBeInTheDocument();
  });
});
