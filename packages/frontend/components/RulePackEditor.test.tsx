import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RulePackEditor } from './RulePackEditor';
import * as state from '@packing-list/state';
import * as Toast from './Toast';
import type { RulePack, DefaultItemRule } from '@packing-list/model';
import type { Mock } from 'vitest';

// Mock the state and Toast modules
vi.mock('@packing-list/state', () => ({
  useAppDispatch: vi.fn(),
}));

vi.mock('./Toast', () => ({
  showToast: vi.fn(),
}));

// Mock RulePackRuleSelector component
interface RuleSelectorProps {
  onRulesChange: (rules: unknown[]) => void;
  selectedRules: unknown[];
}

vi.mock('./RulePackRuleSelector', () => ({
  RulePackRuleSelector: ({
    onRulesChange,
    selectedRules,
  }: RuleSelectorProps) => (
    <div data-testid="rule-pack-rule-selector">
      <div data-testid="selected-rules-count">{selectedRules.length} rules</div>
      <button
        data-testid="add-rule-button"
        onClick={() =>
          onRulesChange([
            ...selectedRules,
            { id: 'new-rule', name: 'New Rule' },
          ])
        }
      >
        Add Rule
      </button>
      <button
        data-testid="remove-rule-button"
        onClick={() => onRulesChange(selectedRules.slice(0, -1))}
      >
        Remove Rule
      </button>
    </div>
  ),
}));

