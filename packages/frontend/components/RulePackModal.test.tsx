import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RulePackModal } from './RulePackModal';
import * as state from '@packing-list/state';
import * as Toast from './Toast';
import type { RulePack, DefaultItemRule } from '@packing-list/model';

// Mock the modules
vi.mock('@packing-list/state', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
  selectDefaultItemRules: vi.fn(),
}));

vi.mock('./Toast', () => ({
  showToast: vi.fn(),
}));

interface ModalProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

vi.mock('@packing-list/shared-components', () => ({
  Modal: ({ children, ...props }: ModalProps) => (
    <div data-testid="modal" {...props}>
      {children}
    </div>
  ),
}));

interface EditorProps {
  onSave: () => void;
  onCancel: () => void;
}

interface DetailsProps {
  pack: RulePack;
}

// Mock child components
vi.mock('./RulePackEditor', () => ({
  RulePackEditor: ({ onSave, onCancel }: EditorProps) => (
    <div data-testid="rule-pack-editor">
      <button onClick={onSave} data-testid="editor-save-button">
        Save
      </button>
      <button onClick={onCancel} data-testid="editor-cancel-button">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('./RulePackDetails', () => ({
  RulePackDetails: ({ pack }: DetailsProps) => (
    <div data-testid="rule-pack-details">Details for {pack.name}</div>
  ),
}));

// Mock URL API for export tests
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

describe('RulePackModal Component', () => {
  const mockDispatch = vi.fn();

  const mockRulePacks: RulePack[] = [
    {
      id: 'pack1',
      name: 'Beach Pack',
      description: 'Essential items for beach trips',
      author: { id: 'user1', name: 'John Doe' },
      metadata: {
        created: '2023-01-01T00:00:00Z',
        modified: '2023-01-02T00:00:00Z',
        isBuiltIn: false,
        isShared: true,
        visibility: 'public',
        tags: ['beach', 'vacation'],
        category: 'vacation',
        version: '1.0.0',
      },
      stats: {
        usageCount: 10,
        rating: 4.5,
        reviewCount: 5,
      },
      rules: [
        {
          id: 'rule1',
          name: 'Beach Towel',
          categoryId: 'beach',
          subcategoryId: 'accessories',
          conditions: [],
          calculation: {
            baseQuantity: 1,
            perDay: false,
            perPerson: true,
          },
          packIds: [{ packId: 'pack1', ruleId: 'rule1' }],
          originalRuleId: 'rule1',
        },
      ],
      icon: 'sun',
      color: '#FFB74D',
    },
    {
      id: 'pack2',
      name: 'Business Pack',
      description: 'Professional travel essentials',
      author: { id: 'builtin', name: 'System' },
      metadata: {
        created: '2023-01-01T00:00:00Z',
        modified: '2023-01-01T00:00:00Z',
        isBuiltIn: true,
        isShared: false,
        visibility: 'public',
        tags: ['business', 'work'],
        category: 'business',
        version: '1.0.0',
      },
      stats: {
        usageCount: 25,
        rating: 4.8,
        reviewCount: 12,
      },
      rules: [
        {
          id: 'rule2',
          name: 'Laptop',
          categoryId: 'electronics',
          subcategoryId: 'computer',
          conditions: [],
          calculation: {
            baseQuantity: 1,
            perDay: false,
            perPerson: false,
          },
          packIds: [{ packId: 'pack2', ruleId: 'rule2' }],
          originalRuleId: 'rule2',
        },
      ],
      icon: 'briefcase',
      color: '#78909C',
    },
  ];

  const mockDefaultRules: DefaultItemRule[] = [
    {
      id: 'rule1',
      name: 'Beach Towel',
      categoryId: 'beach',
      subcategoryId: 'accessories',
      conditions: [],
      calculation: {
        baseQuantity: 1,
        perDay: false,
        perPerson: true,
      },
      packIds: [{ packId: 'pack1', ruleId: 'rule1' }],
      originalRuleId: 'rule1',
    },
  ];

  const mockModalState = {
    isOpen: true,
    activeTab: 'browse' as const,
    selectedPackId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(state.useAppDispatch).mockReturnValue(mockDispatch);

    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      if (selector === state.selectDefaultItemRules) {
        return mockDefaultRules;
      }
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: mockModalState,
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });
  });

  it('renders nothing when modal is closed', () => {
    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: { ...mockModalState, isOpen: false },
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    const { container } = render(<RulePackModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(<RulePackModal />);

    expect(screen.getByTestId('rule-pack-modal')).toBeInTheDocument();
    expect(screen.getByTestId('browse-tab')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    render(<RulePackModal />);

    expect(screen.getByTestId('browse-tab')).toBeInTheDocument();
    expect(screen.getByTestId('manage-tab')).toBeInTheDocument();
    expect(screen.getByText('Browse Packs')).toBeInTheDocument();
    expect(screen.getByTestId('manage-tab')).toHaveTextContent('Create Pack');
  });

  it('switches tabs when clicked', () => {
    render(<RulePackModal />);

    const manageTab = screen.getByTestId('manage-tab');
    fireEvent.click(manageTab);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'manage' },
    });
  });

  it('renders browse tab content by default', () => {
    render(<RulePackModal />);

    expect(screen.getByTestId('pack-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('pack-category-select')).toBeInTheDocument();
    expect(screen.getByTestId('create-pack-button')).toBeInTheDocument();
    expect(screen.getByTestId('import-pack-button')).toBeInTheDocument();
  });

  it('renders rule packs in browse tab', () => {
    render(<RulePackModal />);

    expect(screen.getByTestId('pack-Beach Pack')).toBeInTheDocument();
    expect(screen.getByTestId('pack-Business Pack')).toBeInTheDocument();
    expect(screen.getByText('Beach Pack')).toBeInTheDocument();
    expect(screen.getByText('Business Pack')).toBeInTheDocument();
  });

  it('shows active pack indicator', () => {
    render(<RulePackModal />);

    const beachPack = screen.getByTestId('pack-Beach Pack');
    expect(beachPack).toHaveClass('border-2', 'border-primary');
  });

  it('handles search input', () => {
    render(<RulePackModal />);

    const searchInput = screen.getByTestId('pack-search-input');
    fireEvent.change(searchInput, { target: { value: 'Beach' } });

    expect(screen.getByTestId('pack-Beach Pack')).toBeInTheDocument();
    expect(screen.queryByTestId('pack-Business Pack')).not.toBeInTheDocument(); // Filtered out
  });

  it('handles category selection', () => {
    render(<RulePackModal />);

    const categorySelect = screen.getByTestId('pack-category-select');
    fireEvent.change(categorySelect, { target: { value: 'vacation' } });

    expect((categorySelect as HTMLSelectElement).value).toBe('vacation');
  });

  it('renders tag filters', () => {
    render(<RulePackModal />);

    expect(screen.getByTestId('filter-tag-beach-button')).toBeInTheDocument();
    expect(
      screen.getByTestId('filter-tag-vacation-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('filter-tag-business-button')
    ).toBeInTheDocument();
    expect(screen.getByTestId('filter-tag-work-button')).toBeInTheDocument();
  });

  it('handles tag filtering', () => {
    render(<RulePackModal />);

    const beachTag = screen.getByTestId('filter-tag-beach-button');
    fireEvent.click(beachTag);

    expect(beachTag).toHaveClass('btn-primary');
  });

  it('shows clear filters button when tags are selected', () => {
    render(<RulePackModal />);

    const beachTag = screen.getByTestId('filter-tag-beach-button');
    fireEvent.click(beachTag);

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('clears tag filters when clear button clicked', () => {
    render(<RulePackModal />);

    // Select a tag
    const beachTag = screen.getByTestId('filter-tag-beach-button');
    fireEvent.click(beachTag);

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(beachTag).toHaveClass('btn-outline');
  });

  it('handles create pack button', () => {
    render(<RulePackModal />);

    const createButton = screen.getByTestId('create-pack-button');
    fireEvent.click(createButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'manage' },
    });
  });

  it('renders pack actions for non-built-in packs', () => {
    render(<RulePackModal />);

    expect(
      screen.getByTestId('edit-pack-Beach Pack-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('export-pack-Beach Pack-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('delete-pack-Beach Pack-button')
    ).toBeInTheDocument();
  });

  it('does not render edit/export/delete actions for built-in packs', () => {
    render(<RulePackModal />);

    expect(
      screen.queryByTestId('edit-pack-Business Pack-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('export-pack-Business Pack-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('delete-pack-Business Pack-button')
    ).not.toBeInTheDocument();
  });

  it('handles edit pack action', () => {
    render(<RulePackModal />);

    const editButton = screen.getByTestId('edit-pack-Beach Pack-button');
    fireEvent.click(editButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'manage' },
    });
  });

  it('handles delete pack action', () => {
    render(<RulePackModal />);

    const deleteButton = screen.getByTestId('delete-pack-Beach Pack-button');
    fireEvent.click(deleteButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'DELETE_RULE_PACK',
      payload: { id: 'pack1' },
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Deleted "Beach Pack"');
  });

  it('handles export pack action', () => {
    render(<RulePackModal />);

    const exportButton = screen.getByTestId('export-pack-Beach Pack-button');
    fireEvent.click(exportButton);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(Toast.showToast).toHaveBeenCalledWith('Exported "Beach Pack"');
  });

  it('handles toggle pack action for inactive pack', () => {
    render(<RulePackModal />);

    const toggleButton = screen.getByTestId('apply-pack-Business Pack-button');
    fireEvent.click(toggleButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePacks[1],
      active: true,
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Added "Business Pack" rules');
  });

  it('handles toggle pack action for active pack', () => {
    render(<RulePackModal />);

    const toggleButton = screen.getByTestId('remove-pack-Beach Pack-button');
    fireEvent.click(toggleButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_RULE_PACK',
      pack: mockRulePacks[0],
      active: false,
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Removed "Beach Pack" rules');
  });

  it('handles pack card click to view details', () => {
    render(<RulePackModal />);

    const packCard = screen.getByTestId('pack-Beach Pack');
    fireEvent.click(packCard);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'details', packId: 'pack1' },
    });
  });

  it('renders manage tab with editor when in manage mode', () => {
    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: { ...mockModalState, activeTab: 'manage' },
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<RulePackModal />);

    expect(screen.getByTestId('rule-pack-editor')).toBeInTheDocument();
  });

  it('handles editor save in manage tab', () => {
    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: { ...mockModalState, activeTab: 'manage' },
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<RulePackModal />);

    const saveButton = screen.getByTestId('editor-save-button');
    fireEvent.click(saveButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'browse' },
    });
  });

  it('handles editor cancel in manage tab', () => {
    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: { ...mockModalState, activeTab: 'manage' },
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<RulePackModal />);

    const cancelButton = screen.getByTestId('editor-cancel-button');
    fireEvent.click(cancelButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'browse' },
    });
  });

  it('renders details tab when in details mode', () => {
    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: {
            ...mockModalState,
            activeTab: 'details',
            selectedPackId: 'pack1',
          },
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<RulePackModal />);

    expect(screen.getByTestId('details-tab')).toBeInTheDocument();
    expect(screen.getByTestId('rule-pack-details')).toBeInTheDocument();
    expect(screen.getByText('Details for Beach Pack')).toBeInTheDocument();
  });

  it('shows Edit Pack text when editing a pack', () => {
    // Ensure currentRules is defined for this test
    vi.mocked(state.useAppSelector).mockImplementation((selector) => {
      if (selector === state.selectDefaultItemRules) {
        return mockDefaultRules; // Ensure this is not undefined
      }
      const mockState = {
        rulePacks: mockRulePacks,
        ui: {
          rulePackModal: { ...mockModalState, activeTab: 'browse' },
        },
      };
      return selector(mockState as unknown as Parameters<typeof selector>[0]);
    });

    render(<RulePackModal />);

    const editButton = screen.getByTestId('edit-pack-Beach Pack-button');
    fireEvent.click(editButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'manage' },
    });
  });

  it('handles import file selection', () => {
    const mockFile = new File(['{"name": "Test Pack"}'], 'test.json', {
      type: 'application/json',
    });
    const mockFileReader = {
      onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
      readAsText: vi.fn(),
      result: '{"name": "Test Pack", "id": "test"}',
    };

    vi.spyOn(window, 'FileReader').mockImplementation(
      () => mockFileReader as unknown as FileReader
    );

    render(<RulePackModal />);

    const fileInput = document.getElementById(
      'import-file-input'
    ) as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Simulate FileReader completion
    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: '{"name": "Test Pack", "id": "test"}' },
      } as ProgressEvent<FileReader>);
    }

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CREATE_RULE_PACK',
      payload: { name: 'Test Pack', id: 'test' },
    });
    expect(Toast.showToast).toHaveBeenCalledWith('Imported "Test Pack"');
  });

  it('handles escape key to close modal', () => {
    render(<RulePackModal />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CLOSE_RULE_PACK_MODAL',
    });
  });

  it('displays pack metadata correctly', () => {
    render(<RulePackModal />);

    // Check Beach Pack metadata - use getAllByText for duplicates
    expect(screen.getAllByText('1 rules')[0]).toBeInTheDocument();
    expect(screen.getByText('10 uses')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('renders pack icons correctly', () => {
    render(<RulePackModal />);

    // Icons are rendered as components, check they exist in the dom
    const beachPackCard = screen.getByTestId('pack-Beach Pack');
    const businessPackCard = screen.getByTestId('pack-Business Pack');

    expect(beachPackCard).toBeInTheDocument();
    expect(businessPackCard).toBeInTheDocument();
  });

  it('renders pack tags with correct styling', () => {
    render(<RulePackModal />);

    // Use getAllByText for duplicate tags
    expect(screen.getAllByText('beach').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('vacation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('business').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('work').length).toBeGreaterThanOrEqual(1);
  });
});
