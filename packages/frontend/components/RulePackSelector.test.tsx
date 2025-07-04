import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RulePackSelector } from './RulePackSelector';
import * as state from '@packing-list/state';
import * as Toast from './Toast';
import type { StoreType } from '@packing-list/state';
import type { Mock } from 'vitest';
import type {
  DefaultItemRule,
  RulePack,
  RulePackVisibility,
} from '@packing-list/model';

// Mock the state and Toast modules
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  selectDefaultItemRules: vi.fn(),
}));

vi.mock('./Toast', () => ({
  showToast: vi.fn(),
}));

describe('RulePackSelector Component', () => {
  const mockDispatch = vi.fn();
  const mockOnRulesApplied = vi.fn();

  const mockRules: DefaultItemRule[] = [
    {
      id: 'beach1',
      name: 'Beach Item 1',
      calculation: {
        baseQuantity: 1,
        perDay: false,
        perPerson: false,
      },
      originalRuleId: 'beach1',
    },
    {
      id: 'beach2',
      name: 'Beach Item 2',
      calculation: {
        baseQuantity: 1,
        perDay: false,
        perPerson: false,
      },
      originalRuleId: 'beach2',
    },
    {
      id: 'camp1',
      name: 'Camp Item 1',
      calculation: {
        baseQuantity: 1,
        perDay: false,
        perPerson: false,
      },
      originalRuleId: 'camp1',
    },
  ];

  const mockRulePacks: RulePack[] = [
    {
      id: '1',
      name: 'Beach Pack',
      description: 'Essential items for beach trips',
      rules: [mockRules[0], mockRules[1]],
      author: { id: 'test', name: 'Test Author' },
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        isBuiltIn: false,
        isShared: false,
        visibility: 'private' as RulePackVisibility,
        tags: [],
        category: 'test',
        version: '1.0.0',
      },
      stats: {
        usageCount: 10,
        rating: 4.5,
        reviewCount: 2,
      },
      color: '#FFB74D',
      icon: 'sun',
    },
    {
      id: '2',
      name: 'Camping Pack',
      description: 'Must-have items for camping',
      rules: [mockRules[2]],
      author: { id: 'test', name: 'Test Author' },
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        isBuiltIn: false,
        isShared: false,
        visibility: 'private' as RulePackVisibility,
        tags: [],
        category: 'test',
        version: '1.0.0',
      },
      stats: {
        usageCount: 5,
        rating: 4.0,
        reviewCount: 1,
      },
      color: '#4CAF50',
      icon: 'tent',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: (state: StoreType) => unknown) => {
        // Mock the store state
        const mockState: StoreType = {
          trips: {
            summaries: [],
            selectedTripId: 'test-trip',
            byId: {
              'test-trip': {
                trip: {
                  id: 'test-trip',
                  days: [],
                  userId: 'test-user',
                  title: 'Test Trip',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  settings: {
                    defaultTimeZone: 'America/New_York',
                    packingViewMode: 'by-day',
                  },
                  version: 1,
                  isDeleted: false,
                  defaultItemRules: [
                    {
                      ...mockRules[0],
                      originalRuleId: 'beach1', // Matches a rule ID in Beach Pack
                      packIds: [{ packId: '1', ruleId: 'beach1' }],
                    },
                  ],
                },
                people: [],
                ruleOverrides: [],
                packingListView: {
                  filters: {
                    packed: true,
                    unpacked: true,
                    excluded: false,
                  },
                  viewMode: 'by-day',
                },
                calculated: {
                  defaultItems: [],
                  packingListItems: [],
                },
                isLoading: false,
              },
            },
          },
          rulePacks: mockRulePacks,
          ui: {
            rulePackModal: {
              isOpen: false,
              activeTab: 'browse',
            },
            loginModal: {
              isOpen: false,
            },
            flow: {
              steps: [],
              current: null,
            },
            tripWizard: {
              currentStep: 0,
            },
          },
          sync: {
            syncState: {
              isSyncing: false,
              lastSyncTimestamp: new Date().getTime(),
              pendingChanges: [],
              isOnline: true,
              conflicts: [],
            },
            isInitialized: true,
            lastError: null,
          },
          auth: {
            user: null,
            session: null,
            loading: false,
            error: null,
            lastError: null,
            isAuthenticating: false,
            isInitialized: false,
            isOfflineMode: false,
            forceOfflineMode: false,
            connectivityState: { isOnline: true, isConnected: true },
            offlineAccounts: [],
            hasOfflinePasscode: false,
          },
        };

        // Handle selectDefaultItemRules selector
        if (selector === state.selectDefaultItemRules) {
          return mockState.trips.byId['test-trip'].trip.defaultItemRules;
        }

        return selector(mockState);
      }
    );
  });

  it('renders all rule packs', () => {
    render(<RulePackSelector />);

    expect(screen.getByText('Beach Pack')).toBeInTheDocument();
    expect(screen.getByText('Camping Pack')).toBeInTheDocument();
  });

  it('shows active state for packs with active rules', () => {
    render(<RulePackSelector />);

    const beachCard = screen.getByText('Beach Pack').closest('.card');
    const campingCard = screen.getByText('Camping Pack').closest('.card');

    expect(beachCard).toHaveClass('border-primary');
    expect(campingCard).not.toHaveClass('border-primary');
  });

  it('handles adding rules', () => {
    render(<RulePackSelector onRulesApplied={mockOnRulesApplied} />);

    const addButton = screen.getByText('Add Rules');
    fireEvent.click(addButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePacks[1],
      active: true,
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Added "Camping Pack" rules');
    expect(mockOnRulesApplied).toHaveBeenCalled();
  });

  it('handles removing rules', () => {
    render(<RulePackSelector onRulesApplied={mockOnRulesApplied} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePacks[0],
      active: false,
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Removed "Beach Pack" rules');
    expect(mockOnRulesApplied).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<RulePackSelector className="custom-class" />);

    const container =
      screen.getByText('Popular Rule Packs').parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('renders check icon for active packs', () => {
    render(<RulePackSelector />);

    const activePackTitle = screen.getByText('Beach Pack').parentElement;
    const inactivePackTitle = screen.getByText('Camping Pack').parentElement;

    expect(activePackTitle?.querySelector('.lucide-check')).toBeInTheDocument();
    expect(
      inactivePackTitle?.querySelector('.lucide-check')
    ).not.toBeInTheDocument();
  });

  it('renders correct button styles based on pack state', () => {
    render(<RulePackSelector />);

    const removeButton = screen.getByText('Remove');
    const addButton = screen.getByText('Add Rules');

    expect(removeButton).toHaveClass('btn-outline', 'btn-error');
    expect(addButton).toHaveClass('btn-primary');
  });
});