describe('RulePackEditor Component', () => {
  const mockDispatch = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockRules: DefaultItemRule[] = [
    {
      id: 'rule1',
      name: 'Beach Towel',
      calculation: { baseQuantity: 1, perDay: false, perPerson: true },
      categoryId: 'beach',
      notes: 'Essential for beach trips',
    },
    {
      id: 'rule2',
      name: 'Sunscreen',
      calculation: { baseQuantity: 1, perDay: false, perPerson: false },
      categoryId: 'beach',
    },
  ];

  const mockExistingPack: RulePack = {
    id: 'pack1',
    name: 'Beach Essentials',
    description: 'Everything you need for a perfect beach day',
    rules: mockRules,
    author: { id: 'author1', name: 'Beach Expert' },
    metadata: {
      created: '2023-01-01T00:00:00Z',
      modified: '2023-01-01T00:00:00Z',
      isBuiltIn: false,
      isShared: true,
      visibility: 'public',
      tags: ['beach', 'summer'],
      category: 'vacation',
      version: '1.0.0',
    },
    stats: {
      usageCount: 150,
      rating: 4.5,
      reviewCount: 23,
    },
    color: '#FFB74D',
    icon: 'Sun',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders create mode when no pack is provided', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('rule-pack-editor')).toBeInTheDocument();
    expect(screen.getByText('Create New Rule Pack')).toBeInTheDocument();
  });

  it('renders edit mode when pack is provided', () => {
    render(
      <RulePackEditor
        pack={mockExistingPack}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Rule Pack')).toBeInTheDocument();
  });

  it('pre-fills form fields when editing existing pack', () => {
    render(
      <RulePackEditor
        pack={mockExistingPack}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByTestId(
      'rule-pack-name-input'
    ) as HTMLInputElement;
    const descriptionInput = screen.getByTestId(
      'rule-pack-description-input'
    ) as HTMLTextAreaElement;

    expect(nameInput.value).toBe('Beach Essentials');
    expect(descriptionInput.value).toBe(
      'Everything you need for a perfect beach day'
    );
  });

  it('allows editing name field', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const nameInput = screen.getByTestId('rule-pack-name-input');
    fireEvent.change(nameInput, { target: { value: 'My New Pack' } });

    expect((nameInput as HTMLInputElement).value).toBe('My New Pack');
  });

  it('allows editing description field', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const descriptionInput = screen.getByTestId('rule-pack-description-input');
    fireEvent.change(descriptionInput, {
      target: { value: 'A great pack for trips' },
    });

    expect((descriptionInput as HTMLTextAreaElement).value).toBe(
      'A great pack for trips'
    );
  });

  it('renders category dropdown with options', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const categorySelect = screen.getByTestId('rule-pack-category-select');
    expect(categorySelect).toBeInTheDocument();

    expect(screen.getByText('Vacation')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Outdoor')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('allows changing category', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const categorySelect = screen.getByTestId('rule-pack-category-select');
    fireEvent.change(categorySelect, { target: { value: 'business' } });

    expect((categorySelect as HTMLSelectElement).value).toBe('business');
  });

  it('renders tag input and allows adding tags', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const tagInput = screen.getByTestId('rule-pack-tag-input');
    const addTagButton = screen.getByTestId('rule-pack-add-tag-button');

    fireEvent.change(tagInput, { target: { value: 'summer' } });
    fireEvent.click(addTagButton);

    expect(screen.getByTestId('rule-pack-tag-summer')).toBeInTheDocument();
    expect((tagInput as HTMLInputElement).value).toBe('');
  });

  it('allows removing tags', () => {
    render(
      <RulePackEditor
        pack={mockExistingPack}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Existing pack has 'beach' and 'summer' tags
    expect(screen.getByTestId('rule-pack-tag-beach')).toBeInTheDocument();
    expect(screen.getByTestId('rule-pack-tag-summer')).toBeInTheDocument();

    const removeBeachButton = screen.getByTestId(
      'rule-pack-remove-tag-beach-button'
    );
    fireEvent.click(removeBeachButton);

    expect(screen.queryByTestId('rule-pack-tag-beach')).not.toBeInTheDocument();
    expect(screen.getByTestId('rule-pack-tag-summer')).toBeInTheDocument();
  });

  it('prevents adding duplicate tags', () => {
    render(
      <RulePackEditor
        pack={mockExistingPack}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByTestId('rule-pack-tag-input');
    const addTagButton = screen.getByTestId('rule-pack-add-tag-button');

    fireEvent.change(tagInput, { target: { value: 'beach' } }); // Already exists
    fireEvent.click(addTagButton);

    // Should still only have one beach tag
    expect(screen.getAllByTestId('rule-pack-tag-beach')).toHaveLength(1);
  });

  it('prevents adding empty tags', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const tagInput = screen.getByTestId('rule-pack-tag-input');
    const addTagButton = screen.getByTestId('rule-pack-add-tag-button');

    fireEvent.change(tagInput, { target: { value: '   ' } }); // Whitespace only
    fireEvent.click(addTagButton);

    // No tag badge should appear (look for actual tags, not inputs)
    const tagBadges = screen
      .queryAllByTestId(/^rule-pack-tag-.+$/)
      .filter(
        (el) =>
          el.tagName.toLowerCase() === 'span' && el.classList.contains('badge')
      );
    expect(tagBadges).toHaveLength(0);
  });

  it('renders color selection options', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Check for color buttons
    expect(
      screen.getByTestId('rule-pack-color-#FFB74D-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rule-pack-color-#F44336-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rule-pack-color-#4CAF50-button')
    ).toBeInTheDocument();
  });

  it('allows selecting different colors', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const redColorOption = screen.getByTestId('rule-pack-color-#F44336-button');
    fireEvent.click(redColorOption);

    expect(redColorOption).toHaveClass('ring-2', 'ring-primary');
  });

  it('renders icon selection options', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('rule-pack-icon-sun-button')).toBeInTheDocument();
    expect(
      screen.getByTestId('rule-pack-icon-briefcase-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rule-pack-icon-tent-button')
    ).toBeInTheDocument();
  });

  it('allows selecting different icons', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const briefcaseIcon = screen.getByTestId('rule-pack-icon-briefcase-button');
    fireEvent.click(briefcaseIcon);

    expect(briefcaseIcon).toHaveClass('btn-primary');
  });

  it('renders visibility options', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(
      screen.getByTestId('rule-pack-visibility-select')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Private')).toBeInTheDocument();
  });

  it('allows changing visibility', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const visibilitySelect = screen.getByTestId('rule-pack-visibility-select');
    fireEvent.change(visibilitySelect, { target: { value: 'public' } });

    expect((visibilitySelect as HTMLSelectElement).value).toBe('public');
  });

  it('renders rule selector component', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('rule-pack-rule-selector')).toBeInTheDocument();
  });

  it('updates selected rules when rule selector changes', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('selected-rules-count')).toHaveTextContent(
      '0 rules'
    );

    const addRuleButton = screen.getByTestId('add-rule-button');
    fireEvent.click(addRuleButton);

    expect(screen.getByTestId('selected-rules-count')).toHaveTextContent(
      '1 rules'
    );
  });

  it('shows validation error when trying to save without name', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(Toast.showToast).toHaveBeenCalledWith(
      'Please enter a name for the rule pack'
    );
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows validation error when trying to save without rules', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const nameInput = screen.getByTestId('rule-pack-name-input');
    fireEvent.change(nameInput, { target: { value: 'Test Pack' } });

    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(Toast.showToast).toHaveBeenCalledWith(
      'Please add at least one rule to the pack'
    );
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('creates new pack when form is valid', () => {
    // Mock current time for predictable ID
    const mockTime = 1640995200000; // 2022-01-01T00:00:00.000Z
    vi.setSystemTime(mockTime);

    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Fill in form
    const nameInput = screen.getByTestId('rule-pack-name-input');
    fireEvent.change(nameInput, { target: { value: 'Test Pack' } });

    const descriptionInput = screen.getByTestId('rule-pack-description-input');
    fireEvent.change(descriptionInput, {
      target: { value: 'Test description' },
    });

    // Add a rule
    const addRuleButton = screen.getByTestId('add-rule-button');
    fireEvent.click(addRuleButton);

    // Save
    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CREATE_RULE_PACK',
      payload: expect.objectContaining({
        id: `pack-${mockTime}`,
        name: 'Test Pack',
        description: 'Test description',
        rules: [{ id: 'new-rule', name: 'New Rule' }],
      }),
    });

    expect(Toast.showToast).toHaveBeenCalledWith(
      'Created new rule pack "Test Pack"'
    );
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('updates existing pack when editing', () => {
    render(
      <RulePackEditor
        pack={mockExistingPack}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Change name
    const nameInput = screen.getByTestId('rule-pack-name-input');
    fireEvent.change(nameInput, { target: { value: 'Updated Pack Name' } });

    // Save
    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_RULE_PACK',
      payload: expect.objectContaining({
        id: 'pack1',
        name: 'Updated Pack Name',
        metadata: expect.objectContaining({
          created: '2023-01-01T00:00:00Z',
          modified: expect.any(String),
        }),
      }),
    });

    expect(Toast.showToast).toHaveBeenCalledWith(
      'Updated rule pack "Updated Pack Name"'
    );
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByTestId('rule-pack-cancel-button');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('preserves existing pack properties when updating', () => {
    render(
      <RulePackEditor
        pack={mockExistingPack}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_RULE_PACK',
      payload: expect.objectContaining({
        author: mockExistingPack.author,
        stats: mockExistingPack.stats,
        metadata: expect.objectContaining({
          created: mockExistingPack.metadata.created,
          isBuiltIn: mockExistingPack.metadata.isBuiltIn,
          version: mockExistingPack.metadata.version,
        }),
      }),
    });
  });

  it('trims whitespace from name and description', () => {
    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Fill in form with whitespace
    const nameInput = screen.getByTestId('rule-pack-name-input');
    fireEvent.change(nameInput, { target: { value: '  Test Pack  ' } });

    const descriptionInput = screen.getByTestId('rule-pack-description-input');
    fireEvent.change(descriptionInput, {
      target: { value: '  Test description  ' },
    });

    // Add a rule
    const addRuleButton = screen.getByTestId('add-rule-button');
    fireEvent.click(addRuleButton);

    // Save
    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CREATE_RULE_PACK',
      payload: expect.objectContaining({
        name: 'Test Pack',
        description: 'Test description',
      }),
    });
  });

  it('sets default values for new pack', () => {
    const mockTime = 1640995200000;
    vi.setSystemTime(mockTime);

    render(<RulePackEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    const nameInput = screen.getByTestId('rule-pack-name-input');
    fireEvent.change(nameInput, { target: { value: 'Test Pack' } });

    const addRuleButton = screen.getByTestId('add-rule-button');
    fireEvent.click(addRuleButton);

    const saveButton = screen.getByTestId('rule-pack-save-button');
    fireEvent.click(saveButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CREATE_RULE_PACK',
      payload: expect.objectContaining({
        author: { id: 'user', name: 'User' },
        metadata: expect.objectContaining({
          isBuiltIn: false,
          isShared: false,
          visibility: 'private',
          tags: [],
          category: 'other',
          version: '1.0.0',
        }),
        stats: {
          usageCount: 0,
          rating: 5,
          reviewCount: 0,
        },
        color: '#FFB74D',
        icon: 'sun',
      }),
    });
  });
});
